import React from "react";
import "./FeatureCards.scss";
import { IconAward, IconBuilding, IconClock, IconShield } from "./Icons";

const cards = [
  {
    title: "Chất lượng",
    desc: "Đảm bảo cam kết về chất lượng trong mọi dự án",
    icon: <IconBuilding />,
  },
  {
    title: "Tiến độ",
    desc: "Luôn đúng tiến độ, nỗ lực vì hiệu quả",
    icon: <IconClock />,
  },
  {
    title: "An toàn",
    desc: "Tuân thủ quy chuẩn đảm bảo an toàn lao động",
    icon: <IconShield />,
  },
  {
    title: "Bảo hành",
    desc: "Dịch vụ bảo hành uy tín, nhanh chóng",
    icon: <IconAward />,
  },
];

const FeatureCards = () => {
  return (
    <section className="feature-cards">
      <div className="feature-cards-container">
        <div className="cards-grid">
          {cards.map((c, idx) => (
            <div key={idx} className="card">
              <div className="icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
