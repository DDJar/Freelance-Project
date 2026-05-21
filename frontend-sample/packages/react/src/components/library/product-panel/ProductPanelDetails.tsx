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
import { FormTextbox, FormPhoto } from "../..";
import { useScreenSize } from "../../../utils/media-query";
import ValidationGroup from "devextreme-react/validation-group";
import { productApi } from "../../../api/product";
import SelectBox from "devextreme-react/select-box";
import { departmentApi } from "../../../api/department";
import { Product } from "../../../types/product";
import { Department } from "../../../types/department";
import { InventoryPanel } from "../inventory-panel/InventoryPanel";

export const ProductPanelDetails = ({
  product,
  isOpened,
  changePanelOpened,
  onDataChanged,
  changePanelPinned,
  onReloadList,
}: {
  product: Product;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  onDataChanged: (data: Product | null) => void;
  changePanelPinned: () => void;
  onReloadList: () => void;
}) => {
  const [formData, setFormData] = useState<Product>(product);
  const [isPinned, setIsPinned] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { isLarge, isMedium } = useScreenSize();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isInventoryPanelOpen, setIsInventoryPanelOpen] = useState(false);

  useEffect(() => {
    setFormData(product);
  }, [product]);

  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) {
        setDepartments(res.data);
      }
    });
  }, []);

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
  }, [changePanelOpened]);

  const toggleEditHandler = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const cancelHandler = useCallback(() => {
    setFormData(product);
    setIsEditing(false);
  }, [product]);

  const onSaveClick = useCallback(
    async ({ validationGroup }: ButtonTypes.ClickEvent) => {
      const result = validationGroup.validate();
      if (!result.isValid) return;

      const updatedProduct = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      const response = await productApi.update(product.id, updatedProduct);
      if (response.isOk) {
        notify("Cập nhật thành công", "success", 2000);
        onDataChanged(formData);
        onReloadList();
        setIsEditing(false);
      } else {
        notify(response.message || "Cập nhật thất bại", "error", 3000);
      }
    },
    [formData, product.id, onDataChanged, onReloadList]
  );

  const onDeleteClick = useCallback(async () => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?");
    if (!confirmDelete) return;

    const result = await productApi.delete(product.id);
    if (result.isOk) {
      notify("Xóa sản phẩm thành công", "success", 2000);
      changePanelOpened(false);
      onDataChanged(null);
    } else {
      notify(result.message || "Xóa thất bại", "error", 3000);
    }
  }, [product.id, changePanelOpened, onDataChanged]);

  const getDepartmentName = (id: string) => {
    return departments.find((d) => d.id === id)?.departmentName || "";
  };

  // ✅ Helper rút gọn tên
  const getShortName = (name: string, maxLen = 60) => {
    return name.length > maxLen ? `${name.substring(0, maxLen)}...` : name;
  };

  return (
    <div
  id="product-panel"
  className={classNames({
    'product-panel': true,
    open: isOpened,
    pin: isPinned && (isLarge || isMedium),
  })}
>
  <div className="product-panel__data-wrapper">
    <Toolbar className="product-panel__data-wrapper__toolbar">
      <ToolbarItem location="before">
        <span className="contact-name value" title={product.name}>
          {getShortName(product.name)}
        </span>
      </ToolbarItem>
      <ToolbarItem location="after" visible={isLarge || isMedium}>
        <Button icon={isPinned ? "pin" : "unpin"} stylingMode="text" onClick={onPinClick} />
      </ToolbarItem>
      <ToolbarItem location="after">
        <Button icon="close" stylingMode="text" onClick={onClosePanelClick} />
      </ToolbarItem>
    </Toolbar>

    <ScrollView className="panel-scroll">
      <ValidationGroup>
        <div className="data-part border">
          <Form className={classNames("plain-styled-form", { "view-mode": !isEditing })}>
            <GroupItem colCount={2} cssClass="photo-row">
              <ColCountByScreen xs={2} />
              <FormItem cssClass="photo-box">
                <FormPhoto
                  link={formData.imageUrl ? `${formData.imageUrl}` : ""}
                  size={124}
                />
                {isEditing && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          const base64Data = result.split(",")[1];
                          updateField("imageUrl")(base64Data);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                )}
              </FormItem>
              <GroupItem>
                <FormItem label={{ text: "Công ty" }}>
                  {isEditing ? (
                    <SelectBox
                      dataSource={departments}
                      value={formData.idDepartment}
                      displayExpr="departmentName"
                      valueExpr="id"
                      onValueChanged={(e) => updateField("idDepartment")(e.value)}
                    />
                  ) : (
                    <span>{getDepartmentName(formData.idDepartment as any)}</span>
                  )}
                </FormItem>
                <FormItem label={{ text: "Mã sản phẩm" }}>
                  <FormTextbox
                    value={formData.productCode ?? ""}
                    isEditing={!isEditing}
                    onValueChange={updateField("productCode")}
                  />
                </FormItem>
              </GroupItem>
            </GroupItem>

            <GroupItem cssClass="contact-fields-group">
              <FormItem label={{ text: "Tên sản phẩm" }}>
                <FormTextbox
                  value={formData.name ?? ""}
                  isEditing={!isEditing}
                  onValueChange={updateField("name")}
                />
              </FormItem>
              <FormItem label={{ text: "Danh mục" }}>
                <FormTextbox
                  value={formData.category ?? ""}
                  isEditing={!isEditing}
                  onValueChange={updateField("category")}
                />
              </FormItem>
              <FormItem label={{ text: "Ngày tạo" }}>
                <FormTextbox
                  value={
                    formData.createdAt
                      ? `${new Date(formData.createdAt).toLocaleDateString("vi-VN")} ${new Date(
                          formData.createdAt
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}`
                      : ""
                  }
                  isEditing={false}
                  onValueChange={() => {}}
                />
              </FormItem>
              <FormItem label={{ text: "Ngày cập nhật" }}>
                <FormTextbox
                  value={
                    formData.updatedAt
                      ? `${new Date(formData.updatedAt).toLocaleDateString("vi-VN")} ${new Date(
                          formData.updatedAt
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}`
                      : ""
                  }
                  isEditing={false}
                  onValueChange={() => {}}
                />
              </FormItem>
              <FormItem label={{ text: "Giá" }}>
                <FormTextbox
                  value={
                    isEditing
                      ? formData.price.toString()
                      : Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(formData.price)
                  }
                  isEditing={!isEditing}
                  onValueChange={(val) => {
                    const number = parseFloat(val.replace(/[^0-9.]/g, ""));
                    updateField("price")(isNaN(number) ? 0 : number);
                  }}
                />
              </FormItem>
              <FormItem label={{ text: "Số lượng trong kho" }}>
                <div style={{ pointerEvents: "none" }}>
                  <FormTextbox
                    value={formData.quantity.toString()}
                    isEditing={false}
                    onValueChange={() => {}}
                  />
                </div>
              </FormItem>
            </GroupItem>
          </Form>
        </div>

        <div className="data-part data-part-toolbar border">
          <Toolbar>
            {!isEditing ? (
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
                    text="Nhập kho"
                    stylingMode="outlined"
                    type="normal"
                    onClick={() => setIsInventoryPanelOpen(true)}
                  />
                </ToolbarItem>
              </>
            ) : (
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
      <div className="data-part" />
    </ScrollView>
  </div>

  <InventoryPanel
    product={product}
    isOpened={isInventoryPanelOpen}
    changePanelOpened={setIsInventoryPanelOpen}
    onDataChanged={onDataChanged}
    onReloadList={onReloadList}
  />
</div>

  );
};
