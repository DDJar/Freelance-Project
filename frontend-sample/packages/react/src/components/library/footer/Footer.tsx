import React from 'react';
import './Footer.scss';

const Footer: React.FC = () => {
  return (
    <footer className="footer-home">
      <div className="footer-container">
        <div className="footer-left">
          <h2>TRƯƠNG GIA THỊNH lắng nghe bạn!</h2>
          <p>
            Chúng tôi luôn trân trọng và mong đợi nhận được mọi ý kiến đóng góp từ khách hàng
            để có thể nâng cấp trải nghiệm dịch vụ và sản phẩm tốt hơn nữa.
          </p>
          <button
            className="feedback-button"
            onClick={() => window.open("https://forms.gle/fCLJur2JSSoBHu8Q9", "_blank")}
          >
            ĐÓNG GÓP Ý KIẾN →
          </button>

          <div className="social-icons">
            <img src="/assets/facebook.png" alt="Facebook" />
            <img src="/assets/zalo.png" alt="Zalo" />
          </div>
        </div>

        <div className="footer-right">
          <div className="contact-item">
            <img src="/assets/phone-icon.png" alt="Phone" />
            <div>
              <span>Hotline</span>
              <strong>0925067999-0982970777</strong>
            </div>
          </div>
          <div className="contact-item">
            <img src="/assets/email-icon.png" alt="Email" />
            <div>
              <span>Email</span>
              <strong>truonggiathinhcoop@gmail.com</strong>
            </div>
          </div>
          <div className="contact-item">
            <img src="/assets/location-icon.png" alt="Address" />
            <div>
              <span>Địa chỉ</span>
              <strong>137 Nguyễn Sơn, Phường Hòa Cường, Thành phố Đà Nẵng, Việt Nam</strong>
            </div>
          </div>
          <img
            src="/assets/logo.png"
            alt="Company Logo"
            className="footer-logo"
          />
        </div>

      </div>
      <div className="copyright">
        License © {new Date().getFullYear()} <br /> Trương Gia Thịnh Inc.
      </div>
    </footer>
  );
};

export default Footer;
