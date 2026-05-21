import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import Button from 'devextreme-react/button';
import { formatDate } from 'devextreme/localization';

import { Delivery } from '../../../types/delivery';
import './DeliveryKanbanCard.scss';

const onClick = (delivery: Delivery) => (e) => {
  e.event.stopPropagation();
  notify(`Edit delivery for bill '${delivery.billId}'`);
};

export const DeliveryKanbanCard = ({ delivery }: { delivery: Delivery }) => {
  const navigate = useNavigate();

  const navigateToDetails = useCallback(() => {
    navigate(`/delivery-details/${delivery.id}`);
  }, [delivery.id, navigate]);

  return (
    <div
      className="kanban-card dx-card theme-text-color theme-bg-color"
      onClick={navigateToDetails}
    >
      <div className={`card-wrapper status-${delivery.status?.toLowerCase()}`}>
        <div className="card-priority" />
        <Button
          className="edit-button"
          icon="edit"
          stylingMode="text"
          onClick={onClick(delivery)}
        />
        <div className="card-content">
          <div className="card-subject theme-text-color">
            Giao hóa đơn #{delivery.billId}
          </div>
          <div className="card-data">
            <span className="status">{delivery.status}</span>
            <span className="date theme-text-color">
              {formatDate(new Date(delivery.deliveryDate), 'MM/dd/yyyy')}
            </span>
          </div>
          <div className="card-assignee">
            <span className="recipient theme-text-color">
              Người nhận: {delivery.recipient}
            </span>
            <span className="delivered-by theme-text-color">
              Giao bởi: {delivery.deliveredBy}
            </span>
          </div>
          {delivery.notes && (
            <div className="card-notes theme-text-color">
              Ghi chú: {delivery.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
