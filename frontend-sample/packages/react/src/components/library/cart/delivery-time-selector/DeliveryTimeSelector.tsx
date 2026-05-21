import React from 'react';
import { DateBox, SelectBox, CheckBox } from 'devextreme-react';
import './DeliveryTimeSelector.scss';

export const DeliveryTimeSelector = () => {
    const today = new Date();

    return (
        <div className="delivery-time-selector">
            <h3>Thời gian giao hàng</h3>
            <DateBox
                placeholder="Chọn ngày"
                min={today}
                showClearButton={true}
            />
            <SelectBox
                items={['0800-12h00', '14h00-18h00', '19h00-21h00']}
                placeholder="Chọn thời gian"
                showClearButton={true}
            />
            <CheckBox text="Xuất hóa đơn công ty" />
        </div>
    );
};
