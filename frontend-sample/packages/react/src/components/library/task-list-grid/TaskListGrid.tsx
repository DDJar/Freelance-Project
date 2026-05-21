import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  DataGrid,
  DataGridRef,
  Column,
  Selection,
  Sorting,
  HeaderFilter,
  DataGridTypes,
  RequiredRule,
  Paging,
  Pager,
  Editing,
  Scrolling,
  LoadPanel,
} from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";

import { StatusIndicator } from "../status-indicator/StatusIndicator";
import {
  editFieldRender,
  statusItemRender,
  priorityFieldRender,
  priorityItemRender,
} from "../../../shared/statusIndicatorRenderMethods";

import { PRIORITY_ITEMS, STATUS_ITEMS } from "../../../shared/constants";

import { Task, PlanningProps } from "../../../types/task";
import { GridEdit } from "../../../types/planning-grid";
import { taskApi } from "../../../api/task";

import "./TaskListGrid.scss";

let useNavigation = true;

const priorityCellRender = ({ text }) => {
  return <StatusIndicator text={`| ${text}`} />;
};

const CellComponent = ({ data }: { data: { text: string } }) => (
  <StatusIndicator text={data.text} />
);

const editStatusRender = ({ setValue, value }: GridEdit) => (
  <SelectBox
    className="edit-cell"
    defaultValue={value}
    items={STATUS_ITEMS}
    fieldRender={editFieldRender}
    itemRender={statusItemRender}
    onValueChange={(value) => setValue(value)}
  />
);

const editPriorityRender = ({ setValue, value }: GridEdit) => (
  <SelectBox
    className="edit-cell"
    defaultValue={value}
    items={PRIORITY_ITEMS}
    fieldRender={priorityFieldRender}
    itemRender={priorityItemRender}
    onValueChange={(value) => setValue(value)}
  />
);

// Thêm interface cho props
interface TaskListGridProps extends PlanningProps {
  onDataChanged?: () => void; // Callback để refresh data sau khi xóa
}

export const TaskListGrid = React.forwardRef<DataGridRef, TaskListGridProps>(
  ({ dataSource, onDataChanged }, ref) => {
    const [data, setData] = useState<Task[]>();

    const navigate = useNavigate();

    const assignedToCellRender = ({ data }) => {
      return <span>{(data.assignedToNames || []).join(", ")}</span>;
    };

    useEffect(() => {
      setData(dataSource.filter((d) => d.status && d.priority));
    }, [dataSource]);

    const navigateToDetails = useCallback(
      ({ rowType, data }: DataGridTypes.RowClickEvent) => {
        if (useNavigation && rowType !== "detailAdaptive" && data.id) {
          navigate(`/planning-task-details/${data.id}`);
        }
      },
      [navigate]
    );

    const toogleUseNavigation = useCallback(() => {
      useNavigation = !useNavigation;
    }, []);

    // Thêm handler cho việc xóa row
    const onRowRemoving = useCallback(
      async (e: DataGridTypes.RowRemovingEvent) => {
        // Prevent default removal
        e.cancel = true;

        const taskId = e.data.id;
        const taskTitle = e.data.title;

        if (!taskId) {
          notify(
            {
              message: "Cannot delete task: No ID found",
              position: { at: "bottom center", my: "bottom center" },
            },
            "error"
          );
          return;
        }

        try {
          // Gọi API để xóa task
          const result = await taskApi.delete(taskId);

          if (result.isOk) {
            notify(
              {
                message: `Task "${taskTitle}" has been deleted successfully`,
                position: { at: "bottom center", my: "bottom center" },
              },
              "success"
            );

            // Refresh data nếu có callback
            if (onDataChanged) {
              onDataChanged();
            }
          } else {
            notify(
              {
                message: `Failed to delete task: ${
                  result.message || "Unknown error"
                }`,
                position: { at: "bottom center", my: "bottom center" },
              },
              "error"
            );
          }
        } catch (error) {
          console.error("Error deleting task:", error);
          notify(
            {
              message: `Error deleting task: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              position: { at: "bottom center", my: "bottom center" },
            },
            "error"
          );
        }
      },
      [onDataChanged]
    );

    // Thêm handler cho việc update row
    const onRowUpdating = useCallback(
      async (e: DataGridTypes.RowUpdatingEvent) => {
        // Prevent default update
        e.cancel = true;

        const taskId = e.oldData.id;
        const updatedData = { ...e.oldData, ...e.newData };

        if (!taskId) {
          notify(
            {
              message: "Cannot update task: No ID found",
              position: { at: "bottom center", my: "bottom center" },
            },
            "error"
          );
          return;
        }

        try {
          // Gọi API để update task
          const result = await taskApi.update(taskId, updatedData);

          if (result.isOk) {
            notify(
              {
                message: `Task "${updatedData.title}" has been updated successfully`,
                position: { at: "bottom center", my: "bottom center" },
              },
              "success"
            );

            // Refresh data nếu có callback
            if (onDataChanged) {
              onDataChanged();
            }
          } else {
            notify(
              {
                message: `Failed to update task: ${
                  result.message || "Unknown error"
                }`,
                position: { at: "bottom center", my: "bottom center" },
              },
              "error"
            );
          }
        } catch (error) {
          console.error("Error updating task:", error);
          notify(
            {
              message: `Error updating task: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              position: { at: "bottom center", my: "bottom center" },
            },
            "error"
          );
        }
      },
      [onDataChanged]
    );

    return (
      <DataGrid
        className="planning-grid theme-dependent"
        ref={ref}
        dataSource={data}
        columnAutoWidth
        hoverStateEnabled
        showBorders
        height={56 * 10}
        onEditingStart={toogleUseNavigation}
        onEditCanceled={toogleUseNavigation}
        onSaved={toogleUseNavigation}
        onRowClick={navigateToDetails}
        onRowRemoving={onRowRemoving}
        onRowUpdating={onRowUpdating}
      >
        <LoadPanel enabled={false} />
        <Scrolling mode="virtual" />
        <Paging defaultPageSize={15} />
        <Pager visible showPageSizeSelector />
        <Editing mode="row" allowUpdating allowDeleting />
        <Selection
          selectAllMode="allPages"
          showCheckBoxesMode="always"
          mode="multiple"
        />
        <HeaderFilter visible />
        <Sorting mode="multiple" />

        <Column dataField="title" caption="Dự án" hidingPriority={7}>
          <RequiredRule />
        </Column>
        <Column
          dataField="company"
          caption="Công ty hợp tác"
          hidingPriority={6}
        >
          <RequiredRule />
        </Column>
        <Column
          dataField="priority"
          caption="Mức độ ưu tiên"
          cellRender={priorityCellRender}
          editCellRender={editPriorityRender}
          hidingPriority={4}
        >
          <RequiredRule />
        </Column>

        <Column
          dataField="estimatedHour"
          caption="Thời gian của công việc"
          dataType="number"
          hidingPriority={7}
          cellRender={({ value }) => `${value} giờ`}
        />

        <Column
          dataField="startDate"
          caption="Ngày bắt đầu"
          dataType="date"
          hidingPriority={2}
        >
          <RequiredRule />
        </Column>
        <Column
          dataField="dueDate"
          caption="Hạn cuối"
          dataType="date"
          sortOrder="asc"
          hidingPriority={1}
        >
          <RequiredRule />
        </Column>
        <Column
          dataField="assignedToNames"
          caption="Nhân viên nhận việc"
          hidingPriority={5}
          cellRender={assignedToCellRender}
        >
          <RequiredRule />
        </Column>

        <Column
          dataField="status"
          caption="Trạng thái"
          minWidth={120}
          cellComponent={CellComponent}
          editCellRender={editStatusRender}
          hidingPriority={3}
        >
          <RequiredRule />
        </Column>
        <Column dataField="departmentName" caption="Công ty" hidingPriority={8}>
          <RequiredRule />
        </Column>
      </DataGrid>
    );
  }
);
