import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import Toolbar, { Item } from "devextreme-react/toolbar";
import { DataGridRef } from "devextreme-react/data-grid";
import { SortableRef } from "devextreme-react/sortable";
import { exportDataGrid } from "devextreme/pdf_exporter";
import { exportDataGrid as exportDataGridXSLX } from "devextreme/excel_exporter";
import LoadPanel from "devextreme-react/load-panel";
import Button from "devextreme-react/button";
import TextBox, { TextBoxTypes } from "devextreme-react/text-box";
import Tabs from "devextreme-react/tabs";
import notify from "devextreme/ui/notify";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import {
  TaskListGrid,
  TaskListKanban,
  FormPopup,
  TaskFormDetails,
} from "../../components";
import { useScreenSize } from "../../utils/media-query";
import { newTask as newTaskDefaults } from "../../shared/constants";
import { Task } from "../../types/task";

import "./planning-task-list.scss";
import { taskApi } from "../../api/task";
import { userApi } from "../../api/user";
import { departmentApi } from "../../api/department";
import { useAuth } from "../../contexts/auth";

const listsData = ["Danh sách", "Bảng Kanban"];

export const PlanningTaskList = () => {
  const gridRef = useRef<DataGridRef>(null);
  const kanbanRef = useRef<SortableRef>(null);

  const [view, setView] = useState(listsData[0]);
  const [index, setIndex] = useState(0);
  const [gridData, setGridData] = useState<Task[]>([]);
  const [filteredData, setFilteredData] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupVisible, setPopupVisible] = useState(false);
  const [formTaskInitData, setFormTaskInitData] = useState<Task>({
    ...newTaskDefaults,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState(""); // 🔄

  const { isXSmall } = useScreenSize();
  const { user } = useAuth();
  const isDataGrid = view === listsData[0];
  const isKanban = view === listsData[1];
  const isUser = user?.role === "User";

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchReferenceData = useCallback(async () => {
    const [userRes, deptRes] = await Promise.all([
      userApi.getAll(),
      departmentApi.getAll(),
    ]);

    const usersData = userRes.isOk ? userRes.data ?? [] : [];
    const departmentsData = deptRes.isOk ? deptRes.data ?? [] : [];

    setUsers(usersData);
    setDepartments(departmentsData);

    return { users: usersData, departments: departmentsData };
  }, []);

  const mapTaskData = useCallback(
    (tasks: Task[], users: any[], departments: any[]) => {
      return tasks.map((task) => {
        const assignedNames = (task.assignedTo ?? []).map((id) => {
          const user = users.find((u) => u.id === id);
          return user ? `${user.firstname} ${user.lastname}` : id;
        });
        const departmentName =
          departments.find((d) => d.id === task.departmentId)?.departmentName ??
          "";

        return {
          ...task,
          assignedToNames: assignedNames,
          departmentName,
        };
      });
    },
    []
  );

  const fetchTasks = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setIsRefreshing(!showLoading);

      try {
        let currentUsers = users;
        let currentDepartments = departments;

        if (users.length === 0 || departments.length === 0) {
          const refData = await fetchReferenceData();
          currentUsers = refData.users;
          currentDepartments = refData.departments;
        }

        const taskRes = await taskApi.getAll();
        const tasks = taskRes.isOk ? taskRes.data ?? [] : [];

        const mappedTasks = mapTaskData(
          tasks,
          currentUsers,
          currentDepartments
        );

        let finalTasks = mappedTasks;

        // ✅ Lọc theo vai trò
        if (user?.role === "User") {
          finalTasks = mappedTasks.filter((task) =>
            task.assignedTo?.includes(user.id)
          );
        } else if (user?.role === "Manager") {
          const userDeptId = user.departmentId;
          finalTasks = mappedTasks.filter(
            (task) => task.departmentId === userDeptId
          );
        }

        setGridData(finalTasks);
        setFilteredData(
          finalTasks.filter((task) => task.status && task.priority)
        );
      } catch (error) {
        console.error("Error fetching tasks:", error);
        notify("Error fetching tasks", "error", 3000);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [users, departments, fetchReferenceData, mapTaskData, user]
  );

  useEffect(() => {
    fetchTasks(true);
  }, []);

  const handleDataChanged = useCallback(() => {
    fetchTasks(false);
  }, [fetchTasks]);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  const onTabClick = useCallback((e: { itemData?: string }) => {
    const newView = e.itemData || "";
    setView(newView);
    setIndex(listsData.findIndex((d) => d === newView));
  }, []);

  const onAddTaskClick = useCallback(() => {
    setFormTaskInitData({ ...newTaskDefaults });
    setPopupVisible(true);
  }, []);

  const onDataChanged = useCallback((data: Task) => {
    setFormTaskInitData(data);
  }, []);

  const onSaveClick = useCallback(async () => {
    try {
      const res = await taskApi.create(formTaskInitData);
      if (res.isOk) {
        const newTask = res.data || formTaskInitData;
        const mappedNewTask = mapTaskData([newTask], users, departments)[0];

        setGridData((prevData) => [...prevData, mappedNewTask]);
        if (mappedNewTask.status && mappedNewTask.priority) {
          setFilteredData((prevData) => [...prevData, mappedNewTask]);
        }

        notify(`Task "${formTaskInitData.title}" created`, "success", 3000);
        setPopupVisible(false);

        setTimeout(() => handleDataChanged(), 100);
      } else {
        notify(`Failed to create task: ${res.message}`, "error", 3000);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      notify("Error creating task", "error", 3000);
    }
  }, [formTaskInitData, handleDataChanged, mapTaskData, users, departments]);

  const refresh = useCallback(async () => {
    await fetchTasks(false);
  }, [fetchTasks]);

  const showColumnChooser = useCallback(() => {
    gridRef.current?.instance().showColumnChooser();
  }, []);

  const exportToPDF = useCallback(() => {
    if (isDataGrid) {
      const doc = new jsPDF();
      exportDataGrid({
        jsPDFDocument: doc,
        component: gridRef.current?.instance(),
      }).then(() => {
        doc.save("Tasks.pdf");
      });
    }
  }, [isDataGrid]);

  const exportToXSLX = useCallback(() => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Tasks");
    exportDataGridXSLX({
      component: gridRef.current?.instance(),
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "Tasks.xlsx"
        );
      });
    });
  }, []);

  const search = useCallback((e: TextBoxTypes.InputEvent) => {
    const text = e.component.option("text") ?? "";
    setSearchText(text); // 🔄
    gridRef.current?.instance().searchByText(text);
  }, []);

  const getTabsWidth = useCallback(() => {
    return isXSmall ? 220 : "auto";
  }, [isXSmall]);

  // 🔄 Lọc dữ liệu cho Kanban theo searchText
  const kanbanData = useMemo(() => {
    if (!searchText.trim()) return filteredData;
    const search = searchText.toLowerCase();
    return filteredData.filter(
      (task) =>
        task.title?.toLowerCase().includes(search) ||
        task.detail?.toLowerCase().includes(search) ||
        task.assignedTo?.some((name) =>
          name.toLowerCase().includes(search)
        )
    );
  }, [filteredData, searchText]);

  const toolbarItems = useMemo(
    () => [
      {
        location: "before" as const,
        widget: "dxTabs" as const,
        options: {
          dataSource: listsData,
          width: getTabsWidth(),
          selectedIndex: index,
          scrollByContent: true,
          showNavButtons: false,
          onItemClick: onTabClick,
        },
      },
    ],
    [index, getTabsWidth, onTabClick]
  );

  return (
    <div className="view-wrapper view-wrapper-task-list list-page">
      <Toolbar className="toolbar-common theme-dependent">
        <Item location="before">
          <span className="toolbar-header" style={{ fontWeight: "bold", fontSize: "19px" }}>Cách thức hiển thị</span>
        </Item>
        <Item location="before" widget="dxTabs">
          <Tabs
            dataSource={listsData}
            width={getTabsWidth()}
            selectedIndex={index}
            scrollByContent
            showNavButtons={false}
            onItemClick={onTabClick}
            className="planning-tabs"
          />
        </Item>

        {!isUser && (
          <Item location="after" widget="dxButton">
            <Button
              icon="plus"
              text="Tạo công việc"
              type="default"
              stylingMode="contained"
              onClick={onAddTaskClick}
            />
          </Item>
        )}

        <Item location="after" widget="dxButton">
          <Button
            icon="refresh"
            text="Làm mới"
            stylingMode="text"
            onClick={refresh}
            disabled={isRefreshing}
          />
        </Item>

        <Item location="after" widget="dxButton" disabled={!isDataGrid}>
          <Button
            icon="columnchooser"
            text="Truy xuất cột"
            stylingMode="text"
            onClick={showColumnChooser}
          />
        </Item>

        <Item location="after">
          <div className="separator" />
        </Item>

        <Item location="after" widget="dxButton">
          <Button
            icon="exportpdf"
            text="Xuất file PDF"
            stylingMode="text"
            onClick={exportToPDF}
          />
        </Item>

        <Item location="after" widget="dxButton">
          <Button
            icon="exportxlsx"
            text="Xuất file Excel"
            stylingMode="text"
            onClick={exportToXSLX}
          />
        </Item>

        <Item location="after" widget="dxTextBox">
          <TextBox
            mode="search"
            placeholder="Tìm kiếm công việc"
            onInput={search}
          />
        </Item>
      </Toolbar>

      {loading && (
        <LoadPanel
          container=".content"
          showPane={false}
          visible
          position={{ of: ".content" }}
        />
      )}

      {!loading && isDataGrid && (
        <TaskListGrid
          dataSource={gridData}
          ref={gridRef}
          onDataChanged={handleDataChanged}
        />
      )}

      {!loading && isKanban && (
        <TaskListKanban
          dataSource={kanbanData} // 🔄
          ref={kanbanRef}
          changePopupVisibility={() => changePopupVisibility(!popupVisible)}
        />
      )}

      <FormPopup
        title="Tạo công việc mới"
        visible={popupVisible}
        setVisible={changePopupVisibility}
        hideSaveButton={true}
      >
        <TaskFormDetails data={formTaskInitData} onUpdated={refresh} />
      </FormPopup>
    </div>
  );
};
