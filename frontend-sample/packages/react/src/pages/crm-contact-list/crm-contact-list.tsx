import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DataGrid,
  DataGridRef,
  Sorting,
  Selection,
  HeaderFilter,
  Scrolling,
  SearchPanel,
  ColumnChooser,
  Export,
  Column,
  Toolbar,
  Item,
  LoadPanel,
  Paging,
  Pager,
  DataGridTypes,
} from "devextreme-react/data-grid";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver-es";
import { jsPDF as JsPdf } from "jspdf";
import { exportDataGrid as exportDataGridToPdf } from "devextreme/pdf_exporter";
import { exportDataGrid as exportDataGridToXLSX } from "devextreme/excel_exporter";
import Button from "devextreme-react/button";
import TextBox, { TextBoxTypes } from "devextreme-react/text-box";
import notify from "devextreme/ui/notify";

import { FormPopup, ContactNewForm, ContactPanel } from "../../components";
import { userApi } from "../../api/user";
import { departmentApi } from "../../api/department";
import { User } from "../../types/auth";
import { formatPhone } from "../../utils/format-phone";
import { renderStatusTag } from "../../utils/status-color";

import "./crm-contact-list.scss";
import { Department } from "../../types/department";
import { useAuth } from "../../contexts/auth";
// ===== Defaults =====
const formDataDefaults: Partial<User> = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  address: "",
  position: "",
  departmentId: undefined,
  image: "",
  status: "Salaried",
  password: "", // Will be hashed before sending
  username: "",
  phoneNumber: "",
  gender: "",
  role: "User", // Default role
  country: "",
  city: "",
};

const exportFormats = ["xlsx", "pdf"];

// ===== Cell Renders =====
const cellPhoneRender = (cell: DataGridTypes.ColumnCellTemplateData) =>
  formatPhone(cell.data.phoneNumber);

const cellNameRender = (cell: DataGridTypes.ColumnCellTemplateData) => (
  <div className="name-template">
    <div>
      {cell.data.firstname} {cell.data.lastname}
    </div>
    <div className="position">{cell.data.username}</div>
  </div>
);

// ===== Export Handler =====
const onExporting = (e: DataGridTypes.ExportingEvent) => {
  if (e.format === "pdf") {
    const doc = new JsPdf();
    exportDataGridToPdf({
      jsPDFDocument: doc,
      component: e.component,
    }).then(() => doc.save("Users.pdf"));
  } else {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet("Users");
    exportDataGridToXLSX({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: "application/octet-stream" }),
          "Users.xlsx"
        );
      });
    });
    e.cancel = true;
  }
};

// ===== Main Component =====
export const CRMContactList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [contactId, setContactId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [isPanelOpened, setPanelOpened] = useState(false);
  const [isPanelPinned, setPanelPinned] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const gridRef = useRef<DataGridRef>(null);
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // ===== Fetch Departments =====
  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) setDepartments(res.data);
      else console.error(res.message);
    });
  }, []);

  // ===== Fetch Users =====
  const loadUsers = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setIsRefreshing(!showLoading);
      try {
        const res = await userApi.getAll();
        if (res.isOk && res.data) {
          const allUsers = res.data;

          // ✅ Lọc users theo role
          let filtered: User[] = [];
          if (user?.role === "Admin") {
            filtered = allUsers;
          } else if (user?.role === "Manager") {
            filtered = allUsers.filter(
              (u) => u.departmentId === user.departmentId
            );
          } else if (user) {
            filtered = allUsers.filter((u) => u.id === user.id);
          }

          setUsers(allUsers);
          setFilteredUsers(filtered);
        } else {
          console.error(res.message);
          notify("Failed to load contacts", "error", 3000);
        }
      } catch (err) {
        console.error(err);
        notify("Error loading contacts", "error", 3000);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [user]
  );

  useEffect(() => {
    loadUsers(true);
  }, [loadUsers]);

  // ===== Sync URL Param =====
  useEffect(() => {
    if (username && users.length > 0) {
      const user = users.find((u) => u.username === username);
      if (user) {
        setSelectedUser(user);
        setContactId(user.id);
        setPanelOpened(true);
      }
    } else {
      setSelectedUser(null);
      setPanelOpened(false);
    }
  }, [username, users]);

  // ===== Actions =====
  const onRowDblClick = useCallback(
    (e) => {
      const user = e.data;
      navigate(`/crm-contact-list/${user.username}`);
    },
    [navigate]
  );

  const refresh = useCallback(async () => {
    await loadUsers(false); // Soft refresh without full loading
  }, [loadUsers]);

  const changePanelOpened = useCallback(
    (value: boolean) => {
      setPanelOpened(value);
      if (!value) navigate("/crm-contact-list");
    },
    [navigate]
  );

  const changePanelPinned = useCallback(
    () => setPanelPinned((prev) => !prev),
    []
  );

  // ===== Additional Handlers =====
  const onAddContactClick = useCallback(() => {
    setPopupVisible(true);
  }, []);

  const showColumnChooser = useCallback(() => {
    gridRef.current?.instance().showColumnChooser();
  }, []);

  const search = useCallback((e: TextBoxTypes.InputEvent) => {
    gridRef.current?.instance().searchByText(e.component.option("text") ?? "");
  }, []);

  const changePopupVisibility = useCallback((visible: boolean) => {
    setPopupVisible(visible);
  }, []);

  const onSaveClick = useCallback(
    async (data: Partial<User>) => {
      try {
        const userData = {
          ...data,
          phoneNumber: data.phoneNumber || data.phone || "",
          role: data.role || "User",
          status: data.status || "Salaried",
          gender: data.gender || "",
          address: data.address || "",
          position: data.position || "",
          country: data.country || "",
          city: data.city || "",
        };

        const res = await userApi.create(userData);
        if (res.isOk && res.data) {
          const newUser = res.data;
          setUsers((prev) => [...prev, newUser]);

          // ✅ cũng thêm vào filteredUsers nếu hợp lệ
          if (
            (user?.role === "Admin") ||
            (user?.role === "Manager" &&
              newUser.departmentId === user.departmentId) ||
            (user?.id === newUser.id)
          ) {
            setFilteredUsers((prev) => [...prev, newUser]);
          }

          notify(
            `New contact "${data.firstname} ${data.lastname}" created successfully`,
            "success",
            3000
          );
          setPopupVisible(false);
          setTimeout(() => loadUsers(false), 100);
        } else {
          console.error(res.message);
          notify(`Failed to create contact: ${res.message}`, "error", 3000);
        }
      } catch (err) {
        console.error(err);
        notify("Error creating contact", "error", 3000);
      }
    },
    [loadUsers, user]
  );

  const onUserDataChanged = useCallback(
    async (user: User) => {
      try {
        const res = await userApi.update(user.id.toString(), user);
        if (res.isOk) {
          // Update local state for immediate UI feedback
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === user.id ? { ...u, ...user } : u))
          );
          notify("Contact updated successfully", "success", 2000);
          // Sync with server
          setTimeout(() => loadUsers(false), 100);
        } else {
          console.error(res.message);
          notify(`Failed to update contact: ${res.message}`, "error", 3000);
        }
      } catch (err) {
        console.error(err);
        notify("Error updating contact", "error", 3000);
      }
    },
    [loadUsers]
  );

  return (
    <div className="view user-list">
      <div className="view-wrapper list-page">
        <LoadPanel
          enabled={loading}
          showIndicator={true}
          showPane={true}
          shadingColor="rgba(0, 0, 0, 0.4)"
        />

        {!loading && (
          <DataGrid
            className="grid theme-dependent"
            dataSource={filteredUsers}
            height={56 * 10}
            width="100%"
            noDataText="No users found"
            focusedRowEnabled
            keyExpr="id"
            showBorders
            allowColumnReordering
            onExporting={onExporting}
            onRowDblClick={onRowDblClick}
            ref={gridRef}
          >
            {/* SearchPanel removed - using toolbar search instead */}
            <ColumnChooser enabled />
            <Export enabled allowExportSelectedData formats={exportFormats} />
            <Selection
              mode="multiple"
              showCheckBoxesMode="always"
              selectAllMode="allPages"
            />
            <HeaderFilter visible />
            <Sorting mode="multiple" />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={5} />
            <Pager
              visible={true}
              showPageSizeSelector
              allowedPageSizes={[5, 10, 20, 50]}
              showInfo
            />

            <Toolbar>
              <Item location="before">
                <div className="grid-header" style={{ fontWeight: "bold", fontSize: "19px" }}>Tài khoản</div>
              </Item>
              <Item location="after" widget="dxButton">
                <Button
                  icon="plus"
                  text="Thêm người dùng"
                  type="default"
                  stylingMode="contained"
                  onClick={onAddContactClick}
                />
              </Item>
              <Item location="after" widget="dxButton">
                <Button
                  icon="refresh"
                  text="Làm mới"
                  stylingMode="text"
                  onClick={refresh}
                  disabled={isRefreshing}
                />
              </Item>
              <Item location="after" widget="dxButton">
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
              <Item name="exportButton" />
              <Item location="after" widget="dxTextBox">
                <TextBox
                  mode="search"
                  placeholder="Tìm kiếm người dùng"
                  onInput={search}
                />
              </Item>
            </Toolbar>

            <Column
              caption="Họ và tên"
              cellRender={cellNameRender}
              sortOrder="asc"
              dataField="firstname"
              minWidth={150}
            />
            <Column
              caption="Tên tài khoản"
              dataField="username"
              minWidth={100}
            />
            <Column
              caption="Trạng thái"
              dataField="status"
              dataType="string"
              minWidth={120}
              cellRender={({ value }) => renderStatusTag(value)}
            />
            <Column
              caption="Công ty"
              dataField="departmentId"
              cellRender={({ value }) => {
                const dept = departments.find((d) => d.id === value);
                return dept ? dept.departmentName : "";
              }}
            />
            <Column
              caption="Vị trí trong công ty"
              dataField="position"
              cellRender={({ data }) => {
                const dept = departments.find(
                  (d) => d.id === data.departmentId
                );
                return dept?.position.includes(data.position)
                  ? data.position
                  : "";
              }}
            />
            <Column
              caption="Số điện thoại"
              dataField="phoneNumber"
              cellRender={cellPhoneRender}
            />
            <Column
              caption="Giới tính"
              dataField="gender"
              cellRender={({ value }) => {
                switch (value) {
                  case 'Male':
                    return 'Nam';
                  case 'Female':
                    return 'Nữ';
                  case 'Other':
                    return 'Khác';
                  default:
                    return value || '';
                }
              }}
            />            <Column caption="Địa chỉ" dataField="address" />
          </DataGrid>
        )}

        <ContactPanel
          userId={contactId}
          isOpened={isPanelOpened}
          changePanelOpened={changePanelOpened}
          changePanelPinned={changePanelPinned}
        />

        <FormPopup
          title="Người dùng mới"
          visible={popupVisible}
          setVisible={changePopupVisibility}
          hideSaveButton={true} // 👈 truyền prop này vào
        >
          {popupVisible && (
            <ContactNewForm
              initData={formDataDefaults}
              onDataChanged={onSaveClick}
            />
          )}
        </FormPopup>
      </div>
    </div>
  );
};
