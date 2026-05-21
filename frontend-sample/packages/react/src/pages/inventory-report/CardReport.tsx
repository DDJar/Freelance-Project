import React from "react";
import "./CardReport.scss";
export interface CardProps {
  title: string;
  value: number | string;
}

export const CardReport: React.FC<CardProps> = ({ title, value }) => {
  return (
    <div className="card-report">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
    </div>
  );
};
