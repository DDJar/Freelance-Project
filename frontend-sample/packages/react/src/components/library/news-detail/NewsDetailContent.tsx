import React from 'react';
import './NewsDetailContent.scss';
import { Blog } from '../../../types/blog';

interface Props {
    news: Blog
}

const NewsDetailContent: React.FC<Props> = ({
    news
}) => {
    const formatContent = (text: string) => {
        return text.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
        ));
    };
    return (
        <div className="news-detail-content">
            <h1 className="title">{news.title}</h1>


            <div className="image-section"><img src={
                news?.imageId
                    ? `${process.env.REACT_APP_BACKEND_URL}/blog/${news.id}/image`
                    : 'https://i.pinimg.com/736x/77/f3/a8/77f3a883b47a948da8e18b282fbcf7d5.jpg'
            } alt={news.title} className="featured-image" />
            </div>

            <div className="content"  > {formatContent(news.content)}</div>

            <div className="status">
                Trạng thái: <span>{news.status}</span>
            </div>
        </div>
    );
};

export default NewsDetailContent;
