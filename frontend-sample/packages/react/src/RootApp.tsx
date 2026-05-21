import React from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/auth';
import { Home } from './Home';
import { Content } from './Content';
import { UnauthenticatedContent } from './UnauthenticatedContent';
import LoadPanel from 'devextreme-react/load-panel';
import { publicPaths } from './app-routes';

export const RootApp = () => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const currentPath = location.pathname;

    if (loading) return <LoadPanel visible />;
    if (!user && publicPaths.some((p) => matchPath(p, currentPath))) {
        return <Home />;
    }
    if (!user) {
        return <UnauthenticatedContent />;
    }
    if (user.role === 'Admin' || user.role === 'Manager' || user.role === "User") {
        return <Content />;
    }
    return <Home />;
};
