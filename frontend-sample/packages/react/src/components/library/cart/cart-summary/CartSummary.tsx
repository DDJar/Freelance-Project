import React from 'react';
import { Button } from 'devextreme-react';
import './CartSummary.scss';
import { formatCurrencyVND } from '../../../../utils/format-currency';

export const CartSummary = ({ total, onCheckout }) => {

    return (
        <div className="cart-summary">
            <div className="total-row">
                <span>Tổng tiền:</span>
                <strong>{formatCurrencyVND(total)}</strong>
            </div>
            <Button text="Thanh toán" type="default" width="100%" onClick={onCheckout}
            />
        </div>
    );
};
