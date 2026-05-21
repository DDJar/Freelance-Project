import React, { ReactNode } from 'react';
import Button from 'devextreme-react/button';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import './ToolbarAnalytics.scss';

type ToolbarAnalyticsProps = {
  title: string;
  additionalToolbarContent?: ReactNode;
  onRefresh?: () => void;
};

export const ToolbarAnalytics = ({
  title,
  additionalToolbarContent,
  onRefresh,
  children,
}: React.PropsWithChildren<ToolbarAnalyticsProps>) => {
  return (
    <div className='view-wrapper view-wrapper-dashboard'>
      <Toolbar className='theme-dependent'>
        <Item location='before'>
          <span className='toolbar-header'>{title}</span>
        </Item>
        {additionalToolbarContent}
        <Item
          location='after'
          locateInMenu='auto'
          widget='dxButton'
          showText='inMenu'
        >
          <Button
            text='Làm mới'
            icon='refresh'
            stylingMode='text'
            onClick={onRefresh}
          />
        </Item>
        <Item location='after' locateInMenu='auto'>
          <div className='separator' />
        </Item>
        <Item
          location='after'
          locateInMenu='auto'
          widget='dxButton'
          showText='inMenu'
        >
          <Button
            icon='export'
            text='Export'
            stylingMode='text'
          />
        </Item>
      </Toolbar>
      {children}
    </div>
  );
};
