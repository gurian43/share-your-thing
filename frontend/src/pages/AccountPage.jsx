import { Alert, Box, Button, Container, Dialog, Heading, HStack, Separator, Span, Text, VStack } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useState } from 'react';
import { toaster } from '../components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


const AccountPage = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const [activeSection, setActiveSection] = useState("overview");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return (
                    <VStack align="flex-start" spacing={6}>
                        <Heading color="white" size="xl">Account Overview</Heading>
                        <Text color="gray.400">Email: {user.email}</Text>
                        <Text color="gray.400">Account Type: {user.admin ? "Administrator" : "Standard User"}</Text>
                        <Text color="gray.400">Storage Used: { (user.current_storage / (1024 * 1024)).toFixed(2) } MB / { user.admin ? "Unlimited" : (user.max_storage / (1024 * 1024)).toFixed(2) + " MB" }</Text>
                        <Text color="gray.400">Status: <Span color="green.400">{user.active ? "Active" : "Inactive"}</Span></Text>
                    </VStack>
                )
            case 'delete':
                return (
                    <VStack align="flex-start" spacing={6}>
                        <Heading color="white" size="xl">Delete Account</Heading>
                        <Alert.Root colorPalette="red" status="warning" variant="solid">
                            <Alert.Indicator />
                            <Alert.Content>
                                <Alert.Title>Action is irreversible</Alert.Title>
                                <Alert.Description>
                                    Deleting your account will permanently remove all your data from our servers, including files. This action cannot be undone.
                                </Alert.Description>
                            </Alert.Content>
                        </Alert.Root>
                        <Button variant="outline" colorPalette={"red"} onClick={() => setDeleteDialogOpen(true)}>Delete My Account</Button>
                    </VStack>
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
        try {
            const res = await fetch('/api/user/delete', {
                method: 'DELETE',
                credentials: 'include',
            });

            const data = await res.json();

            if (res.ok) {
                toaster.create({
                    title: data.message || 'Account deleted successfully',
                    type: 'success',
                    duration: 3000,
                });
                setDeleteDialogOpen(false);
                navigate('/');
            } else {
                toaster.create({
                    title: data.message || 'Failed to delete account',
                    type: 'error',
                    duration: 3000,
                });
            }
        } catch {
            toaster.create({
                title: 'Server error',
                type: 'error',
                duration: 3000,
            });
        }
    };

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />
            <Container maxW="800px" py={12} flex="1">
                <Heading mb={8} color={"white"} size={"2xl"}>Account Page</Heading>
                <HStack spacing={8} align="stretch">
                    <Container flex={1}>
                        <VStack>
                            <Button w={"100%"} color="white" _hover={{ bg: 'gray.800' }}onClick={() => handleSelect("overview")}>Account Overview</Button>
                            <Button w={"100%"} color="white" _hover={{ bg: 'gray.800' }} onClick={() => handleSelect("delete")}>Delete Account</Button>
                            <Button w={"100%"} color="red.300" _hover={{ bg: 'red.800' }} onClick={handleLogout}>Logout</Button>
                        </VStack>
                    </Container>
                    <Separator orientation={"vertical"} />
                    <Container flex={9}>
                        {renderContent()}
                    </Container>
                </HStack>
            </Container>
            <Dialog.Root open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)} zIndex={9999}>
                <Dialog.Backdrop />
                <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                    <Dialog.Body>
                        <VStack spacing={6} align="center" justify="center" py={8}>
                            <Heading size="lg" color="white" textAlign="center">
                                Are you really sure you want to delete your account?
                            </Heading>
                            <Text color="gray.400" textAlign="center">
                                This action cannot be undone. All your files and data will be permanently deleted.
                            </Text>
                            <HStack spacing={4}>
                                <Button variant="outline" color="white" _hover={{color: "black"}} onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                                <Button bg="red.600" color="white" onClick={confirmDelete} _hover={{ bg: 'red.500' }}>Delete Account</Button>
                            </HStack>
                        </VStack>
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Root>

            <Footer />
        </Box>
    )
}

export default AccountPage