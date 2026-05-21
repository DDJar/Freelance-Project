import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import classNames from "classnames";
import { Button, ButtonTypes } from "devextreme-react/button";
import { ScrollView } from "devextreme-react/scroll-view";
import Toolbar, { Item as ToolbarItem } from "devextreme-react/toolbar";
import Form, {
  Item as FormItem,
  GroupItem,
  ColCountByScreen,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import { FormTextbox, FormPhoto, ContactStatus } from "../..";
import { useScreenSize } from "../../../utils/media-query";
import ValidationGroup from "devextreme-react/validation-group";
import { userApi } from "../../../api/user";
import SelectBox from "devextreme-react/select-box";
import { departmentApi } from "../../../api/department";
import { renderStatusTag } from "../../../utils/status-color";
import { User } from "../../../types/auth";
import { Department } from "../../../types/department";
import { Popup } from "devextreme-react";
export const STATUS_ITEMS = [
  { value: "Salaried", text: "Lương cố định" },
  { value: "Commission", text: "Hoa hồng" },
  { value: "Terminated", text: "Đã nghỉ việc" },
];
export const ContactPanelDetails = ({
  user,
  isOpened,
  changePanelOpened,
  onDataChanged,
  changePanelPinned,
}: {
  user: User;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  onDataChanged: (data: User | null) => void;
  changePanelPinned: () => void;
}) => {
  const [formData, setFormData] = useState<User>(user);
  const [isPinned, setIsPinned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isLarge, isMedium } = useScreenSize();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) {
        setDepartments(res.data);
      }
    });
  }, []);

  useEffect(() => {
    const selectedDept = departments.find(
      (d) => d.id === formData.departmentId
    );
    setPositions(selectedDept?.position || []);
  }, [formData.departmentId, departments]);

  useEffect(() => {
    changePanelPinned();
  }, [isPinned]);

  const updateField = (field: string) => (value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onPinClick = useCallback(() => {
    setIsPinned(!isPinned);
  }, [isPinned]);

  const onClosePanelClick = useCallback(() => {
    setIsPinned(false);
    changePanelOpened(false);
  }, []);

  const toggleEditHandler = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const cancelHandler = useCallback(() => {
    toggleEditHandler();
    setFormData(user);
  }, [user, toggleEditHandler]);

  const onSaveClick = useCallback(
    async ({ validationGroup }: ButtonTypes.ClickEvent) => {
      const result = validationGroup.validate();
      if (!result.isValid) return;

      const response = await userApi.update(user.id, formData);
      if (response.isOk) {
        notify("Cập nhật thành công", "success", 2000);
        onDataChanged(formData);
        setIsEditing(false);
      } else {
        notify(response.message || "Cập nhật thất bại", "error", 3000);
      }
    },
    [formData, user.id, onDataChanged]
  );
  const handleDeleteConfirmed = async () => {
    const result = await userApi.delete(user.id);
    if (result.isOk) {
      notify("Xóa người dùng thành công", "success", 2000);
      changePanelOpened(false);
      onDataChanged(null);
    } else {
      notify(result.message || "Xóa thất bại", "error", 3000);
    }
    setConfirmVisible(false);
  };
  const onDeleteClick = useCallback(() => {
    setConfirmVisible(true);
  }, []);

  const navigateToDetails = useCallback(() => {
    navigate(`/crm-contact-details/${user.username}`);
  }, []);

  const getDepartmentName = (id: string) => {
    return departments.find((d) => d.id === id)?.departmentName || "";
  };

  return (
    <div
      id="contact-panel"
      className={classNames({
        panel: true,
        open: isOpened,
        pin: isPinned && (isLarge || isMedium),
      })}
    >
      <div className="data-wrapper">
        <Toolbar className="panel-toolbar">
          <ToolbarItem location="before">
            <span className="contact-name value">{`${user.firstname} ${user.lastname}`}</span>
          </ToolbarItem>
          <ToolbarItem location="before">
            <ContactStatus text={user.status} />
          </ToolbarItem>
          <ToolbarItem location="after" visible={isLarge || isMedium}>
            <Button
              icon={isPinned ? "pin" : "unpin"}
              stylingMode="text"
              onClick={onPinClick}
            />
          </ToolbarItem>
          <ToolbarItem location="after">
            <Button
              icon="close"
              stylingMode="text"
              onClick={onClosePanelClick}
            />
          </ToolbarItem>
        </Toolbar>

        <ScrollView className="panel-scroll">
          <ValidationGroup>
            <div className="data-part border">
              <Form
                className={classNames({
                  "plain-styled-form": true,
                  "view-mode": !isEditing,
                })}
              >
                <GroupItem colCount={2} cssClass="photo-row">
                  <ColCountByScreen xs={2} />
                  <FormItem cssClass="photo-box">
                    <FormPhoto link={user.image ?? ""} size={124} />
                  </FormItem>
                  <GroupItem>
                    <FormItem label={{ text: "Công ty" }}>
                      {isEditing ? (
                        <SelectBox
                          dataSource={departments}
                          value={formData.departmentId}
                          displayExpr="departmentName"
                          valueExpr="id"
                          onValueChanged={(e) => {
                            updateField("departmentId")(e.value);
                            updateField("position")(""); // reset position
                          }}
                        />
                      ) : (
                        <span>
                          {getDepartmentName(formData.departmentId as any)}
                        </span>
                      )}
                    </FormItem>

                    <FormItem label={{ text: "Vị trí trong công ty" }}>
                      {isEditing ? (
                        <SelectBox
                          dataSource={positions}
                          value={formData.position}
                          onValueChanged={(e) =>
                            updateField("position")(e.value)
                          }
                        />
                      ) : (
                        <span>{formData.position || "—"}</span>
                      )}
                    </FormItem>
                  </GroupItem>
                </GroupItem>

                <GroupItem cssClass="contact-fields-group">
                  <FormItem>
                    <FormTextbox
                      value={formData.phone ?? ""}
                      isEditing={!isEditing}
                      onValueChange={updateField("phone")}
                      icon="tel"
                      mask="+84 000 000 000"
                    />
                  </FormItem>
                  <FormItem>
                    <FormTextbox
                      value={formData.email}
                      isEditing={!isEditing}
                      onValueChange={updateField("email")}
                      icon="email"
                    />
                  </FormItem>
                  <FormItem>
                    <FormTextbox
                      value={formData.address}
                      isEditing={!isEditing}
                      onValueChange={updateField("address")}
                      icon="home"
                    />
                  </FormItem>
                  <FormItem label={{ text: "Trạng thái" }}>
                    {isEditing ? (
                      <SelectBox
                        dataSource={STATUS_ITEMS}
                        valueExpr="value"
                        displayExpr="text"
                        value={formData.status}
                        onValueChanged={(e) => updateField("status")(e.value)}
                      />
                    ) : (
                      renderStatusTag(formData.status)
                    )}
                  </FormItem>
                </GroupItem>
              </Form>
            </div>

            <div className="data-part data-part-toolbar border">
              <Toolbar>
                {!isEditing && (
                  <>
                    <ToolbarItem location="after">
                      <Button
                        icon="edit"
                        text="Chỉnh sửa"
                        stylingMode="contained"
                        type="default"
                        onClick={toggleEditHandler}
                      />
                    </ToolbarItem>
                    <ToolbarItem location="after">
                      <Button
                        icon="trash"
                        text="Xóa"
                        stylingMode="contained"
                        type="danger"
                        onClick={onDeleteClick}
                      />
                    </ToolbarItem>
                    <ToolbarItem location="after">
                      <Button
                        text="Chi tiết"
                        stylingMode="outlined"
                        type="normal"
                        onClick={navigateToDetails}
                      />
                    </ToolbarItem>
                  </>
                )}
                {isEditing && (
                  <>
                    <ToolbarItem location="after">
                      <Button
                        text="Save"
                        icon="save"
                        stylingMode="contained"
                        type="default"
                        onClick={onSaveClick}
                      />
                    </ToolbarItem>
                    <ToolbarItem location="after">
                      <Button
                        text="Cancel"
                        stylingMode="outlined"
                        type="normal"
                        onClick={cancelHandler}
                      />
                    </ToolbarItem>
                  </>
                )}
              </Toolbar>
            </div>
          </ValidationGroup>

          <Popup
            visible={confirmVisible}
            onHiding={() => setConfirmVisible(false)}
            showTitle={true}
            title="Xác nhận xóa"
            width={Math.min(window.innerWidth * 0.9, 400)}
            height="auto"
            dragEnabled={false}
            showCloseButton={true}
          >
            <div className="confirm-popup">
              <div className="confirm-message">
                Bạn có chắc chắn muốn xóa người dùng này?
              </div>
              <div className="popup-actions">
                <Button
                  text="Hủy"
                  stylingMode="outlined"
                  onClick={() => setConfirmVisible(false)}
                />
                <Button
                  text="Xóa"
                  type="danger"
                  stylingMode="contained"
                  onClick={handleDeleteConfirmed}
                />
              </div>
            </div>
          </Popup>

        </ScrollView>
      </div>

    </div>
  );
};
