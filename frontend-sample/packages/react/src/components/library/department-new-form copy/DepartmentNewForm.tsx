import React, { useState, useRef, useEffect, useCallback } from "react";
import Form, {
  Item,
  Label,
  RequiredRule,
  GroupItem,
  ColCountByScreen,
} from "devextreme-react/form";
import notify from "devextreme/ui/notify";
import { getSizeQualifier } from "../../../utils/media-query";
import { Department } from "../../../types/department";
import './DepartmentNewForm.scss';

interface DepartmentNewFormProps {
  initData: Partial<Department>;
  onDataChanged: (data: Partial<Department>) => void;
  onSubmit?: (
    data: Partial<Department>
  ) => Promise<{ isOk: boolean; message?: string }>;
  loading?: boolean;
}

export const DepartmentNewForm = ({
  initData,
  onDataChanged,
  onSubmit,
  loading = false,
}: DepartmentNewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<any>(null);

  const formData = useRef<Partial<Department>>({
    departmentName: "",
    position: [],
    description: "",
    user: [],
    ...initData,
  });

  const [positions, setPositions] = useState<string[]>(
    formData.current.position && formData.current.position.length > 0
      ? [...formData.current.position]
      : [""]
  );

  useEffect(() => {
    formData.current.position = positions;
  }, [positions]);

  const handlePositionChange = (value: string, index: number) => {
    const updated = [...positions];
    updated[index] = value;
    setPositions(updated);
  };

  const addPositionField = () => {
    setPositions([...positions, ""]);
  };

  const removePositionField = (index: number) => {
    if (positions.length <= 1) return;
    const updated = positions.filter((_, i) => i !== index);
    setPositions(updated);
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
            notify("Tạo công ty thành công!", "success", 3000);
          } else {
            notify(result.message || "Tạo công ty thất bại", "error", 3000);
          }
        }
        onDataChanged(formData.current);
      } catch (error) {
        notify("Lỗi khi tạo công ty", "error", 3000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onDataChanged]
  );

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

          <Item dataField="departmentName" editorType="dxTextBox" editorOptions={departmentNameEditorOptions}>
            <RequiredRule message="Bắt buộc" />
            <Label text="Tên công ty" />
          </Item>
        </GroupItem>

        <GroupItem>
          <Item>
            <Label text="Các vị trí trong công ty" />
            <div className="position-fields">
              {positions.map((pos, index) => (
                <div key={index} className="position-row">
                  <input
                    type="text"
                    value={pos}
                    placeholder={`Vị trí #${index + 1}`}
                    onChange={(e) => handlePositionChange(e.target.value, index)}
                  />
                  {positions.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removePositionField(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-btn" onClick={addPositionField}>
                + Thêm vị trí
              </button>
            </div>
          </Item>
        </GroupItem>
        <GroupItem>
               <Item
            dataField="description"
            editorType="dxTextArea"
            editorOptions={descriptionEditorOptions}
          >
            <Label text="Mô tả công ty" />
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
const departmentNameEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập tên công ty",
};

const descriptionEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập mô tả công ty",
};
