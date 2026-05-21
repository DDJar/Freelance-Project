import React, { useState, useRef, useCallback } from "react";
import Form, {
  Form as FormInstance,
  Item,
  Label,
  RequiredRule,
  GroupItem,
  ColCountByScreen,
} from "devextreme-react/form";
import FileUploader from "devextreme-react/file-uploader";
import notify from "devextreme/ui/notify";
import { getSizeQualifier } from "../../../utils/media-query";
import { Blog } from "../../../types/blog";

interface BlogNewFormProps {
  initData: Partial<Blog>;
  onDataChanged: (data: Partial<Blog>, imageFile?: File | null) => void;
  onSubmit?: (
    data: Partial<Blog>,
    imageFile?: File | null
  ) => Promise<{ isOk: boolean; message?: string }>;
  loading?: boolean;
}

export const BlogNewForm = ({
  initData,
  onDataChanged,
  onSubmit,
  loading = false,
}: BlogNewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [imageFile, setImageFile] = useState<File | null>(null);
  const imageFileRef = useRef<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // ✅ Thêm state preview
  const formRef = useRef<any>(null);

  const formData = useRef<Partial<Blog>>({
    title: "",
    content: "",
    status: "Draft",
    author: "",
    updatedAt: new Date(),
    createdAt: new Date(),
    ...initData,
  });

  if (!formData.current.id) {
    delete formData.current.id;
  }

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault?.();
      const dxFormInstance = formRef.current?.instance?.();
      if (!dxFormInstance) return;

      const validationResult = dxFormInstance.validate();
      if (!validationResult?.isValid) {
        notify("Please fill in all required fields correctly", "error", 3000);
        return;
      }

      setIsSubmitting(true);
      try {
        const imageFile = imageFileRef.current;
        console.log("🚀 [FORM] Submitting with imageFile:", imageFile);

        if (onSubmit) {
          const result = await onSubmit(formData.current, imageFile);

          if (result.isOk) {
            notify("Blog created successfully!", "success", 3000);
          } else {
            notify(result.message || "Failed to create blog", "error", 3000);
          }
        }

        onDataChanged(formData.current, imageFile);
      } catch (error) {
        notify("Error creating blog", "error", 3000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onDataChanged]
  );

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      formData.current = { ...formData.current, [field]: value };
      onDataChanged(formData.current, imageFileRef.current);
    },
    [onDataChanged, imageFileRef]
  );

  // ✅ Thêm handler cho file upload với preview
  const handleFileChange = useCallback(
    (e: any) => {
      const file = e.value?.[0];
      console.log("📁 [FILE UPLOADED]:", file);
      if (file) {
        imageFileRef.current = file;

        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
      } else {
        imageFileRef.current = null;
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      }
    },
    [previewUrl]
  );

  // ✅ Clean up preview URL khi component unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form className="plain-styled-form" onSubmit={handleSubmit}>
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

          <Item
            dataField="title"
            editorType="dxTextBox"
            editorOptions={titleEditorOptions}
          >
            <RequiredRule message="Title is required" />
            <Label text="Tiêu đề" />
          </Item>

          <Item
            dataField="content"
            editorType="dxTextArea"
            editorOptions={contentEditorOptions}
          >
            <RequiredRule message="Content is required" />
            <Label text="Nội dung" />
          </Item>

          <Item
            dataField="author"
            editorType="dxTextBox"
            editorOptions={authorEditorOptions}
          >
            <RequiredRule message="Author is required" />
            <Label text="Tác giả" />
          </Item>

          <Item
            dataField="status"
            editorType="dxSelectBox"
            editorOptions={statusEditorOptions}
          >
            <Label text="Trạng thái bài đăng" />
          </Item>

          {/* ✅ File upload với preview */}
          <Item>
            <Label text="Ảnh đại diện" />
            <FileUploader
              selectButtonText="Chọn ảnh"
              labelText=""
              accept="image/*"
              uploadMode="useForm"
              showFileList={true}
              onValueChanged={handleFileChange} // ✅ Sử dụng handler mới
            />
            {/* ✅ Thêm preview image */}
            {previewUrl && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </Item>
        </GroupItem>

        <Item
          itemType="button"
          buttonOptions={{
            text: "Lưu",
            type: "default",
            onClick: handleSubmit, // ✅ Gọi hàm handleSubmit thủ công
            disabled: isSubmitting || loading,
            icon: isSubmitting || loading ? undefined : "save",
            elementAttr: { class: "dx-save-button" },
          }}
        />
      </Form>
    </form>
  );
};

// Editor Options remain unchanged
const titleEditorOptions = {
  stylingMode: "filled",
  placeholder: "Enter Title",
};

const contentEditorOptions = {
  stylingMode: "filled",
  placeholder: "Enter Content",
};

const authorEditorOptions = {
  stylingMode: "filled",
  placeholder: "Enter Author",
};

const statusEditorOptions = {
  stylingMode: "filled",
  dataSource: [
    { value: "Draft", text: "Draft" },
    { value: "Published", text: "Published" },
    { value: "Archived", text: "Archived" },
  ],
  valueExpr: "value",
  displayExpr: "text",
  value: "Draft",
};
