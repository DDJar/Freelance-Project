import React from 'react';
import './ContactStatus.scss';

const STATUS_LABELS: Record<string, string> = {
  Salaried: 'Lương cố định',
  Commission: 'Hoa hồng',
  Terminated: 'Đã nghỉ việc',
};

export const ContactStatus = ({
  text,
  contentClass = '',
  showText = true,
}: {
  text: string,
  contentClass?: string,
  showText?: boolean
}) => {
  const displayText = STATUS_LABELS[text] || text;

  return (
    <div className={`status status-contact status-${text?.toLowerCase()} ${contentClass}`}>
      <span>{showText ? displayText : ''}</span>
    </div>
  );
};
