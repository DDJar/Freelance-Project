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
import { User } from "../../../types/auth";
import { hashPassword, validatePassword } from "../../../utils/hash-password";

interface ContactNewFormProps {
  initData: Partial<User>;
  onDataChanged: (data: Partial<User>) => void;
  onSubmit?: (
    data: Partial<User>
  ) => Promise<{ isOk: boolean; message?: string }>;
  loading?: boolean;
}

export const ContactNewForm = ({
  initData,
  onDataChanged,
  onSubmit,
  loading = false,
}: ContactNewFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<any>(null);

  const formData = useRef({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    phoneNumber: "",
    phone: "",
    gender: "",
    role: "User",
    address: "",
    country: "Vietnam",
    city: "Ho Chi Minh City",
    status: "Salaried",
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

      // Validate password before hashing
      const passwordValidation = validatePassword(formData.current.password || "");
      if (!passwordValidation.isValid) {
        notify(passwordValidation.message || "Invalid password", "error", 3000);
        return;
      }

      setIsSubmitting(true);
      try {
        if (onSubmit) {
          // Hash password before submitting
          const hashedPassword = await hashPassword(formData.current.password || "");
          const dataToSubmit = {
            ...formData.current,
            password: hashedPassword,
          };

          const result = await onSubmit(dataToSubmit);
          if (result.isOk) {
            notify("Contact created successfully!", "success", 3000);
          } else {
            notify(result.message || "Failed to create contact", "error", 3000);
          }
        }
        onDataChanged(formData.current);
      } catch (error) {
        notify("Error creating contact", "error", 3000);
        console.error("Submit error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onDataChanged]
  );

  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      formData.current = { ...formData.current, [field]: value };

      if (field === "phoneNumber") {
        formData.current.phone = value;
      } else if (field === "phone") {
        formData.current.phoneNumber = value;
      }

      onDataChanged(formData.current);
    },
    [onDataChanged]
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

          <Item dataField="firstname" editorType="dxTextBox" editorOptions={firstNameEditorOptions}>
            <RequiredRule message="Yêu cầu nhập họ" />
            <Label text="Họ" />
          </Item>

          <Item dataField="lastname" editorType="dxTextBox" editorOptions={lastNameEditorOptions}>
            <RequiredRule message="Yêu cầu nhập tên" />
            <Label text="Tên" />
          </Item>

          <Item dataField="username" editorType="dxTextBox" editorOptions={usernameEditorOptions}>
            <RequiredRule message="Yêu cầu nhập tên tài khoản" />
            <Label text="Tên tài khoản" />
          </Item>

          <Item dataField="gender" editorType="dxSelectBox" editorOptions={genderEditorOptions}>
            <Label text="Giới tính" />
          </Item>

          <Item dataField="role" editorType="dxSelectBox" editorOptions={roleEditorOptions}>
            <Label text="Vai trò tài khoản" />
          </Item>

          <Item dataField="phoneNumber" editorType="dxTextBox" editorOptions={phoneEditorOptions}>
            <Label text="Số điện thoại" />
          </Item>
        </GroupItem>

        <GroupItem cssClass="contact-fields-group">
          <ColCountByScreen xs={1} sm={2} md={2} lg={2} />

          <Item dataField="email" editorType="dxTextBox" editorOptions={emailEditorOptions}>
            <RequiredRule message="Email is required" />
            <EmailRule message="Please enter a valid email address" />
            <Label text="Email" />
          </Item>

          <Item dataField="address" editorType="dxTextBox" editorOptions={addressEditorOptions}>
            <Label text="Địa chỉ" />
          </Item>

          <Item dataField="status" editorType="dxSelectBox" editorOptions={statusEditorOptions}>
            <Label text="Trạng thái tài khoản" />
          </Item>

          <Item dataField="country" editorType="dxTextBox" editorOptions={countryEditorOptions}>
            <Label text="Quốc gia" />
          </Item>

          <Item dataField="city" editorType="dxTextBox" editorOptions={cityEditorOptions}>
            <Label text="Thành phố" />
          </Item>

          <Item dataField="password" editorType="dxTextBox" editorOptions={passwordEditorOptions}>
            <RequiredRule message="Yêu cầu nhập mật khẩu" />
            <Label text="Mật khẩu" />
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
const firstNameEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập tên"
};

const lastNameEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập họ"
};

const usernameEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập tên đăng nhập"
};

const emailEditorOptions = {
  stylingMode: "filled",
  mode: "email",
  placeholder: "Nhập địa chỉ email"
};

const phoneEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập số điện thoại",
  mask: "+84 000 000 000"
};

const addressEditorOptions = {
  stylingMode: "filled",
  placeholder: "Nhập địa chỉ"
};

const countryEditorOptions = {
  stylingMode: "filled",
  placeholder: "Việt Nam"
};

const cityEditorOptions = {
  stylingMode: "filled",
  placeholder: "Thành phố Hồ Chí Minh"
};

const passwordEditorOptions = {
  stylingMode: "filled",
  mode: "password",
  placeholder: "Nhập mật khẩu (tối thiểu 6 ký tự, gồm chữ và số)"
};

const genderEditorOptions = {
  stylingMode: "filled",
  dataSource: [
    { value: "Male", text: "Nam" },
    { value: "Female", text: "Nữ" },
    { value: "Other", text: "Khác" }
  ],
  valueExpr: "value",
  displayExpr: "text",
  placeholder: "Chọn giới tính"
};

const roleEditorOptions = {
  stylingMode: "filled",
  dataSource: [
    { value: "User", text: "Người dùng" },
    { value: "Admin", text: "Quản trị viên" },
    { value: "Manager", text: "Quản lý" }
  ],
  valueExpr: "value",
  displayExpr: "text",
  value: "User"
};

const statusEditorOptions = {
  stylingMode: "filled",
  dataSource: [
    { value: "Salaried", text: "Lương cố định" },
    { value: "Commission", text: "Hoa hồng" },
    { value: "Terminated", text: "Đã nghỉ việc" }
  ],
  valueExpr: "value",
  displayExpr: "text",
  value: "Salaried"
};

