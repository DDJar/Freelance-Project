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
import { billApi } from "../../../api/bill";
import SelectBox, { From } from "devextreme-react/select-box";
import { departmentApi } from "../../../api/department";
import { renderStatusTag } from "../../../utils/status-color";
import { Bill } from "../../../types/bill";
import { Department } from "../../../types/department";

export const BillPanelDetails = ({
  bill,
  isOpened,
  changePanelOpened,
  onDataChanged,
  changePanelPinned,
}: {
  bill: Bill;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  onDataChanged: (data: Bill | null) => void;
  changePanelPinned: () => void;
}) => {
  const [formData, setFormData] = useState<Bill>(bill);
  const [isPinned, setIsPinned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isLarge, isMedium } = useScreenSize();
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
      (d) => d.id === formData.id
    );
    setPositions(selectedDept?.position || []);
  }, [formData.id, departments]);

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
    setFormData(bill);
  }, [bill, toggleEditHandler]);


  const onDeleteClick = useCallback(async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa người dùng này?"
    );
    if (!confirmDelete) return;

    const result = await billApi.delete(bill.id ?? "");
    if (result.isOk) {
      notify("Xóa người dùng thành công", "success", 2000);
      changePanelOpened(false);
      onDataChanged(null);
    } else {
      notify(result.message || "Xóa thất bại", "error", 3000);
    }
  }, [bill.id, changePanelOpened, onDataChanged]);

  const navigateToDetails = useCallback(() => {
    navigate(`/Bill-details/${bill.id}`);
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
            <span className="contact-name value">{`Hóa đơn : ${bill.id}`}</span>
          </ToolbarItem>
          <ToolbarItem location="before">
            {/* <ContactStatus text={Bill.status} /> */}
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

                  <FormItem >
                    <FormTextbox
                      value={''}
                      isEditing={!isEditing}
                      onValueChange={updateField("address")}
                      icon="home"
                    />
                  </FormItem>
                </GroupItem>


                <GroupItem cssClass="contact-fields-group">
                  <FormItem label={{ text: "Mã định danh" }}>
                    <FormTextbox
                      value={formData.identifyNumber}
                      isEditing={isEditing}
                      onValueChange={updateField("identifyNumber")}
                    />
                  </FormItem>

                  <FormItem label={{ text: "Tên khách hàng" }}>
                    <FormTextbox
                      value={`${formData.firstName} ${formData.lastName}`}
                      isEditing={false} // Không cho sửa tên đầy đủ
                      onValueChange={() => { }}
                    />
                  </FormItem>

                  

                  <FormItem label={{ text: "Ngày sinh" }}>
                    <FormTextbox
                      value={
                        formData.dateOfBirth
                          ? new Date(formData.dateOfBirth).toLocaleDateString("vi-VN")
                          : ""
                      }
                      isEditing={isEditing}
                      onValueChange={updateField("dateOfBirth")}
                    />
                  </FormItem>


                  <FormItem label={{ text: "Số điện thoại" }}>
                    <FormTextbox
                      value={formData.phone}
                      isEditing={isEditing}
                      onValueChange={updateField("phone")}
                    />
                  </FormItem>

                  <FormItem label={{ text: "Email" }}>
                    <FormTextbox
                      value={formData.email}
                      isEditing={isEditing}
                      onValueChange={updateField("email")}
                    />
                  </FormItem>

                  <FormItem label={{ text: "Địa chỉ" }}>
                    <FormTextbox
                      value={formData.address}
                      isEditing={isEditing}
                      onValueChange={updateField("address")}
                    />
                  </FormItem>

                  <FormItem label={{ text: "Ngày tạo hóa đơn" }}>
                    <FormTextbox
                      value={
                        formData.billDate
                          ? `${new Date(formData.billDate).toLocaleDateString("vi-VN")} ${new Date(formData.billDate).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}`
                          : ""
                      }
                      isEditing={false}
                      onValueChange={() => { }}
                    />
                  </FormItem>



                  <FormItem label={{ text: "Phương thức thanh toán" }}>
                    <FormTextbox
                      value={formData.paymentMethod}
                      isEditing={isEditing}
                      onValueChange={updateField("paymentMethod")}
                    />
                  </FormItem>

                  <FormItem label={{ text: "Ghi chú" }}>
                    <FormTextbox
                      value={formData.notes}
                      isEditing={isEditing}
                      onValueChange={updateField("notes")}
                    />
                  </FormItem>

                  <FormItem label={{ text: "Tổng tiền" }}>
                    <FormTextbox
                      value={Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(formData.totalAmount)}
                      isEditing={false}
                      onValueChange={() => { }}
                    />
                  </FormItem>


                  <FormItem label={{ text: "Trạng thái" }}>
                    <FormTextbox
                      value={formData.status.toString()}
                      isEditing={false}
                      onValueChange={() => { }}
                    />
                  </FormItem>
                </GroupItem>
              </Form>
            </div>

            <div className="data-part data-part-toolbar border">
              <Toolbar>
                {/* {!isEditing && (
                <>
                  <ToolbarItem location="after">
                    <Button
                      icon="edit"
                      text="Edit"
                      stylingMode="contained"
                      type="default"
                      onClick={toggleEditHandler}
                    />
                  </ToolbarItem>
                  <ToolbarItem location="after">
                      <Button
                        icon="trash"
                        text="Delete"
                        stylingMode="contained"
                        type="danger"
                        onClick={onDeleteClick}
                      />
                    </ToolbarItem>
                    <ToolbarItem location="after">
                      <Button
                        text="Details"
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
              )} */}
                <ToolbarItem location="after">
                  <Button
                    icon="trash"
                    text="Delete"
                    stylingMode="contained"
                    type="danger"
                    onClick={onDeleteClick}
                  />
                </ToolbarItem>
              </Toolbar>
            </div>
          </ValidationGroup>
          <div className="data-part" />
        </ScrollView>
      </div>
    </div >
  );
};
