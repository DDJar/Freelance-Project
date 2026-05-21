import React, { useEffect, useState } from 'react';
import './cart-page.scss';
import { CartItem } from '../../components/library/cart/cart-item/CartItem';
import { CartSummary } from '../../components/library/cart/cart-summary/CartSummary';
import { DeliveryTimeSelector } from '../../components/library/cart/delivery-time-selector/DeliveryTimeSelector';
import { billItemsApi } from '../../api/billItems';
import notify from 'devextreme/ui/notify';
import { getWithExpiry, setWithExpiry } from '../../utils/loading-items';

export const CartPage = () => {
    const [cartItems, setCartItems] = useState<any[]>([]);

    useEffect(() => {
        const stored = getWithExpiry('cartItems') || [];

        setCartItems(stored);
    }, []);

    const updateQuantity = async (cartId: string, quantity: number) => {
        const itemToUpdate = cartItems.find(item => item.id === cartId);
        if (!itemToUpdate) return;

        try {
            const res = await billItemsApi.update(itemToUpdate.id, {
                id: itemToUpdate.id,
                productId: itemToUpdate.productId,
                quantity: quantity,
                price: itemToUpdate.price,
                total: itemToUpdate.price * quantity
            });
            const updatedCart = cartItems.map(item =>
                item.id === cartId ? { ...item, ...res.data } : item
            );

            setCartItems(updatedCart);
            setWithExpiry('cartItems', updatedCart);
        } catch (error) {
            notify(
                {
                    message: 'Đã xảy ra lỗi khi cập nhật sản phẩm trong giỏ hàng',
                    position: {
                        at: 'bottom center',
                        my: 'bottom center'
                    }
                },
                'error'
            );
        }
    };

    const removeItem = async (billItem: string) => {
        const updated = cartItems.filter(item => item.id !== billItem);
        try {
            const res = await billItemsApi.delete(billItem);
            if (res.isOk) {
                setCartItems(updated);
                setWithExpiry('cartItems', updated);
                window.location.reload();
            }
        } catch (error) {
            notify(
                {
                    message: 'Đã xảy ra lỗi khi xóa sản phẩm trong giỏ hàng',
                    position: {
                        at: 'bottom center',
                        my: 'bottom center'
                    }
                },
                'error'
            );
        }

    };

    const total = cartItems.reduce((sum, item) => sum + (item.total ?? 0), 0);

    const handleCheckout = () => {
        const billOrder = {
            items: cartItems,
            total: total,
            createdAt: new Date().toISOString()
        };
        setWithExpiry('billOrder', billOrder);
        window.location.href = '/bill';
    };

    return (
        <div className="cart-page">
            <h2>Giỏ hàng của bạn</h2>
            <div className="cart-container">
                <div className="cart-items">
                    <div className="cart-header">
                        <span className="col-product">Thông tin sản phẩm</span>
                        <span className="col-price">Đơn giá</span>
                        <span className="col-quantity">Số lượng</span>
                        <span className="col-total">Thành tiền</span>
                    </div>

                    {cartItems.length > 0 ? (
                        <>
                            {cartItems.map(item => (
                                <CartItem
                                    key={item.id}
                                    item={item}
                                    onQuantityChange={updateQuantity}
                                    onRemove={removeItem}
                                />
                            ))}
                            <CartSummary total={total} onCheckout={handleCheckout} />
                        </>
                    ) : (
                        <div className="empty-cart">
                            <p>Giỏ hàng của bạn trống</p>
                        </div>
                    )}
                </div>
                {/* <DeliveryTimeSelector /> */}
            </div>
        </div>
    );
};
