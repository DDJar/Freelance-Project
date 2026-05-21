import React, { useMemo } from 'react';
import { useAuth } from '../../../contexts/auth';
import DropDownButton from 'devextreme-react/drop-down-button';

import './UserMenuSection.scss';
import type { UserMenuSectionProps } from '../../../types';

type MenuItem = {
  text: string;
  icon: string;
  onClick: () => void;
};

export const UserMenuSection = ({ showAvatar, listRef }: UserMenuSectionProps) => {
  const { user, signOut } = useAuth();

  const menuItems = useMemo<MenuItem[]>(() => [
    {
      text: 'Đăng xuất',
      icon: 'runner',
      onClick: signOut,
    },
  ], [signOut]);

  const onItemClick = (e: any) => {
    e.itemData?.onClick?.();
  };

  return (
    <div className='user-menu-section'>
      <DropDownButton
        text={user?.username ?? 'Tài khoản'}
        icon="user"
        items={menuItems}
        onItemClick={onItemClick}
        stylingMode="text"
        dropDownOptions={{ width: 150 }}
        className="username-dropdown"
      />
    </div>
  );
};
