import React, { useState, useRef, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import Form, {
  Item,
  Label,
  RequiredRule,
  GroupItem,
  ColCountByScreen,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import { getSizeQualifier } from "../../../utils/media-query";
import { Product } from "../../../types/product";
import { Department } from "../../../types/department";
import { departmentApi } from "../../../api/department";

interface ProductNewFormProps {
  initData: Partial<Product>;
  onDataChanged: (data: Partial<Product>) => void;
  onSubmit?: (
    data: Partial<Product>
  ) => Promise<{ isOk: boolean; message?: string }>;
  loading?: boolean;
}

export const ProductNewForm = ({
  initData,
  onDataChanged,
  onSubmit,
  loading = false,
}: ProductNewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<any>(null);

  const formData = useRef({
    name: "",
    category: "",
    quantity: 0,
    price: 0,
    unit: "",
    description: "",
    imageUrl: "",
    idDepartment: "",
    productCode: "",
    ...initData,
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [previewImage, setPreviewImage] = useState<string>("");

  useEffect(() => {
    if (initData.imageUrl) {
      setPreviewImage(initData.imageUrl.startsWith("data:")
        ? initData.imageUrl
        : `data:image/jpeg;base64,${initData.imageUrl}`);
    }
  }, [initData.imageUrl]);

  useEffect(() => {
    departmentApi.getAll().then((res) => {
      if (res.isOk && res.data) {
        setDepartments(res.data);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;

      // Tách base64 (bỏ prefix)
      const base64Data = result.split(",")[1];

      formData.current.imageUrl = base64Data;

      // Dùng nguyên chuỗi có prefix cho preview
      setPreviewImage(result);

      if (formRef.current?.instance) {
        formRef.current.instance().updateData("imageUrl", base64Data);
      }

      notify("Đã chọn ảnh thành công!", "success", 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const dxFormInstance = formRef.current?.instance?.();
      if (!dxFormInstance) return;

      const validationResult = dxFormInstance.validate();
      if (!validationResult?.isValid) {
        notify("Vui lòng điền đầy đủ thông tin bắt buộc", "error", 3000);
        return;
      }

      setIsSubmitting(true);
      try {
        if (onSubmit) {
          const result = await onSubmit(formData.current);
          if (result.isOk) {
            notify("Tạo sản phẩm thành công!", "success", 3000);
          } else {
            notify(result.message || "Tạo sản phẩm thất bại", "error", 3000);
          }
        }
        onDataChanged(formData.current);
      } catch (error) {
        notify("Lỗi khi tạo sản phẩm", "error", 3000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onDataChanged]
  );

  const FileInput = ({ onChange }: { onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    return <input type="file" accept="image/*" onChange={onChange} />;
  };

  return (
    <form className="plain-styled-form" onSubmit={handleSubmit}>
      {/* Preview hình ảnh */}
      {previewImage && (
        <div style={{ marginBottom: 20, textAlign: "left" }}>
          <img
            src={previewImage}
            alt="Preview"
            style={{
              width: "150px",
              height: "150px",
              objectFit: "contain",
              borderRadius: 8,
              border: "1px solid #ccc",
              backgroundColor: "#f9f9f9",
            }}
          />
        </div>
      )}

      <Form
        ref={formRef}
        formData={formData.current}
        disabled={loading || isSubmitting}
        showValidationSummary={false}
        screenByWidth={getSizeQualifier}
        labelLocation="top"
      >
        <GroupItem>
          <ColCountByScreen xs={1} sm={2} md={2} lg={2} />

          <Item dataField="name" editorType="dxTextBox" editorOptions={nameEditorOptions}>
            <RequiredRule message="Bắt buộc" />
            <Label text="Tên sản phẩm" />
          </Item>

          <Item dataField="category" editorType="dxTextBox" editorOptions={categoryEditorOptions}>
            <Label text="Danh mục" />
          </Item>

          <Item dataField="price" editorType="dxNumberBox" editorOptions={priceEditorOptions}>
            <RequiredRule message="Bắt buộc" />
            <Label text="Giá" />
          </Item>

          <Item dataField="unit" editorType="dxTextBox" editorOptions={unitEditorOptions}>
            <Label text="Đơn vị" />
          </Item>

          <Item dataField="productCode" editorType="dxTextBox" editorOptions={productCodeEditorOptions}>
            <RequiredRule message="Bắt buộc" />
              <Label text="Mã sản phẩm" />
          </Item>
          <Item
            dataField="idDepartment"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: departments,
              displayExpr: "departmentName",
              valueExpr: "id",
              placeholder: "Chọn công ty",
              stylingMode: "filled",
              onValueChanged: (e: any) => {
                formData.current.idDepartment = e.value;
              },
            }}
          >
            <RequiredRule message="Bắt buộc" />
            <Label text="Công ty" />
          </Item>
          <Item
            label={{ text: "Chọn file ảnh" }}
            template={(data, itemElement) => {
              const root = createRoot(itemElement as unknown as Element);
              root.render(<FileInput onChange={handleFileChange} />);
            }}
          />
        </GroupItem>

        <GroupItem>
          <Item dataField="description" editorType="dxTextArea" editorOptions={descriptionEditorOptions}>
            <Label text="Mô tả sản phẩm" />
          </Item>
        </GroupItem>

        <Item
          itemType="button"
          buttonOptions={{
            text: "Lưu",
            type: "default",
            useSubmitBehavior: true,
            disabled: isSubmitting || loading,
            icon: isSubmitting || loading ? undefined : "save",
            elementAttr: { class: "dx-save-button" },
          }}
        />
      </Form>
    </form>
  );
};

// Editor Options
const nameEditorOptions = { stylingMode: "filled", placeholder: "Nhập tên sản phẩm" };
const categoryEditorOptions = { stylingMode: "filled", placeholder: "Nhập danh mục" };
const priceEditorOptions = { stylingMode: "filled", min: 0, format: "#,##0 VNĐ" };
const unitEditorOptions = { stylingMode: "filled", placeholder: "VD: cái, kg, hộp" };
const descriptionEditorOptions = { stylingMode: "filled", placeholder: "Nhập mô tả sản phẩm" };
const productCodeEditorOptions = {stylingMode: "filled",placeholder: "Nhập mã sản phẩm (VD: SP001)"};

