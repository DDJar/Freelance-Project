import React, { useEffect, useState, useRef } from 'react';

import { withLoadPanel } from '../../../utils/withLoadPanel';
import { DeliveryFormDetails } from './DeliveryFormDetails';
import { ToolbarForm } from '../../utils/toolbar-form/ToolbarForm';

import { Delivery } from '../../../types/delivery';
import { ButtonTypes } from 'devextreme-react/button';

import './DeliveryForm.scss';

const DeliveryFormWithLoadPanel = withLoadPanel(DeliveryFormDetails);

export const DeliveryForm = ({
  delivery,
  isLoading,
}: {
  delivery?: Delivery;
  isLoading: boolean;
}) => {
  const [data, setData] = useState<Delivery | undefined>(delivery);
  const [editing, setEditing] = useState(false);
  const dataRef = useRef<Delivery | undefined>();

  useEffect(() => {
    if (delivery) {
      setData(delivery);
    }
  }, [delivery]);

  const handleEditClick = () => {
    if (!editing && data) {
      dataRef.current = data;
    } else {
      dataRef.current = undefined;
    }
    setEditing(!editing);
  };

  const onSaveClick = ({ validationGroup }: ButtonTypes.ClickEvent) => {
    if (!validationGroup.validate().isValid) return;

    handleEditClick(); // Thoát chế độ edit
  };

  const onCancelClick = () => {
    setData(dataRef.current);
    handleEditClick();
  };

  return (
    <div className="delivery-form">
      <ToolbarForm
        toggleEditing={handleEditClick}
        onCancelClick={onCancelClick}
        onSaveClick={onSaveClick}
        editing={editing}
      />
      <DeliveryFormWithLoadPanel
        loading={isLoading}
        hasData={!!data}
        data={data}
        editing={editing} // ✅ Truyền đúng state editing
        onDataChanged={setData}
        panelProps={{
          container: '.delivery-form',
          position: { of: '.delivery-form' },
        }}
      />
    </div>
  );
};
