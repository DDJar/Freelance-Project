import { TreeViewTypes } from 'devextreme-react/tree-view';
import { ButtonTypes } from 'devextreme-react/button';
import { ListRef } from 'devextreme-react/list';
import React from 'react';
import { ProfileCardItem } from './components/library/profile-card/ProfileCard';
import { User } from './types/auth';

export interface AppHeaderProps {
  menuToggleEnabled: boolean;
  title?: string;
  toggleMenu: (e: ButtonTypes.ClickEvent) => void;
  className?: string;
}

export interface SideNavigationMenuProps {
  selectedItemChanged: (e: TreeViewTypes.ItemClickEvent) => void;
  openMenu: (e: React.PointerEvent) => void;
  compactMode: boolean;
  onMenuReady: (e: TreeViewTypes.ContentReadyEvent) => void;
}

export interface UserPanelProps {
  menuMode: 'context' | 'list';
}

export interface UserMenuSectionProps {
  showAvatar?: boolean;
  listRef?: React.RefObject<ListRef>;
}

export interface Service {
  getCurrentUserProfile(userId: string): Promise<User | null>;
  updateUserProfile(userId: string, userData: Partial<User>): Promise<boolean>;
  getBasicInfoItems(): Promise<ProfileCardItem[]>;
  getContactItems(): ProfileCardItem[];
  getAddressItems(): ProfileCardItem[];
  update(id: string, user: Partial<User>): Promise<{ isOk: boolean; message?: string }>;
}


export interface SideNavToolbarProps {
  title: string;
}

export interface SingleCardProps {
  title?: string;
  description?: string;
}

export type Handle = () => void;

interface NavigationData {
  currentPath: string;
}

export type NavigationContextType = {
  setNavigationData?: ({ currentPath }: NavigationData) => void;
  navigationData: NavigationData;
};
