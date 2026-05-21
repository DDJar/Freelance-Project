import React, { useState, useRef, useCallback } from "react";
import Form, {
  Item,
  Label,
  RequiredRule,
  EmailRule,
  GroupItem,
  ColCountByScreen,
} from "devextreme-react/form";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { getSizeQualifier } from "../../../utils/media-query";
import { Product } from "../../../types/product";

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
    ...initData,
  });

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const dxFormInstance = formRef.current?.instance?.();
      if (!dxFormInstance) return;

      const validationResult = dxFormInstance.validate();
      if (!validationResult?.isValid) {
        notify("Please fill in all required fields correctly", "error", 3000);
        return;
      }

      setIsSubmitting(true);
      try {
        if (onSubmit) {
          const result = await onSubmit(formData.current);
          if (result.isOk) {
            notify("Contact created successfully!", "success", 3000);
          } else {
            notify(result.message || "Failed to create contact", "error", 3000);
          }
        }
        onDataChanged(formData.current);
      } catch (error) {
        notify("Error creating contact", "error", 3000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onDataChanged]
  );

  // const handleFieldChange = useCallback(
  //   (field: string, value: any) => {
  //     formData.current = { ...formData.current, [field]: value };

  //     if (field === "phoneNumber") {
  //       formData.current.price = value;
  //     } else if (field === "phone") {
  //       formData.current.price = value;
  //     }

  //     onDataChanged(formData.current);
  //   },
  //   [onDataChanged]
  // );

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

      <Item dataField="name" editorType="dxTextBox" editorOptions={nameEditorOptions}>
        <RequiredRule message="Product name is required" />
        <Label text="Product Name" />
      </Item>

      <Item dataField="category" editorType="dxTextBox" editorOptions={categoryEditorOptions}>
        <Label text="Category" />
      </Item>

      <Item dataField="quantity" editorType="dxNumberBox" editorOptions={quantityEditorOptions}>
        <RequiredRule message="Quantity is required" />
        <Label text="Quantity" />
      </Item>

      <Item dataField="price" editorType="dxNumberBox" editorOptions={priceEditorOptions}>
        <RequiredRule message="Price is required" />
        <Label text="Price" />
      </Item>

      <Item dataField="unit" editorType="dxTextBox" editorOptions={unitEditorOptions}>
        <Label text="Unit" />
      </Item>

      <Item dataField="imageUrl" editorType="dxTextBox" editorOptions={imageUrlEditorOptions}>
        <Label text="Image URL" />
      </Item>
    </GroupItem>

    <GroupItem>
      <ColCountByScreen xs={1} sm={2} md={2} lg={2} />

      <Item dataField="description" editorType="dxTextArea" editorOptions={descriptionEditorOptions}>
        <Label text="Description" />
      </Item>

      <Item dataField="idDepartment" editorType="dxTextBox" editorOptions={departmentEditorOptions}>
        <Label text="Department ID" />
      </Item>
    </GroupItem>

    <Item
      itemType="button"
      buttonOptions={{
        text: "Save",
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
const nameEditorOptions = { stylingMode: "filled", placeholder: "Enter product name" };
const categoryEditorOptions = { stylingMode: "filled", placeholder: "Enter category" };
const quantityEditorOptions = { stylingMode: "filled", min: 0 };
const priceEditorOptions = { stylingMode: "filled", min: 0, format: "#,##0 VNĐ" };
const unitEditorOptions = { stylingMode: "filled", placeholder: "e.g. piece, kg, box" };
const imageUrlEditorOptions = { stylingMode: "filled", placeholder: "Paste image URL" };
const descriptionEditorOptions = { stylingMode: "filled", placeholder: "Enter product description" };
const departmentEditorOptions = { stylingMode: "filled", placeholder: "Enter department ID" };


// const genderEditorOptions = {
//   stylingMode: "filled",
//   dataSource: [
//     { value: "Male", text: "Male" },
//     { value: "Female", text: "Female" },
//     { value: "Other", text: "Other" },
//   ],
//   valueExpr: "value",
//   displayExpr: "text",
//   placeholder: "Select gender",
// };

// const roleEditorOptions = {
//   stylingMode: "filled",
//   dataSource: [
//     { value: "User", text: "User" },
//     { value: "Admin", text: "Admin" },
//     { value: "Manager", text: "Manager" },
//   ],
//   valueExpr: "value",
//   displayExpr: "text",
//   value: "User",
// };

// const statusEditorOptions = {
//   stylingMode: "filled",
//   dataSource: [
//     { value: "Salaries", text: "Salaries" },
//     { value: "Commission", text: "Commission" },
//     { value: "Terminated", text: "Terminated" },
//   ],
//   valueExpr: "value",
//   displayExpr: "text",
//   value: "Salaries",
// };
