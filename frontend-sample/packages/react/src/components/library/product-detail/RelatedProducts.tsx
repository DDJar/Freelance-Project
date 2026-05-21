import React, { useMemo } from 'react';
import { Product } from '../../../types/product';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyVND } from '../../../utils/format-currency';

interface Props {
    category: string;
    currentProductId: string;
    products: Product[];
}

const RelatedProducts: React.FC<Props> = ({ category, currentProductId, products }) => {
    const navigate = useNavigate();

    const related = useMemo(() => {
        return products
            .filter(
                (item) =>
                    item.category === category && item.id !== currentProductId
            )
            .slice(0, 4);
    }, [category, currentProductId, products]);

    return (
        <div className="related-products">
            <h3>SẢN PHẨM LIÊN QUAN</h3>
            <div className="related-grid">
                {related.map((item) => (
                    <div
                        key={item.id}
                        className="related-product-item"
                        onClick={() => navigate(`/product/${item.id}`)}
                    >
                        <img
                            src={
                                item.imageUrl?.startsWith('data:image')
                                    ? item.imageUrl
                                    : 'https://i.pinimg.com/1200x/3c/7b/46/3c7b46b0388f6c4b4cbf431e71916884.jpg'
                            }
                            alt={item.name}
                        />
                        <div className="related-name">{item.name}</div>
                        <div className="related-price">{formatCurrencyVND(item.price)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RelatedProducts;
