import React from 'react';
import { TabPanel, Item } from 'devextreme-react/tab-panel';
import './Services.scss';

export const Services: React.FC = () => {
  const services = [
    {
      title: "Phân phối thiết bị AISIN",
      description: "Cung cấp thiết bị và linh kiện chính hãng từ tập đoàn AISIN Nhật Bản."
    },
    {
      title: "Tư vấn & tích hợp hệ thống",
      description: "Giải pháp tích hợp thiết bị công nghiệp, dây chuyền sản xuất tự động."
    },
    {
      title: "Dịch vụ bảo trì – bảo dưỡng",
      description: "Dịch vụ chuyên nghiệp đảm bảo vận hành liên tục, đúng tiêu chuẩn."
    },
    {
      title: "Hỗ trợ kỹ thuật & đào tạo",
      description: "Cung cấp dịch vụ đào tạo kỹ sư và hỗ trợ kỹ thuật trực tiếp tại nhà máy."
    }
  ];


  return (
    <section className="services-section">
      <div className="dx-container">
        <h2 className="section-title">DỊCH VỤ CỦA CHÚNG TÔI</h2>
        <h3 className="section-subtitle">Dịch vụ tốt nhất cho bạn</h3>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="card-header">
                <h4>{service.title}</h4>
                <div className="divider" />
              </div>
              <p className="card-content">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};