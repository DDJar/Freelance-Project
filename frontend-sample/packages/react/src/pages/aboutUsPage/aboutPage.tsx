import React from 'react';
import './aboutPage.scss';

const AboutPage = () => {
    return (
        <section className="about-us-section">
            <div className="dx-container">
                <div className="about-us-content">
                    <div className="about-us-text">
                        <h2 className="section-title">VỀ CHÚNG TÔI</h2>
                        <h3 className="section-subtitle">
                            Trương Gia Thịnh – Tự hào là nhà phân phối chính thức của Aisin tại khu vực Đà Nẵng
                        </h3>
                        <div className="tagline-container">
                            <span className="tagline-item">Uy tín</span>
                            <span className="tagline-divider">–</span>
                            <span className="tagline-item">Chất lượng Nhật Bản</span>
                            <span className="tagline-divider">–</span>
                            <span className="tagline-item">Phân phối sỉ & lẻ</span>
                        </div>
                        <p className="description">
                            Trương Gia Thịnh vinh dự là đối tác phân phối sỉ và lẻ chính thức các sản phẩm phụ tùng ô tô chất lượng cao của thương hiệu <strong>Aisin</strong> tại khu vực <strong>Đà Nẵng</strong>. Với sự hợp tác chiến lược cùng Aisin – thương hiệu hàng đầu đến từ Nhật Bản, chúng tôi cam kết mang đến cho khách hàng những sản phẩm phụ tùng ô tô chính hãng, đáp ứng tiêu chuẩn khắt khe về độ bền, hiệu suất và an toàn. Sự kết hợp này không chỉ khẳng định chất lượng vượt trội mà còn là lời cam kết mang đến giá trị bền vững cho khách hàng tại miền Trung.
                        </p>
                        <p className="description">
                            Với vị trí địa lý thuận lợi tại Đà Nẵng – trung tâm kinh tế và giao thương của miền Trung, Trương Gia Thịnh tự hào cung cấp dịch vụ phân phối nhanh chóng, chuyên nghiệp và tận tâm. Chúng tôi không chỉ là nhà cung cấp, mà còn là người bạn đồng hành đáng tin cậy của các đại lý, garage và khách hàng cá nhân. Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ, tư vấn và đảm bảo rằng mỗi sản phẩm <strong>Aisin</strong> đến tay khách hàng đều đạt tiêu chuẩn cao nhất, góp phần nâng tầm trải nghiệm lái xe an toàn và bền bỉ.
                        </p>
                        <p className="description">
                            Tại Trương Gia Thịnh, chúng tôi tin chất lượng tạo nên sự khác biệt. Vì vậy, mỗi sản phẩm Aisin mà chúng tôi phân phối không chỉ là một phụ tùng ô tô, mà còn là lời hứa về sự an tâm và hài lòng cho khách hàng. Chúng tôi không ngừng cải tiến quy trình, mở rộng mạng lưới và nâng cao chất lượng dịch vụ để mang lại sự tiện lợi tối đa. Trương Gia Thịnh luôn nỗ lực để khách hàng cảm nhận được sự lạc quan, tin tưởng và hài lòng khi lựa chọn chúng tôi.
                        </p>
                        <a
                            href="https://aisin.com"
                            className="official-link"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Truy cập trang chủ chính thức của Aisin
                        </a>
                    </div>
                    <div className="about-us-images">
                        <div className="about-us-image">
                            <img
                                src="/assets/aisin-truonggiathinh.jpg"
                                alt="Trương Gia Thịnh hợp tác với Aisin tại Đà Nẵng"
                                loading="lazy"
                            />
                        </div>
                        <div className="about-us-image">
                            <img
                                src="/assets/aisin-truonggiathinh2.jpg"
                                alt="Trương Gia Thịnh hợp tác với Aisin tại Đà Nẵng"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AboutPage;