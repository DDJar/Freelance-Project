import React from 'react';
import { Button } from 'devextreme-react';
import './NewsDetailActions.scss';

const NewsDetailActions: React.FC = () => {
    return (
        <div className="news-detail-actions">
            <Button
                icon="like"
                text="Thích"
                stylingMode="text"
            />
            <Button
                icon="comment"
                text="Bình luận"
                stylingMode="text"
            />
            <Button
                icon="share"
                text="Chia sẻ"
                stylingMode="text"
            />
        </div>
    );
};

export default NewsDetailActions;