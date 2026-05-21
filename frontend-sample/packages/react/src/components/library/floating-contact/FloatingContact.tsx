import React, { useState } from 'react';
import { Popup } from 'devextreme-react/popup';
import './FloatingContact.scss';

const FloatingContact = () => {
    const [visible, setVisible] = useState(false);

    return (
        <div className="floating-contact-container">
            <button className="contact-button" onClick={() => setVisible(true)}>
                <img src="/assets/icon-Phone.png" alt="Liên hệ" />
            </button>

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
                    at: 'right bottom',
                    my: 'right bottom',
                    offset: '-20 -80'
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
    );
};

export default FloatingContact;
