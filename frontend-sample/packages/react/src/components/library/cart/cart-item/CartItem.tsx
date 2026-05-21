import React, { useEffect, useState } from 'react';
import { Button, NumberBox } from 'devextreme-react';
import './CartItem.scss';
import { formatCurrencyVND } from '../../../../utils/format-currency';

interface CartItemProps {
    item: any;
    onQuantityChange: (cartId: string, quantity: number) => void;
    onRemove: (productId: string) => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove }) => {
    const [quantity, setQuantity] = useState(item.quantity);
    useEffect(() => {
        setQuantity(item.quantity);
    }, [item.quantity]);

    const handleQuantityChange = (value: number) => {
        setQuantity(value);
        onQuantityChange(item.id, value);
    };

    return (
        <div className="cart-item">
            <div className="product-info">
                <img
                    src={item.imageUrl?.startsWith('data:image') ? item.imageUrl : 'https://i.pinimg.com/1200x/3c/7b/46/3c7b46b0388f6c4b4cbf431e71916884.jpg'}
                    alt={item.name}
                />
                <div className="name-delete">
                    <div>{item.name}</div>
                    <Button text="Xoá" stylingMode="text" type="danger" onClick={() => onRemove(item.id)} />
                </div>
            </div>
            <div className="unit-price">{formatCurrencyVND(item.price)}</div>
            <div className="quantity">
                <NumberBox
                    value={quantity}
                    min={0}
                    showSpinButtons
                    onValueChanged={(e) => {
                        if (typeof e.value === 'number' && e.value > 0 && e.value !== quantity) {
                            handleQuantityChange(e.value);
                        }
                    }}
                />
            </div>
            <div className="total-price">{formatCurrencyVND(item.total)}</div>
        </div>
    );
};
