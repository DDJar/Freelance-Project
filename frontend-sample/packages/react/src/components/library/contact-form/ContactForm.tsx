import React, { useState, useRef, useEffect } from "react";
import { ToolbarForm } from "../../utils/toolbar-form/ToolbarForm";
import { ContactFromDetails } from "./ContactFormDetails";
import { withLoadPanel } from "../../../utils/withLoadPanel";
import { Contact } from "../../../types/crm-contact";
import ValidationGroup from "devextreme-react/validation-group";
import "./ContactForm.scss";
const ContactFromDetailsWithLoadPanel = withLoadPanel(ContactFromDetails);

export const ContactForm = ({
  data,
  isLoading = false,
}: {
  data?: Contact;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const editing = false;
  const updateField = () => () => {};

  return (
    <div className="contact-form">
      <h2 style={{ margin: "2px" }}>
        <span className="dx-form-group-caption">Details</span>
      </h2>
      <ValidationGroup>
        <ContactFromDetailsWithLoadPanel
          loading={isLoading}
          hasData={!!formData}
          data={formData}
          editing={editing}
          updateField={updateField}
          panelProps={{
            container: ".contact-form",
            position: { of: ".contact-form" },
          }}
        />
      </ValidationGroup>
    </div>
  );
};
