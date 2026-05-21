
import { Navigate } from 'react-router-dom';
import { useAuth } from './contexts/auth';

export const PublicRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAuth();

    if (loading) return null;

    return !user ? children : <Navigate to="/" replace />;
};
