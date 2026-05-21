import React, { ReactNode } from 'react';
import { CardMenu } from '../card-menu/CardMenu';
import './CardAnalytics.scss';

type CardProps = {
  title?: string;
  additionalHeaderContent?: ReactNode;
  contentClass: string;
  isLoading?: boolean;
  menuVisible?: boolean;
};

export const CardAnalytics = ({
  title,
  contentClass,
  isLoading = false,
  children,
  additionalHeaderContent,
  menuVisible = true,
}: React.PropsWithChildren<CardProps>) => (
  <div className={`card ${contentClass}`} style={{ width: '100%' }}>
    <div className='header'>
      <CardMenu visible={false} />
      {title && <div className='title'>{title}</div>}
      {additionalHeaderContent}
    </div>
    {!isLoading && <div className='card-contents'>{children}</div>}
  </div>
);
