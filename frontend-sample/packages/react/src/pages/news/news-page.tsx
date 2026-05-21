import React, { useCallback, useEffect, useState } from 'react';
import './news-page.scss';
import { NewsCard } from '../../components/library/news/news-cart/NewsCard';
import { blogApi } from '../../api/blog';
import { Blog } from '../../types/blog';

export const NewsPage: React.FC = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const loadBlogs = useCallback(async () => {
        try {
            const res = await blogApi.getPublished();
            if (res.isOk && res.data) setBlogs(res.data);
            else console.error(res.message);
        } catch (err) {
            console.error(err);
        }
    }, []);
    useEffect(() => {
        loadBlogs();
    }, [loadBlogs]);

    return (
        <div className="news-page">
            <div className="news-header">
                <p className="news-subtitle">TIN TỨC & CẬP NHẬT</p>
                <h2 className="news-title">Bài viết mới nhất</h2>
            </div>

            <div className="news-list">
                {[...blogs]
                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                    .slice(0, 3)
                    .map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
            </div>
        </div>
    );
};
