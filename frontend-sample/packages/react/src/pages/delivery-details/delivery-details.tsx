import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Toolbar, Item as ToolbarItem } from "devextreme-react/toolbar";
import DropDownButton, { Item as DropDownItem } from "devextreme-react/drop-down-button";
import ValidationGroup from "devextreme-react/validation-group";
import ScrollView from "devextreme-react/scroll-view";
import Button from "devextreme-react/button";
import { Delivery } from "../../types/delivery";
import { deliveryApi } from "../../api/delivery";

import "./delivery-details.scss";
import { DeliveryFormDetails } from "../../components/library/delivery-form/DeliveryFormDetails";

export const DeliveryDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [delivery, setDelivery] = useState<Delivery>();
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(() => {
    if (!id) return;

    setIsLoading(true);

    deliveryApi
      .getById(id)
      .then((res) => {
        if (res.isOk && res.data) {
          setDelivery(res.data);
        } else {
          console.error("Failed to load delivery:", res.message);
        }
      })
      .catch((error) => console.error("Error loading delivery:", error))
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView className="view-wrapper-scroll" key={id}>
      <div className="view-wrapper view-wrapper-details">
        <Toolbar className="toolbar-details theme-dependent">
          <ToolbarItem location="before">
            <Button icon="arrowleft" stylingMode="text" onClick={() => navigate(-1)} />
          </ToolbarItem>

          <ToolbarItem location="before" text={delivery?.recipient ?? "Đang tải..."} />

          <ToolbarItem location="after" locateInMenu="auto">
            <Button text="Làm mới" icon="refresh" stylingMode="text" onClick={refresh} />
          </ToolbarItem>
        </Toolbar>

        <div className="panels">
          <div className="left">
            <ValidationGroup>
              {delivery && (
                <DeliveryFormDetails
                  data={delivery}
                  editing
                  onDataChanged={setDelivery}
                />
              )}

            </ValidationGroup>
          </div>

          <div className="right">
            <h2>Ghi chú giao hàng</h2>
            <div className="dx-card details-card">
              <div className="delivery-detail">
                {delivery?.notes ? (
                  <div dangerouslySetInnerHTML={{ __html: delivery.notes }} />
                ) : (
                  <p>Không có ghi chú.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollView>
  );
};
