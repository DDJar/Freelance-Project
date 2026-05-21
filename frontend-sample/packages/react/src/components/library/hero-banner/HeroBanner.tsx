import React, { useState } from 'react';
import './HeroBanner.scss';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react';

const HeroBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  return (
    <section className='heroBanner'>
      <div className='hero-logo-blur' />
      <div className='hero-content'>
        <h1>
          GIẢI PHÁP <br />
          XÂY DỰNG HÀNG ĐẦU
        </h1>
        <p>VỮNG CHẮC VÀ PHÁT TRIỂN BỀN VỮNG</p>
        <div className="hero-buttons">
          <Button text="LIÊN HỆ NGAY" className="hero-button primary" onClick={() => setVisible(true)} />
          <Popup
            visible={visible}
            onHiding={() => setVisible(false)}
            dragEnabled={false}
            closeOnOutsideClick
            title='Liên hệ hỗ trợ'
            showCloseButton
            width={300}
            height="auto"
            shading={true}
            position={{
              at: 'center',
              my: 'center',
              offset: '-5 -80'
            }}
            contentRender={() => (
              <div className="contact-popup-content">
                <div className="info">
                  <p><strong>Email:</strong> truonggiathinhcoop@gmail.com</p>
                  <p><strong>Điện thoại:</strong> 0925067999-0982970777</p>
                </div>
              </div>
            )}
          />
        </div>
      </div>

    </section>
  );
};

export default HeroBanner;
