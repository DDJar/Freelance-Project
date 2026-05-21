import React from 'react';
import { Button } from 'devextreme-react/button';
import { Product } from '../../../types/product';
import { formatCurrencyVND } from '../../../utils/format-currency';

interface Props {
    product: Product;
    addToCart: (product: Product) => void;
    buyNow: (product: Product) => void;
    quantity: number;
    setQuantity: (qty: number) => void;
}

const ProductInfo: React.FC<Props> = ({
    product,
    addToCart,
    buyNow,
    quantity,
    setQuantity,
}) => {
    const handleIncrease = () => setQuantity(quantity + 1);
    const handleDecrease = () => {
        if (quantity > 1) setQuantity(quantity - 1);
    };

    return (
        <div className="product-info">
            <h2 className="product-name">{product.name.toUpperCase()}</h2>
            <h3 className="product-category"><strong>Loại: </strong> {product.category}</h3>
            <p className="price">{formatCurrencyVND(product.price)}</p>
            <p className="description">
                <strong>Chi tiết:</strong>
            </p>
            <p className="description-text">
                {product.description}
            </p>

            <div className="quantity-selector">
                <Button icon="minus" stylingMode="outlined" onClick={handleDecrease} />
                <span style={{ margin: '0 10px' }}>{quantity}</span>
                <Button icon="plus" stylingMode="outlined" onClick={handleIncrease} />
            </div>

            <div className="divider" />

            <div className="actions-button">
                <Button
                    text="Mua ngay"
                    type="success"
                    stylingMode="contained"
                    className="buy-now-button"
                    onClick={() => buyNow(product)}
                />
                <Button
                    icon="cart"
                    hint="Thêm vào giỏ hàng"
                    stylingMode="contained"
                    className="add-to-cart-button"
                    onClick={() => addToCart(product)}
                />
            </div>
        </div>
    );
};

export default ProductInfo;
