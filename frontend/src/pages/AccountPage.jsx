import { Box, Button, Container, Heading, HStack, Separator, VStack } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState } from 'react';
import { toaster } from '../components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountOverviewSection from '../components/account/AccountOverviewSection';
import ChangePasswordSection from '../components/account/ChangePasswordSection';
import DeleteAccountSection from '../components/account/DeleteAccountSection';
import DeleteAccountDialog from '../components/account/DeleteAccountDialog';


const AccountPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [activeSection, setActiveSection] = useState("overview");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [usedStorage, setUsedStorage] = useState(user ? (user.current_storage / (1024 * 1024)).toFixed(2) : "0.00");

    const handleRecalculateStorage = async () => {
        const promise = fetch('/api/user/recalculate-storage', {
            method: 'POST',
            credentials: 'include',
        }).then(res => res.json());

        toaster.promise(promise, {
            success: (data) => {
                setUsedStorage((data.current_storage / (1024 * 1024)).toFixed(2));
                return {
                    title: data.message || 'Storage usage recalculated successfully',
                };
            },
            error: {
                title: 'Failed to recalculate storage usage',
            },
            loading: {
                title: 'Recalculating storage...',
            },
        });
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <AccountOverviewSection
                        user={user}
                        usedStorage={usedStorage}
                        onRecalculateStorage={handleRecalculateStorage}
                    />
                )
            case 'password':
                return <ChangePasswordSection />
            case 'delete':
                return (
                    <DeleteAccountSection onOpenDeleteDialog={() => setDeleteDialogOpen(true)} />
                )
        }
    }

    const handleSelect = (content) => {
        setActiveSection(content);
    }

    const handleLogout = async () => {
        const {success, message} = await logout()
        if (success) {
            toaster.create({
                title: message,
                type: 'success',
                duration: 3000,
                isClosable: true,
            })
            navigate('/');
        } else {
            toaster.create({
                title: message,
                type: 'error',
                duration: 3000,
                isClosable: true,
            })
        }
    }

    const confirmDelete = async () => {
        const promise = fetch('/api/user/delete', {
            method: 'DELETE',
            credentials: 'include',
        }).then(res => res.json());

        toaster.promise(promise, {
            success: {
                title: 'Account deleted successfully',
            },
            error: {
                title: 'Failed to delete account',
            },
            loading: {
                title: 'Deleting account...',
            },
        });

        const data = await promise;
        if (data.status === 200) {
            await logout();
            navigate('/');
        }
    };

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />
            <Container maxW="800px" py={12} flex="1">
                <Heading mb={8} color={"white"} size={"2xl"}>Account Page</Heading>
                <HStack spacing={8} align="stretch">
                    <Container flex={1}>
                        <VStack align="stretch" spacing={1}>
                            <Button
                                w={"100%"}
                                variant="ghost"
                                justifyContent="flex-start"
                                color={activeSection === 'overview' ? 'purple.300' : 'gray.300'}
                                bg={activeSection === 'overview' ? 'gray.800' : 'transparent'}
                                _hover={{ bg: 'gray.700', color: 'white' }}
                                onClick={() => handleSelect("overview")}
                            >
                                Account Overview
                            </Button>
                            <Button
                                w={"100%"}
                                variant="ghost"
                                justifyContent="flex-start"
                                color={activeSection === 'password' ? 'purple.300' : 'gray.300'}
                                bg={activeSection === 'password' ? 'gray.800' : 'transparent'}
                                _hover={{ bg: 'gray.700', color: 'white' }}
                                onClick={() => handleSelect("password")}
                            >
                                Change Password
                            </Button>
                            <Button
                                w={"100%"}
                                variant="ghost"
                                justifyContent="flex-start"
                                color={activeSection === 'delete' ? 'red.300' : 'gray.300'}
                                bg={activeSection === 'delete' ? 'gray.800' : 'transparent'}
                                _hover={{ bg: 'gray.700', color: 'white' }}
                                onClick={() => handleSelect("delete")}
                            >
                                Delete Account
                            </Button>
                            <Button
                                w={"100%"}
                                variant="ghost"
                                justifyContent="flex-start"
                                color="red.300"
                                _hover={{ bg: 'red.700', color: 'white' }}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </VStack>
                    </Container>
                    <Separator orientation={"vertical"} />
                    <Container flex={9}>
                        {renderContent()}
                    </Container>
                </HStack>
            </Container>
            <DeleteAccountDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirmDelete={confirmDelete}
            />

            <Footer />
        </Box>
    )
}

export default AccountPage