import React from 'react';
import { Product } from '../../../types/product';
import './ProductCard.scss';
import { Button } from 'devextreme-react';
import { formatCurrencyVND } from '../../../utils/format-currency';
import { useNavigate } from 'react-router-dom';
interface ProductCardProps {
    product: Product;
    addToCart: (product: Product) => void;
    buyNow: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, addToCart, buyNow }) => {
    const navigate = useNavigate();
    const handleViewDetail = () => {
        window.location.href = `/product/${product.id}`;
    };

    const isOutOfStock = product.quantity === 0;

    return (
        <div className="product-card">
            <div className="product-image" onClick={handleViewDetail}>
                <img
                    src={product.imageUrl?.startsWith('data:image') ? product.imageUrl : 'https://i.pinimg.com/1200x/3c/7b/46/3c7b46b0388f6c4b4cbf431e71916884.jpg'}
                    alt={product.name}
                />
            </div>
            <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-price">
                    {product.price ? (
                        <div className="price-container">
                            <span className="formatted-price">{formatCurrencyVND(product.price)}</span>
                            {isOutOfStock ? (
                                <div className="out-of-stock-label">Hết hàng</div>
                            ) : (
                                <div className="action-buttons">
                                    <Button
                                        text="Mua ngay"
                                        stylingMode="contained"
                                        type="success"
                                        className='buy-now-button'
                                        onClick={() => buyNow(product)}
                                    />
                                    <Button
                                        icon="cart"
                                        stylingMode="contained"
                                        type="default"
                                        className='add-to-cart-button'
                                        onClick={() => addToCart(product)}
                                        hint="Thêm vào giỏ hàng"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="contact-container">
                            <span className="contact-label">Liên hệ:</span>
                            <span className="contact-label-phone"> 1900.272737-028.7777.2737</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
