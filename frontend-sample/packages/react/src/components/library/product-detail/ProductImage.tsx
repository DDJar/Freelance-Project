import React from 'react';

interface Props {
    imageUrl: string;
    altText: string;
}

const ProductImage: React.FC<Props> = ({ imageUrl, altText }) => (
    <div className="product-image">
        <img src={imageUrl} alt={altText} />
    </div>
);

export default ProductImage;