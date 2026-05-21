import React, { useState, createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavigationContextType } from '../types';
import { useAuth } from './auth';

const NavigationContext = createContext<NavigationContextType>({} as NavigationContextType);
const useNavigation = () => useContext(NavigationContext);

function NavigationProvider(props: React.PropsWithChildren<unknown>) {
  const [navigationData, setNavigationData] = useState({ currentPath: '' });

  return <NavigationContext.Provider value={{ navigationData, setNavigationData }} {...props} />;
}

function withNavigationWatcher(Component: React.ElementType, path: string) {
  const WrappedComponent = function (props: Record<string, unknown>) {
    const { setNavigationData } = useNavigation();
    const navigate = useNavigate();
    const { user } = useAuth(); // giả sử bạn có useAuth trả về currentUser

    const restrictedPathsForUser = [
      '/crm-contact-list',
      '/crm-contact-details',
      '/product-list',
      '/product-details',
      '/bill-list',
      '/bill-details',
    ];

    useEffect(() => {
      setNavigationData?.({ currentPath: path });

      const basePath = path.split('/:')[0]; // bỏ params
      const isRestricted =
        user?.role === 'User' &&
        restrictedPathsForUser.includes(basePath);

      if (isRestricted) {
        navigate('/home');
      }
    }, [path, setNavigationData, user, navigate]);

    return <Component {...props} />;
  };

  return <WrappedComponent />;
}

export { NavigationProvider, useNavigation, withNavigationWatcher };
