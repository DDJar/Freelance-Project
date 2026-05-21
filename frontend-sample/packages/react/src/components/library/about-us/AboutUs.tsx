import React from 'react';
import { Button } from 'devextreme-react/button';
import './AboutUs.scss';

const AboutUs: React.FC = () => {
    return (
        <section className="about-us-section">
            <div className="dx-container">
                <div className="about-us-content">

                    <div className="about-us-text">
                        <h2 className="section-title">VỀ CHÚNG TÔI</h2>
                        <h3 className="section-subtitle">Trương Gia Thịnh – Đối tác phân phối phụ tùng AISIN tại Đà Nẵng</h3>

                        <div className="tagline-container">
                            <span className="tagline-item">Chất lượng</span>
                            <span className="tagline-divider">–</span>
                            <span className="tagline-item">An toàn</span>
                            <span className="tagline-divider">–</span>
                            <span className="tagline-item">Hiệu quả</span>
                            <span className="tagline-divider">–</span>
                            <span className="tagline-item">Chuyên nghiệp</span>
                        </div>

                        <p className="description">
                            Trương Gia Thịnh là công ty chuyên cung cấp các sản phẩm và giải pháp kỹ thuật trong lĩnh vực công nghiệp phụ trợ, thiết bị ô tô, cơ khí và tự động hóa.
                            <br />
                            Với sứ mệnh mang đến các sản phẩm chất lượng cao và công nghệ tiên tiến từ Nhật Bản, Trương Gia Thịnh tự hào là đối tác chiến lược của <strong>AISIN – Tập đoàn công nghiệp hàng đầu thế giới.</strong>
                            <br />
                            Chúng tôi luôn đặt chữ "Tín" lên hàng đầu, không ngừng đổi mới để mang lại giá trị bền vững cho khách hàng và cộng đồng.
                        </p>
                        <Button
                            text="Truy cập  AISIN Nhật Bản"
                            type="default"
                            stylingMode="contained"
                            onClick={() => window.open('https://www.aisin.com/en/', '_blank', 'noopener,noreferrer')}
                            className="aisin-button"
                        />
                    </div>
                    <div className="about-us-image">
                        <img src="./assets/First-Banner-1400x630-1.jpg" alt="Về chúng tôi" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutUs;