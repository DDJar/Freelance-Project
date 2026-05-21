import React, { useEffect, useRef, useCallback, useMemo } from 'react';

import { TreeView, TreeViewRef } from 'devextreme-react/tree-view';
import { AppFooter } from '../..';
import { navigation } from '../../../app-navigation';
import { useNavigation } from '../../../contexts/navigation';
import { useScreenSize } from '../../../utils/media-query';

import type { SideNavigationMenuProps } from '../../../types';
import './SideNavigationMenu.scss';
import * as events from 'devextreme/events';
import { useAuth } from '../../../contexts/auth';

export type SideNavigationItem = {
  expanded: boolean;
  path: string;
  text: string;
  icon: string;
  items: Array<{
    text: string;
    path: string;
  }>;
};

export const SideNavigationMenu = (
  props: React.PropsWithChildren<SideNavigationMenuProps>
) => {
  const { children, selectedItemChanged, openMenu, compactMode, onMenuReady } = props;
  const { isLarge } = useScreenSize();
  const { user } = useAuth(); // ✅ lấy thông tin user
  const role = user?.role || 'User';

  const {
    navigationData: { currentPath },
  } = useNavigation();

  const treeViewRef = useRef<TreeViewRef>(null);
  const wrapperRef = useRef();

  const getWrapperRef = useCallback(
    (element) => {
      const prevElement = wrapperRef.current;
      if (prevElement) {
        events.off(prevElement, 'dxclick');
      }

      wrapperRef.current = element;
      events.on(element, 'dxclick', (e: React.PointerEvent) => {
        openMenu(e);
      });
    },
    [openMenu]
  );

  // ✅ Lọc navigation theo role
  const getFilteredNavigation = useCallback(() => {
    const restrictedPaths = [
      '/crm-contact-list',
      '/crm-contact-details',
      '/product-list',
      '/product-details',
      '/bill-list',
      '/bill-details',
    ];

    return navigation
      .map((section) => {
        const filteredItems = section.items?.filter(
          (item) => !(role === 'User' && restrictedPaths.includes(item.path))
        );

        if (filteredItems && filteredItems.length > 0) {
          return {
            ...section,
            expanded: isLarge,
            path: section.path && !/^\//.test(section.path) ? `/${section.path}` : section.path,
            items: filteredItems,
          };
        }

        return null;
      })
      .filter(Boolean) as SideNavigationItem[];
  }, [role, isLarge]);

  const items: SideNavigationItem[] = useMemo(getFilteredNavigation, [getFilteredNavigation]);

  // 🔍 Tìm path phù hợp từ navigation cho currentPath
  const findMatchingPath = (currentPath: string) => {
    for (const item of items) {
      for (const sub of item.items || []) {
        if (currentPath.startsWith(sub.path)) {
          return sub.path;
        }
      }
    }
    return '';
  };

  useEffect(() => {
    const treeView = treeViewRef.current && treeViewRef.current.instance();
    if (!treeView) return;

    const matchedPath = findMatchingPath(currentPath);
    if (matchedPath) {
      treeView.selectItem(matchedPath);
      treeView.expandItem(matchedPath);
    }

    if (compactMode) {
      treeView.collapseAll();
    }
  }, [currentPath, compactMode, items]);

  return (
    <div className="dx-swatch-additional side-navigation-menu" ref={getWrapperRef}>
      {children}
      <div className="menu-container theme-dependent">
        <TreeView
          ref={treeViewRef}
          items={items}
          keyExpr="path"
          selectionMode="single"
          focusStateEnabled={false}
          expandEvent="click"
          onItemClick={selectedItemChanged}
          onContentReady={onMenuReady}
          width="100%"
        />
      </div>
      <AppFooter>
        License © {new Date().getFullYear()}
        <br /> Truong Gia Thinh Inc.
      </AppFooter>
    </div>
  );
};
