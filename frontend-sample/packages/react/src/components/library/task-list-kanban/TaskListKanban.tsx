import React, { useState, useEffect, useCallback } from "react";

import ScrollView from "devextreme-react/scroll-view";
import {
  Sortable,
  SortableRef,
  SortableTypes,
} from "devextreme-react/sortable";
import Button from "devextreme-react/button";
import notify from "devextreme/ui/notify";

import { CardMenu } from "../card-menu/CardMenu";
import { TaskKanbanCard } from "../task-kanban-card/TaskKanbanCard";

import { PlanningProps, Task } from "../../../types/task";

import { STATUS_ITEMS } from "../../../shared/constants";
import { taskApi } from "../../../api/task";

import "./TaskListKanban.scss";

const boardMenuItems = [
  { text: "Add card" },
  { text: "Copy list" },
  { text: "Move list" },
];

const reorder = <T,>(
  items: T[],
  item: T,
  fromIndex: number,
  toIndex: number
) => {
  let result = items;
  if (fromIndex >= 0) {
    result = [...result.slice(0, fromIndex), ...result.slice(fromIndex + 1)];
  }

  if (toIndex >= 0) {
    result = [...result.slice(0, toIndex), item, ...result.slice(toIndex)];
  }

  return result;
};

const TaskList = ({
  title,
  index,
  tasks,
  onTaskDragStart,
  onTaskDrop,
  changePopupVisibility,
}: {
  title: string;
  index: number;
  tasks: Task[];
  onTaskDragStart: (e: SortableTypes.DragStartEvent) => void;
  onTaskDrop: (e: SortableTypes.ReorderEvent) => void;
  changePopupVisibility?: () => void;
}) => {
  return (
    <div className="list">
      <div className="list-title theme-text-color">
        <span>{title}</span>
        <span>{tasks.length}</span>
        <CardMenu items={boardMenuItems} />
      </div>
      <ScrollView
        className="scrollable-list"
        direction="vertical"
        showScrollbar="always"
      >
        <Sortable
          className="sortable-cards"
          group="cardsGroup"
          data={index}
          onDragStart={onTaskDragStart}
          onReorder={onTaskDrop}
          onAdd={onTaskDrop}
        >
          {tasks.map((task) => (
            <TaskKanbanCard key={task.id} task={task} />
          ))}
        </Sortable>
        <div className="add-task">
          <Button
            icon="plus"
            text="Add Task"
            stylingMode="text"
            onClick={changePopupVisibility}
            width="100%"
          />
        </div>
      </ScrollView>
    </div>
  );
};

interface ExtendedPlanningProps extends PlanningProps {
  onTaskUpdated?: () => void;
}

export const TaskListKanban = React.forwardRef<
  SortableRef,
  ExtendedPlanningProps
>(({ dataSource, changePopupVisibility, onTaskUpdated }, ref) => {
  const [lists, setLists] = useState<Task[][]>([]);
  const [statuses, setStatuses] = useState(STATUS_ITEMS);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const initialLists: Task[][] = [];
    STATUS_ITEMS.forEach((status) => {
      initialLists.push(dataSource.filter((task) => task.status === status));
    });
    setLists(initialLists);
  }, [dataSource]);

  const onListReorder = useCallback(
    ({ fromIndex, toIndex }: SortableTypes.ReorderEvent) => {
      setLists(reorder(lists, lists[fromIndex], fromIndex, toIndex));
      setStatuses(reorder(statuses, statuses[fromIndex], fromIndex, toIndex));
    },
    [lists, statuses]
  );

  const onTaskDragStart = useCallback(
    (e: SortableTypes.DragStartEvent) => {
      e.itemData = lists[e.fromData][e.fromIndex];
    },
    [lists]
  );

  // const onTaskDrop = useCallback(
  //   async (e: SortableTypes.ReorderEvent) => {
  //     const updatedList = [...lists];
  //     const newStatus = statuses[e.toData];
  //     const oldStatus = e.itemData.status;

  //     // Cập nhật status của task
  //     e.itemData.status = newStatus;

  //     // Cập nhật UI trước
  //     updatedList[e.fromData] = reorder(updatedList[e.fromData], e.itemData, e.fromIndex, -1);
  //     updatedList[e.toData] = reorder(updatedList[e.toData], e.itemData, -1, e.toIndex);
  //     setLists(updatedList);

  //     // Chỉ call API nếu status thực sự thay đổi
  //     if (oldStatus !== newStatus) {
  //       setUpdating(true);
  //       try {
  //         const res = await taskApi.update(e.itemData.id, {
  //           ...e.itemData,
  //           status: newStatus
  //         });

  //         if (res.isOk) {
  //           notify(
  //             {
  //               message: `Task "${e.itemData.title}" moved to ${newStatus}`,
  //               position: { at: "bottom center", my: "bottom center" },
  //             },
  //             "success"
  //           );
  //           // Refresh data để đảm bảo đồng bộ
  //           if (onTaskUpdated) {
  //             onTaskUpdated();
  //           }
  //         } else {
  //           // Revert UI nếu API call thất bại
  //           e.itemData.status = oldStatus;
  //           const revertedList = [...lists];
  //           revertedList[e.toData] = reorder(revertedList[e.toData], e.itemData, e.toIndex, -1);
  //           revertedList[e.fromData] = reorder(revertedList[e.fromData], e.itemData, -1, e.fromIndex);
  //           setLists(revertedList);

  //           notify(
  //             {
  //               message: `Failed to update task: ${res.message}`,
  //               position: { at: "bottom center", my: "bottom center" },
  //             },
  //             "error"
  //           );
  //         }
  //       } catch (error) {
  //         // Revert UI nếu có lỗi
  //         e.itemData.status = oldStatus;
  //         const revertedList = [...lists];
  //         revertedList[e.toData] = reorder(revertedList[e.toData], e.itemData, e.toIndex, -1);
  //         revertedList[e.fromData] = reorder(revertedList[e.fromData], e.itemData, -1, e.fromIndex);
  //         setLists(revertedList);

  //         notify(
  //           {
  //             message: `Failed to update task: ${error}`,
  //             position: { at: "bottom center", my: "bottom center" },
  //           },
  //           "error"
  //         );
  //       } finally {
  //         setUpdating(false);
  //       }
  //     }
  //   },
  //   [lists, statuses, onTaskUpdated]
  // );
  const onTaskDrop = useCallback(
    async (e: SortableTypes.ReorderEvent) => {
      const updatedList = [...lists];
      const newStatus = statuses[e.toData];
      const oldStatus = e.itemData.status;

      const now = new Date();

      // clone task để cập nhật
      const updatedTask = { ...e.itemData };

      // cập nhật UI trước
      updatedList[e.fromData] = reorder(
        updatedList[e.fromData],
        updatedTask,
        e.fromIndex,
        -1
      );
      updatedList[e.toData] = reorder(
        updatedList[e.toData],
        updatedTask,
        -1,
        e.toIndex
      );
      setLists(updatedList);

      // xử lý logic theo status
      if (oldStatus === "Open" && newStatus === "In Progress") {
        updatedTask.startDate = now.toISOString();

        const due = new Date(
          now.getTime() + (updatedTask.estimatedHour || 0) * 3600 * 1000
        );
        updatedTask.dueDate = due.toISOString();

        updatedTask.completedAt = null;
        updatedTask.result = null;
      }

      if (oldStatus === "In Progress" && newStatus === "Completed") {
        const due = updatedTask.dueDate ? new Date(updatedTask.dueDate) : now;
        updatedTask.completedAt = now.toISOString();

        if (now <= due) {
          updatedTask.result = "On time";
        } else {
          const diffMs = now.getTime() - due.getTime();
          const minutesLate = Math.ceil(diffMs / 60000);
          updatedTask.result = `Late by ${minutesLate} min`;
        }
      }

      if (oldStatus === "Open" && newStatus !== "In Progress") {
        // Nếu kéo từ Open sang Deferred/Completed — giữ nguyên (hoặc reset)
        updatedTask.startDate = null;
        updatedTask.dueDate = null;
        updatedTask.completedAt = null;
        updatedTask.result = null;
      }

      if (oldStatus === "In Progress" && newStatus === "Deferred") {
        // Không thay đổi gì cả
      }

      updatedTask.status = newStatus;

      setUpdating(true);
      try {
        const res = await taskApi.update(updatedTask.id, updatedTask);

        if (res.isOk) {
          notify(
            {
              message: `Task "${updatedTask.title}" moved to ${newStatus}`,
              position: { at: "bottom center", my: "bottom center" },
            },
            "success"
          );
          if (onTaskUpdated) {
            onTaskUpdated();
          }
        } else {
          throw new Error(res.message);
        }
      } catch (err) {
        // revert UI
        updatedTask.status = oldStatus;
        const revertedList = [...lists];
        revertedList[e.toData] = reorder(
          revertedList[e.toData],
          updatedTask,
          e.toIndex,
          -1
        );
        revertedList[e.fromData] = reorder(
          revertedList[e.fromData],
          updatedTask,
          -1,
          e.fromIndex
        );
        setLists(revertedList);

        notify(
          {
            message: `Failed to update task: ${err}`,
            position: { at: "bottom center", my: "bottom center" },
          },
          "error"
        );
      } finally {
        setUpdating(false);
      }
    },
    [lists, statuses, onTaskUpdated]
  );

  return (
    <div id="kanban" className="kanban">
      <ScrollView direction="both" showScrollbar="always">
        <Sortable
          ref={ref}
          itemOrientation="horizontal"
          handle=".list-title"
          onReorder={onListReorder}
        >
          {lists.map((tasks, listIndex) => {
            const status = statuses[listIndex];
            return (
              <TaskList
                key={status}
                title={status}
                index={listIndex}
                tasks={tasks}
                onTaskDragStart={onTaskDragStart}
                onTaskDrop={onTaskDrop}
                changePopupVisibility={changePopupVisibility}
              />
            );
          })}
        </Sortable>
      </ScrollView>
      {updating && (
        <div className="updating-overlay">
          <span>Updating task...</span>
        </div>
      )}
    </div>
  );
});
