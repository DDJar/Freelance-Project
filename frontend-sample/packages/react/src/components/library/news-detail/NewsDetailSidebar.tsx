import React from 'react';
import { List } from 'devextreme-react';
import { useNavigate } from 'react-router-dom';
import './NewsDetailSidebar.scss';
import { Blog } from '../../../types/blog';

interface NewsDetailSidebarProps {
    latestNews: Blog[];
    relatedNews: Blog[];
}

const NewsDetailSidebar: React.FC<NewsDetailSidebarProps> = ({
    latestNews,
    relatedNews
}) => {
    const navigate = useNavigate();
    const handleItemClick = (itemId) => {
        navigate(`/news/${itemId}`);
    };

    return (
        <div className="news-detail-sidebar">
            <div className="section">
                <h3>Tin mới nhất</h3>
                <List
                    dataSource={latestNews}
                    displayExpr="title"
                    noDataText="Không có tin tức mới"
                    searchEnabled={false}
                    onItemClick={(e) => handleItemClick(e.itemData?.id)}
                />
            </div>

            <div className="section">
                <h3>Tin liên quan</h3>
                <List
                    dataSource={relatedNews}
                    displayExpr="title"
                    noDataText="Không có tin liên quan"
                    searchEnabled={false}
                    onItemClick={(e) => handleItemClick(e.itemData?.id)}
                />
            </div>
        </div>
    );
};



export default NewsDetailSidebar;
