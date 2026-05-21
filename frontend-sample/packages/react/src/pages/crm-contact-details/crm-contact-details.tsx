import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Item, Toolbar } from "devextreme-react/toolbar";
import Button from "devextreme-react/button";
import DropDownButton from "devextreme-react/drop-down-button";
import ScrollView from "devextreme-react/scroll-view";

import { ContactCards, ContactForm } from "../../components";
import { userApi } from "../../api/user";
import { taskApi } from "../../api/task";
import { departmentApi } from "../../api/department";
import { User } from "../../types/auth";
import { Task } from "../../types/task";
import { Department } from "../../types/department";

import "./crm-contact-details.scss";
import { Contact } from "../../types/crm-contact";

export const CRMContactDetails = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departmentName, setDepartmentName] = useState<string>('');

  const convertUserToContact = (user: User, tasks: Task[]): Contact => ({
    ...user,
    phone: user.phoneNumber,
    image: user.avatarUrl,
    tasks,
    departmentName,
  });

  const loadData = useCallback(async () => {
    if (!username) return;
    setIsLoading(true);

    try {
      const [userRes, taskRes, allUsersRes] = await Promise.all([
        userApi.getByUsername(username),
        taskApi.getAll(),
        userApi.getAll(),
      ]);

      if (userRes.isOk && userRes.data) {
        setUser(userRes.data);
        
        // Load department name from departmentId
        if (userRes.data.departmentId) {
          const departmentRes = await departmentApi.getById(userRes.data.departmentId);
          if (departmentRes.isOk && departmentRes.data) {
            setDepartmentName(departmentRes.data.departmentName);
          }
        }
      }

      if (taskRes.isOk && taskRes.data) {
        const transformedTasks: Task[] = taskRes.data.map((task) => ({
          ...task,
          title: task.title ?? "",
          priority: task.priority ?? "Normal",
          status: task.status ?? "Open",
          dueDate: new Date(task.dueDate),
          startDate: new Date(task.startDate),
          createdAt: new Date(task.createdAt),
        }));

        setAllTasks(transformedTasks);
      }

      if (allUsersRes.isOk && allUsersRes.data) {
        setAllUsers(allUsersRes.data);
      }
    } catch (error) {
      console.error("Error loading contact details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;

    const filteredTasks = allTasks.filter((task) =>
      task.assignedTo?.includes(user.id)
    );

    setTasks(filteredTasks);
  }, [allTasks, user]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView className="view-wrapper-scroll">
      <div className="view-wrapper view-wrapper-contact-details">
        <Toolbar className="toolbar-details theme-dependent">
          <Item location="before">
            <Button
              icon="arrowleft"
              stylingMode="text"
              onClick={() => navigate(-1)}
            />
          </Item>

          <Item location="before" text={user?.username ?? "Loading..."} />

          <Item location="after" locateInMenu="auto">
            <Button text="Terminate" type="default" stylingMode="contained" />
          </Item>

          <Item location="after">
            <DropDownButton
              text="Actions"
              stylingMode="text"
              dropDownOptions={{ width: "auto" }}
              items={["Assign to Me", "Archive"]}
            />
          </Item>

          <Item location="after" locateInMenu="auto">
            <div className="separator" />
          </Item>

          <Item location="after" locateInMenu="auto">
            <Button text="Copy" icon="copy" stylingMode="text" />
          </Item>

          <Item location="after" locateInMenu="auto">
            <Button
              text={`Tasks của ${user?.username ?? "người dùng"}`}
              icon="task"
              stylingMode="contained"
              disabled
            />
          </Item>

          <Item location="after" locateInMenu="auto">
            <Button
              text="Làm mới"
              icon="refresh"
              stylingMode="text"
              onClick={refresh}
            />
          </Item>
        </Toolbar>

        <div className="panels">
          <div className="left">
            <ContactForm
              data={user ? convertUserToContact(user, tasks) : undefined}
              isLoading={isLoading}
            />
          </div>
          <div className="right">
            <ContactCards
              isLoading={isLoading}
              tasks={tasks}
              name={user?.username}
              allUsers={allUsers}
            />
          </div>
        </div>
      </div>
    </ScrollView>
  );
};
