// Achievement.tsx
import React from 'react';
import './Achievement.scss';

const Achievement: React.FC = () => {
    return (
        <section className="achievement-section">
            <div className="achievement-container">

                <div className="achievement-content">
                    <h1>THÀNH TỰU!</h1>
                    <h2>Thành tựu của chúng tôi</h2>

                    <div className="achievement-stats">
                        <div className="stat-card">
                            <div className="stat-label">Đối tác chính thức của <strong>AISIN Nhật Bản</strong> tại Việt Nam.</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">Cung cấp thiết bị cho nhiều <strong>nhà máy lớn</strong> trong ngành ô tô và công nghiệp phụ trợ.</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">Đạt <strong>chứng nhận ISO 9001:2015</strong> về hệ thống quản lý chất lượng.</div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-label">Tham gia <strong>hội chợ công nghiệp quốc tế</strong> tại Nhật Bản, Thái Lan và Hàn Quốc.</div>
                        </div>
                    </div>
                </div>

                <div className="achievement-image">
                    <img
                        src="./assets/img_why_choose.png"
                        alt="Thành tựu ND Construction"
                        className="responsive-image"
                    />
                </div>
            </div>
        </section>
    );
};

export default Achievement;