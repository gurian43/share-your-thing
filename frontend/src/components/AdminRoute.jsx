import { Center, Spinner } from '@chakra-ui/react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Center h="100vh" w="100vw" bg="gray.900">
                <Spinner size="xl" color="purple.500" thickness="4px" />
            </Center>
        );
    }

    if (!user || (!user.admin && user.role !== 'admin')) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default AdminRoute;