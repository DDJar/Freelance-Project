import React from 'react';
import './NewsCard.scss';
import { Blog } from '../../../../types/blog';
import { useNavigate } from 'react-router-dom';

interface Props {
    item: Blog;
}

export const NewsCard: React.FC<Props> = ({ item }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/news/${item.id}`);
    };
    return (
        <div className="news-card" onClick={handleClick}>
            <div className="news-image">
                <img src={
                    item?.imageId
                        ? `${process.env.REACT_APP_BACKEND_URL}/blog/${item.id}/image`
                        : 'https://i.pinimg.com/736x/77/f3/a8/77f3a883b47a948da8e18b282fbcf7d5.jpg'
                } alt={item.title} />

            </div>
            <div className="news-content">
                <p className="news-meta">{new Date(item.createdAt).toLocaleDateString('vi-VN')} - {item.author}
                </p>
                <h3 className="news-title">{item.title}</h3>
                <p className="news-desc">{item.content}</p>
            </div>
        </div>
    );
};
