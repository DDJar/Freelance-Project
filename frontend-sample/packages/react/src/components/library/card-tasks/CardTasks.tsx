import React, { useState, useCallback, useEffect } from "react";

import DataGrid, {
  Selection,
  RowDragging,
  Column,
} from "devextreme-react/data-grid";

import { withLoadPanel } from "../../../utils/withLoadPanel";

import { Task } from "../../../types/task";

import "./CardTasks.scss";
import { User } from "../../../types/auth";

const Grid = ({ tasks, allUsers }: { tasks: Task[]; allUsers: User[] }) => {
  const [gridData, setGridData] = useState(tasks);

  useEffect(() => {
    setGridData(tasks);
  }, [tasks]);

  const onReorder = useCallback(
    (e) => {
      const visibleRows = e.component.getVisibleRows();
      const toIndex = gridData.indexOf(visibleRows[e.toIndex].data);
      const fromIndex = gridData.indexOf(e.itemData);

      const newGridData = [...gridData];
      newGridData.splice(fromIndex, 1);
      newGridData.splice(toIndex, 0, e.itemData);
      setGridData(newGridData);
    },
    [gridData]
  );

  return (
    <DataGrid className="tasks-grid" dataSource={gridData} columnAutoWidth>
      <Selection mode="multiple" showCheckBoxesMode="always" />

      <RowDragging allowReordering onReorder={onReorder} showDragIcons />

      <Column dataField="title" caption="Dự án" />
      <Column dataField="dueDate" dataType="date" caption="Hạn cuối" />
      <Column
        caption="Nhân viên nhận việc"
        calculateCellValue={(rowData) =>
          rowData.assignedTo
            ?.map((id: string) => {
              const user = allUsers.find((u) => u.id === id);
              return user ? `${user.firstname} ${user.lastname}` : id;
            })
            .join(", ") || "Unassigned"
        }
      />

      <Column dataField="status" caption="Trạng thái công việc" />
      <Column dataField="priority" caption="Mức độ ưu tiên" />
    </DataGrid>
  );
};

const GridWithLoadPanel = withLoadPanel(Grid);

export const CardTasks = ({
  tasks,
  isLoading,
  allUsers,
}: {
  tasks?: Task[];
  isLoading: boolean;
  allUsers: User[]; // thêm prop này
}) => {
  return (
    <div className="card-tasks">
      <GridWithLoadPanel
        tasks={tasks?.filter((item) => !!item.status && !!item.priority)}
        hasData={!!tasks}
        loading={isLoading}
        allUsers={allUsers}
        panelProps={{
          container: ".card-tasks",
          position: { of: ".card-tasks" },
        }}
      />
    </div>
  );
};
