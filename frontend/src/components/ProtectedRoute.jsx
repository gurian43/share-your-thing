import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import { useEffect, useRef } from 'react';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const hasShownToast = useRef(false);

    useEffect(() => {
        if (!loading && !user && !hasShownToast.current) {
            toaster.create({
                title: "You must be logged in to access that page.",
                type: 'warning',
                duration: 3000,
            });
            hasShownToast.current = true;
        }
    }, [user, loading]);

    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="purple.500" thickness="4px" />
            </Center>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
