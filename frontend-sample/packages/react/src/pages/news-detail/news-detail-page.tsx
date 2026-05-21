import React, { useCallback, useEffect, useState } from 'react';
import './news-detail-page.scss';
import { useParams } from 'react-router-dom';
import { Blog } from '../../types/blog';
import { blogApi } from '../../api/blog';
import { NewsDetailActions, NewsDetailContent, NewsDetailHeader, NewsDetailSidebar } from '../../components/library/news-detail';

const NewsDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [news, setNews] = useState<Blog | null>(null);
    const [relatedNews, setRelatedNews] = useState<Blog[]>([]);
    const [latestNews, setLatestNews] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNewsDetail = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        const res = await blogApi.getById(id);
        if (res.isOk && res.data) {
            setNews(res.data);
        } else {
            console.error(res.message);
        }
        setLoading(false);
    }, [id]);
    useEffect(() => {
        loadNewsDetail();
    }, [loadNewsDetail]);
    const loadRelatedNews = useCallback(async () => {
        if (!id) return;

        try {
            const res = await blogApi.getAll();
            if (res.isOk && res.data) {
                const current = res.data.find((item) => item.id === id);
                if (!current) return;
                const filtered = res.data.filter(
                    (item) =>
                        item.id !== id &&
                        item.author?.trim().toLowerCase() === current.author?.trim().toLowerCase()
                );
                setRelatedNews(filtered);
            } else {
                console.error(res.message);
            }
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        loadRelatedNews();
    }, [loadRelatedNews]);
    const loadLatestNews = useCallback(async () => {
        try {
            const res = await blogApi.getAll();
            if (res.isOk && res.data) {
                const sorted = res.data.filter(item => item.id !== id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setLatestNews(sorted.slice(0, 5));
            }

            else console.error(res.message);
        } catch (err) {
            console.error(err);
        }
    }, []);
    useEffect(() => {
        loadLatestNews();
    }, [loadLatestNews]);
    if (loading || !news) return <div>Đang tải...</div>;

    return (
        <div className="news-detail-page">
            <h1>Tin tức về {news.title}</h1>
            <NewsDetailHeader
                date={new Date(news.createdAt).toLocaleDateString('vi-VN')}
                updateDate={new Date(news.updatedAt).toLocaleDateString('vi-VN')}
                author={news.author}
            />

            <div className="news-content-container">
                <div className="news-main-content">
                    <NewsDetailContent
                        news={news}
                    />
                    {/* <NewsDetailActions /> */}
                </div>

                <NewsDetailSidebar
                    latestNews={latestNews.slice(0, 3)}
                    relatedNews={relatedNews.slice(0, 2)}
                />
            </div>
        </div>
    );
};

export default NewsDetailPage;
