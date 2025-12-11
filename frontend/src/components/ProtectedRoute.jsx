import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

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
