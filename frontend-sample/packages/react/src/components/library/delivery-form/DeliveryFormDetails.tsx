import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import Form, {
  SimpleItem,
  GroupItem,
  ColCountByScreen,
  ButtonItem,
} from "devextreme-react/form";
import SelectBox from "devextreme-react/select-box";
import TextArea from "devextreme-react/text-area";
import ValidationGroup from "devextreme-react/validation-group";
import notify from "devextreme/ui/notify";

import { FormTextbox } from "../../utils/form-textbox/FormTextbox";
import { FormDateBox } from "../../utils/form-datebox/FormDateBox";
import { deliveryApi } from "../../../api/delivery";
import { getSizeQualifier } from "../../../utils/media-query";
import { Delivery, CreateDeliveryRequest, DeliveryStatus } from "../../../types/delivery";

const DELIVERY_STATUS_ITEMS = [
  { value: "Chờ giao", text: "Chờ giao" },
  { value: "Đã giao", text: "Đã giao" },
  { value: "Đã hủy", text: "Đã hủy" },
];

export const DeliveryFormDetails = ({
  data,
  onUpdated,
  editing: editingProp = false,
  onDataChanged,
}: {
  data: Delivery;
  onUpdated?: () => void;
  editing?: boolean;
  onDataChanged?: React.Dispatch<React.SetStateAction<Delivery | undefined>>;
}) => {
  const [formData, setFormData] = useState<Delivery>({ ...data });
  const [isEditing, setIsEditing] = useState(false);
  const validationGroupRef = useRef<any>(null);

  // ✅ Khi data hoặc editingProp thay đổi, reset form và trạng thái edit
  useEffect(() => {
    setFormData({ ...data });
    setIsEditing(false);
  }, [data, editingProp]);

  const updateField = (field: keyof Delivery) => (value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    onDataChanged?.((prev) => ({ ...prev!, [field]: value }));
  };

  const handleSave = async () => {
    const result = validationGroupRef.current?.instance()?.validate();
    if (!result?.isValid) return;

    const request: CreateDeliveryRequest = {
      billId: formData.billId,
      deliveryDate: formData.deliveryDate,
      deliveredBy: formData.deliveredBy,
      recipient: formData.recipient,
      status: formData.status as DeliveryStatus,
      notes: formData.notes,
    };

    const res = await deliveryApi.update(formData.id!, request);
    if (res.isOk) {
      notify("Lưu thành công", "success", 2000);
      setIsEditing(false);
      onUpdated?.();
    } else {
      notify(`Lỗi khi lưu: ${res.message}`, "error", 3000);
    }
  };

  const handleCancel = () => {
    setFormData({ ...data });
    setIsEditing(false);
  };

  // ✅ Nếu editingProp = false thì không cho chỉnh sửa (chỉ readonly)
  const canEdit = editingProp;

  return (
    <ValidationGroup ref={validationGroupRef}>
      <Form
        className={classNames("plain-styled-form delivery-form-details", {
          "view-mode": !isEditing,
        })}
        screenByWidth={getSizeQualifier}
      >
        <SimpleItem colSpan={2}>
          <FormTextbox
            label="Mã hóa đơn"
            value={formData.billId}
            isEditing={isEditing}
            onValueChange={updateField("billId")}
          />
        </SimpleItem>

        <GroupItem itemType="group">
          <ColCountByScreen xs={1} sm={2} md={2} lg={2} />

          <SimpleItem>
            <FormDateBox
              value={formData.deliveryDate}
              readOnly={!isEditing}
              name="deliveryDate"
              label="Ngày giao"
              onValueChange={updateField("deliveryDate")}
            />
          </SimpleItem>

          <SimpleItem>
            <FormTextbox
              label="Người giao"
              value={formData.deliveredBy}
              isEditing={isEditing}
              onValueChange={updateField("deliveredBy")}
            />
          </SimpleItem>

          <SimpleItem>
            <FormTextbox
              label="Người nhận"
              value={formData.recipient}
              isEditing={isEditing}
              onValueChange={updateField("recipient")}
            />
          </SimpleItem>

          <SimpleItem>
            <SelectBox
              value={formData.status}
              items={DELIVERY_STATUS_ITEMS}
              displayExpr="text"
              valueExpr="value"
              readOnly={!isEditing}
              stylingMode="filled"
              onValueChange={updateField("status")}
            />
          </SimpleItem>
        </GroupItem>

        <SimpleItem colSpan={2}>
          <TextArea
            value={formData.notes}
            readOnly={!isEditing}
            stylingMode="filled"
            onValueChange={updateField("notes")}
          />
        </SimpleItem>

        {canEdit && (
          <GroupItem colCount={2} colSpan={2}>
            <ButtonItem
              buttonOptions={{
                text: isEditing ? "Lưu" : "Chỉnh sửa",
                type: isEditing ? "default" : "normal",
                icon: isEditing ? "save" : "edit",
                onClick: () => {
                  if (isEditing) {
                    handleSave();
                  } else if (canEdit) {
                    setIsEditing(true);
                  }
                },
                width: "100%",
              }}
            />

            {isEditing && (
              <ButtonItem
                buttonOptions={{
                  text: "Hủy",
                  type: "normal",
                  icon: "close",
                  onClick: handleCancel,
                  width: "100%",
                }}
              />
            )}
          </GroupItem>
        )}
      </Form>
    </ValidationGroup>
  );
};
