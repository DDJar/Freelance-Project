import React from 'react';
import { Button } from 'devextreme-react';
import { useNavigate } from 'react-router-dom';
import './NewsDetailHeader.scss';

interface NewsDetailHeaderProps {
    date: string;
    updateDate: string;
    author: string;
}

const NewsDetailHeader: React.FC<NewsDetailHeaderProps> = ({ date, updateDate, author }) => {
    const navigate = useNavigate();
    return (
        <div className="news-detail-header">
            <div className="meta-info">
                <span className="date">Ngày đăng: {date} (Cập nhật : {updateDate})</span>
                <span className="author">Tác giả: {author}</span>
            </div>

            <Button
                icon="back"
                text="Quay lại danh sách tin tức"
                onClick={() => navigate('/')}
                stylingMode="text"
            />
        </div>
    );
};

export default NewsDetailHeader;