import React from 'react';
import Tabs from 'devextreme-react/tabs';

interface Props {
    description: string;
}

const ProductTabs: React.FC<Props> = ({ description }) => {
    const tabs = ['MÔ TẢ', 'THÔNG SỐ KỸ THUẬT', 'ĐÁNH GIÁ & BÌNH LUẬN'];

    return (
        <div className="product-tabs">
            <Tabs items={tabs} />
            <div className="tab-content">
                <p>{description}</p>
            </div>
        </div>
    );
};

export default ProductTabs;