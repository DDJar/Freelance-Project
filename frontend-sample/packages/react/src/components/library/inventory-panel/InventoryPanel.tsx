import { useState } from "react";
import classNames from "classnames";
import { Button } from "devextreme-react/button";
import { ScrollView } from "devextreme-react/scroll-view";
import Toolbar, { Item as ToolbarItem } from "devextreme-react/toolbar";
import Form, { Item as FormItem, GroupItem } from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import ValidationGroup from "devextreme-react/validation-group";
import { FormTextbox } from "../..";
import { productApi } from "../../../api/product";
import { Product } from "../../../types/product";

export const InventoryPanel = ({
  product,
  isOpened,
  changePanelOpened,
  onDataChanged,
  onReloadList,
}: {
  product: Product;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  onDataChanged: (data: Product | null) => void;
  onReloadList: () => void;
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  const handleClose = () => {
    changePanelOpened(false);
    setQuantity(0);
    setNote("");
  };

  const handleSave = async () => {
    if (quantity <= 0) {
      notify("Vui lòng nhập số lượng hợp lệ", "warning", 3000);
      return;
    }

    // Gọi API cập nhật tồn kho
    const result = await productApi.updateInventory({
      productId: product.id,
      quantityChanged: quantity,
    });

    if (result.isOk) {
      notify("Nhập kho thành công", "success", 2000);

      // Gọi API lấy lại chi tiết sản phẩm mới nhất
      const res = await productApi.getById(product.id);
      if (res.isOk && res.data) {
        onDataChanged({
          ...res.data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // fallback nếu gọi getDetail lỗi
        onDataChanged({
          ...product,
          quantity: product.quantity + quantity,
          updatedAt: new Date().toISOString(),
        });
      }

      onReloadList();
      handleClose();
    } else {
      notify(result.message || "Nhập kho thất bại", "error", 3000);
    }
  };

  return (
    <div
      id="inventory-panel"
      className={classNames({
        panel: true,
        open: isOpened,
      })}
    >
      <div className="data-wrapper">
        <Toolbar className="panel-toolbar">
          <ToolbarItem location="before">
            <span className="contact-name value">Nhập kho: {product.name}</span>
          </ToolbarItem>
          <ToolbarItem location="after">
            <Button icon="close" stylingMode="text" onClick={handleClose} />
          </ToolbarItem>
        </Toolbar>

        <ScrollView className="panel-scroll">
          <ValidationGroup>
            <div className="data-part border">
              <Form className="plain-styled-form">
                <GroupItem colCount={1}>
                  <FormItem label={{ text: "Số lượng nhập" }}>
                    <FormTextbox
                      value={quantity.toString()}
                      isEditing={false}
                      onValueChange={(val) => setQuantity(Number(val))}
                    />
                  </FormItem>
                </GroupItem>
              </Form>
            </div>

            <div className="data-part data-part-toolbar border">
              <Toolbar>
                <ToolbarItem location="after">
                  <Button
                    text="Xác nhận"
                    icon="save"
                    stylingMode="contained"
                    type="default"
                    onClick={handleSave}
                  />
                </ToolbarItem>
                <ToolbarItem location="after">
                  <Button
                    text="Huỷ"
                    stylingMode="outlined"
                    type="normal"
                    onClick={handleClose}
                  />
                </ToolbarItem>
              </Toolbar>
            </div>
          </ValidationGroup>
        </ScrollView>
      </div>
    </div>
  );
};
