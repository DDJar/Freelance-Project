import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Toolbar, Item as ToolbarItem } from "devextreme-react/toolbar";
import ValidationGroup from "devextreme-react/validation-group";
import Button from "devextreme-react/button";
import ScrollView from "devextreme-react/scroll-view";

import { TaskForm } from "../../components";
import { Task } from "../../types/task";
import { taskApi } from "../../api/task";
import "./planning-task-details.scss";

export const PlanningTaskDetails = () => {
  const navigate = useNavigate();

  const [task, setTask] = useState<Task>();
  const [isLoading, setIsLoading] = useState(false);

  const { id } = useParams<{ id: string }>();

  const loadData = useCallback(() => {
    if (!id) return;

    setIsLoading(true);

    taskApi
      .getById(id)
      .then((res) => {
        if (res.isOk && res.data) {
          setTask(res.data);
        } else {
          console.error("Failed to load task:", res.message);
        }
      })
      .catch((error) => console.error("Error loading task:", error))
      .finally(() => setIsLoading(false));
  }, [id]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [loadData]);

  return (
    <ScrollView className="view-wrapper-scroll" key={id}>
      <div className="view-wrapper view-wrapper-details">
        <Toolbar className="toolbar-details theme-dependent">
          <ToolbarItem location="before">
            <Button
              icon="arrowleft"
              stylingMode="text"
              onClick={() => navigate(-1)}
            />
          </ToolbarItem>
          <ToolbarItem location="before" text={task?.title ?? "Loading..."} />
          <ToolbarItem location="after" locateInMenu="auto">
            <Button
              text="Làm mới"
              icon="refresh"
              stylingMode="text"
              onClick={refresh}
            />
          </ToolbarItem>
        </Toolbar>

        <div className="panels">
          <div className="left">
            <ValidationGroup>
              <TaskForm task={task} isLoading={isLoading} />
            </ValidationGroup>
          </div>
          <div className="right" style={{ width: "50% !important" }}>
            <div className="task-details-container">
              <h2>Chi tiết công việc</h2>
              <div className="dx-card details-card">
                <div className="task-detail">
                  {task?.detail ? (
                    <div dangerouslySetInnerHTML={{ __html: task.detail }} />
                  ) : (
                    <p>Không có chi tiết nhiệm vụ.</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ScrollView>
  );
};
