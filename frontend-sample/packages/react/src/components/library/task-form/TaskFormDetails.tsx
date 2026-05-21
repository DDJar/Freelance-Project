import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import Form, {
  SimpleItem,
  GroupItem,
  ColCountByScreen,
  ButtonItem,
} from "devextreme-react/form";
import SelectBox from "devextreme-react/select-box";
import TextArea from "devextreme-react/text-area";
import { TagBox } from "devextreme-react/tag-box";
import ValidationGroup from "devextreme-react/validation-group";
import notify from "devextreme/ui/notify";
import { FormDateBox } from "../../utils/form-datebox/FormDateBox";
import { PRIORITY_ITEMS, STATUS_ITEMS } from "../../../shared/constants";
import "./TaskFormDetails.scss";
import {
  editFieldRender,
  statusItemRender,
  priorityFieldRender,
  priorityItemRender,
} from "../../../shared/statusIndicatorRenderMethods";

import { Task } from "../../../types/task";
import { getSizeQualifier } from "../../../utils/media-query";
import { userApi } from "../../../api/user";
import { departmentApi } from "../../../api/department";
import { taskApi } from "../../../api/task";
import { User } from "../../../types/auth";
import { Department } from "../../../types/department";

export const TaskFormDetails = ({
  data,
  onUpdated,
  isCreating = false, // ✅ thêm prop để xác định đang tạo mới
}: {
  data: Task;
  onUpdated?: () => void;
  isCreating?: boolean;
}) => {
  const [formData, setFormData] = useState<Task>({ ...data });
  const [editing, setEditing] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const validationGroupRef = useRef<any>(null);

  useEffect(() => {
    setFormData({ ...data });
    setEditing(isCreating || !data.id); // ✅ tự động bật chỉnh sửa nếu đang tạo mới
  }, [data, isCreating]);

  useEffect(() => {
    userApi.getAll().then((res) => {
      if (res.isOk && res.data) setAllUsers(res.data);
    });

    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) setDepartments(res.data);
    });
  }, []);

  const updateField = (field: keyof Task) => (value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
  };

  const handleSave = async () => {
    const result = validationGroupRef.current?.instance()?.validate();
    if (!result?.isValid) return;

    let res;
    if (formData.id) {
      res = await taskApi.update(formData.id, formData);
    } else {
      res = await taskApi.create(formData);
    }

    if (res.isOk) {
      notify("Lưu thành công", "success", 2000);
      setEditing(false);
      onUpdated?.();
    } else {
      notify(`Lỗi khi lưu: ${res.message}`, "error", 3000);
    }
  };

  const handleCancel = () => {
    setFormData({ ...data });
    setEditing(false);
  };

  return (
    <ValidationGroup ref={validationGroupRef}>
      <Form
        className={classNames({
          "plain-styled-form task-form-details": true,
          "view-mode": !editing,
        })}
        screenByWidth={getSizeQualifier}
      >
        <SimpleItem colSpan={2}>
          <TextArea
            label="Tiêu đề"
            value={formData.title}
            readOnly={!editing}
            onValueChange={updateField("title")}
          />
        </SimpleItem>

        <GroupItem itemType="group">
          <ColCountByScreen xs={1} sm={2} md={2} lg={2} />

          <SimpleItem cssClass="accent">
            <TextArea
              label="Công ty"
              value={formData.company}
              readOnly={!editing}
              onValueChange={updateField("company")}
            />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              label="Phòng ban"
              dataSource={departments}
              displayExpr="departmentName"
              valueExpr="id"
              value={formData.departmentId}
              readOnly={!editing}
              onValueChanged={(e) => updateField("departmentId")(e.value)}
            />
          </SimpleItem>

          <SimpleItem>
            <TagBox
              label="Giao cho"
              dataSource={allUsers}
              displayExpr="name"
              valueExpr="id"
              value={formData.assignedTo}
              readOnly={!editing}
              showClearButton
              searchEnabled
              onValueChanged={(e) => updateField("assignedTo")(e.value)}
            />
          </SimpleItem>

          <SimpleItem>
            <TextArea
              label="Giới hạn thời gian"
              value={formData.estimatedHour?.toString() ?? ""}
              readOnly={!editing}
              name="Set Estimated Hour"
              onValueChange={(val) => updateField("estimatedHour")(+val)}
            />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              label="Độ ưu tiên"
              value={formData.priority}
              items={PRIORITY_ITEMS}
              readOnly={!editing}
              stylingMode="filled"
              fieldRender={priorityFieldRender}
              itemRender={priorityItemRender}
              onValueChange={updateField("priority")}
            />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              label="Trạng thái"
              value={formData.status}
              items={STATUS_ITEMS}
              readOnly={!editing}
              stylingMode="filled"
              fieldRender={editFieldRender}
              itemRender={statusItemRender}
              onValueChange={updateField("status")}
            />
          </SimpleItem>

          <SimpleItem>
            <FormDateBox
              value={formData.startDate}
              readOnly={!editing}
              name="Set Start Date"
              label="Ngày bắt đầu"
              onValueChange={updateField("startDate")}
            />
          </SimpleItem>

          <SimpleItem>
            <FormDateBox
              value={formData.dueDate}
              readOnly={!editing}
              name="Set Due Date"
              label="Hạn hoàn thành"
              onValueChange={updateField("dueDate")}
            />
          </SimpleItem>
        </GroupItem>

        <SimpleItem colSpan={2}>
          <TextArea
            label="Chi tiết"
            readOnly={!editing}
            value={formData.detail}
            stylingMode="filled"
            onValueChange={updateField("detail")}
          />
        </SimpleItem>

        <GroupItem colCount={2} colSpan={2} cssClass="form-buttons-row">
          <ButtonItem
            colSpan={1}
            buttonOptions={{
              text: "Hủy",
              type: "normal",
              icon: "close",
              onClick: handleCancel,
              visible: editing && !!formData.id,
              elementAttr: {
                class: "form-button",
              },
            }}
          />

          <ButtonItem
            colSpan={1}
            buttonOptions={{
              text: !formData.id ? "Lưu" : editing ? "Lưu" : "Chỉnh sửa",
              type: !formData.id || editing ? "default" : "normal",
              icon: !formData.id ? "save" : editing ? "save" : "edit",
              onClick: () => {
                if (!formData.id) {
                  handleSave();
                } else {
                  editing ? handleSave() : setEditing(true);
                }
              },
              visible: !formData.id || editing || !editing,
              elementAttr: {
                class: "form-button",
              },
            }}
          />
        </GroupItem>
      </Form>
    </ValidationGroup>
  );
};
