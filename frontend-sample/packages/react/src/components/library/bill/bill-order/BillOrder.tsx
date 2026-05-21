import React, { useEffect, useState } from 'react';
import './BillOrder.scss';
import { formatCurrencyVND } from '../../../../utils/format-currency';

export const BillOrder = ({ cartItems, total, handlePlaceOrder, onTotalChange }) => {
    const shippingFee = 40000;
    const grandTotal = total + shippingFee;
    useEffect(() => {
        if (onTotalChange) {
            onTotalChange(grandTotal);
        }
    }, [grandTotal, onTotalChange]);
    return (
        <div className="order-summary">
            <h3>Đơn hàng ({cartItems.length} sản phẩm)</h3>

            <div className="cart-preview">
                {cartItems.map((item) => (
                    <div className="preview-item" key={item.productId}>
                        <img
                            src={
                                item.imageUrl?.startsWith("data:image")
                                    ? item.imageUrl
                                    : "https://i.pinimg.com/1200x/3c/7b/46/3c7b46b0388f6c4b4cbf431e71916884.jpg"
                            }
                            alt={item.name}
                        />
                        <div className="info">
                            <span>{item.name}</span>
                            <span>
                                {item.quantity} x {item.price.toLocaleString()}đ
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="summary">
                <div className="row">
                    <span>Phí đơn hàng: </span>
                    <span>{formatCurrencyVND(total)}</span>
                </div>
                <div className="row">
                    <span>Phí vận chuyển: </span>
                    <span>{formatCurrencyVND(shippingFee)}</span>
                </div>
                <div className="total-row">
                    <span>Tổng cộng:</span>
                    <span>{formatCurrencyVND(grandTotal)}</span>
                </div>
            </div>

            <button className="place-order" onClick={handlePlaceOrder}>
                ĐẶT HÀNG
            </button>
        </div>
    );
};
