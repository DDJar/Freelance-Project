import React, { useEffect, useState } from "react";
import { withLoadPanel } from "../../../utils/withLoadPanel";
import { TaskFormDetails } from "./TaskFormDetails";
import { Task } from "../../../types/task";
import "./TaskForm.scss";

const TaskFormWithLoadPanel = withLoadPanel(TaskFormDetails);

export const TaskForm = ({
  task,
  isLoading,
}: {
  task?: Task;
  isLoading: boolean;
}) => {
  const [data, setData] = useState(task);

  useEffect(() => {
    if (task) {
      setData(task);
    }
  }, [task]);

  return (
    <div className="task-form">
      <TaskFormWithLoadPanel
        loading={isLoading}
        hasData={!!data}
        data={data}
        onUpdated={() => {}}
        panelProps={{
          container: ".task-form",
          position: { of: ".task-form" },
        }}
      />
    </div>
  );
};
