import { Box, Button, HStack, Image, Avatar, AvatarGroup, Menu, Portal, Tabs } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import logotext from '../assets/logo-text-white.webp'

import { useAuth } from '../context/AuthContext'
import { toaster } from './ui/toaster'

//variant: 'logged in' | 'default' | 'none'
const Header = ({variant}) => {

    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, loading } = useAuth()

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

    const getCurrentPage = () => {
        if (location.pathname === '/dashboard') return 'dashboard'
        if (location.pathname === '/browse') return 'browse'
        if (location.pathname === '/') return 'home'
        return 'none'
    }

    const handleNavigation = (value) => {
        if (value === 'home') navigate('/')
        else if (value === 'dashboard') navigate('/dashboard')
        else if (value === 'browse') navigate('/browse')
    }

    let navContent = null
    let userContent = null
    
    if (variant !== 'none' && !loading) {
        if (user !== null) {
            navContent = (
                <Tabs.Root value={getCurrentPage()} onValueChange={(details) => handleNavigation(details.value)} colorPalette="purple">
                    <Tabs.List>
                        <Tabs.Trigger value="home" color="white">Home</Tabs.Trigger>
                        <Tabs.Trigger value="dashboard" color="white">Dashboard</Tabs.Trigger>
                        <Tabs.Trigger value="browse" color="white">Browse</Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>
            )
            userContent = (
                <Menu.Root>
                    <Menu.Trigger rounded={"full"} focusRing={"outside"}>
                        <AvatarGroup size='sm' max={3} cursor={"pointer"}>
                            <Avatar.Root colorPalette={"purple"}>
                                <Avatar.Fallback name={user.username} />
                                <Avatar.Image src={user.avatarUrl} alt={user.username || "User Avatar"} />
                            </Avatar.Root>
                        </AvatarGroup>
                    </Menu.Trigger>
                    <Portal>
                        <Menu.Positioner>
                            <Menu.Content bg="gray.800" border="1px solid" borderColor="gray.700" rounded="md" minW="150px" boxShadow="lg">
                                <Menu.Item 
                                    value="profile"
                                    color="white"
                                    cursor="pointer"
                                    onClick={() => navigate('/profile')}
                                    _hover={{ bg: 'gray.700' }}
                                >
                                    Profile
                                </Menu.Item>
                                <Menu.Item 
                                    value="account"
                                    color="white"
                                    cursor="pointer"
                                    onClick={() => navigate('/account')}
                                    _hover={{ bg: 'gray.700' }}
                                >
                                    Account Settings
                                </Menu.Item>
                                <Menu.Item 
                                    value="logout"
                                    onClick={handleLogout}
                                    color="red.300"
                                    cursor="pointer"
                                    _hover={{ bg: 'red.900' }}
                                >
                                    Logout
                                </Menu.Item>
                            </Menu.Content>
                        </Menu.Positioner>
                    </Portal>
                </Menu.Root>
            )
        } else {
            navContent = (
                <Tabs.Root value={getCurrentPage()} onValueChange={(details) => handleNavigation(details.value)} colorPalette="purple">
                    <Tabs.List>
                        <Tabs.Trigger value="home" color="white">Home</Tabs.Trigger>
                        <Tabs.Trigger value="dashboard" disabled color="white">Dashboard</Tabs.Trigger>
                        <Tabs.Trigger value="browse" color="white">Browse</Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>
            )
            userContent = (
                <HStack spacing={4}>
                    <Button 
                        color={"white"}
                        colorScheme="purple" 
                        variant="outline" 
                        _hover={{ bg: 'purple.700', boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
                        onClick={() => navigate('/login')}
                    >
                        Sign In
                    </Button>
                    <Button 
                        bg="purple.600" 
                        color="white"
                        _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                        onClick={() => navigate('/register')}
                    >
                        Sign Up
                    </Button>
                </HStack>
            )
        }
    }

    return (
        <Box bg="gray.800" p={"8px"} display={"flex"} justifyContent={"space-between"} alignItems={"center"} h={"64px"}>
            <Box flex="0 0 220px" display="flex" alignItems="center">
                <Image
                    src={logotext}
                    alt="Logo"
                    height="50px"
                    objectFit={"contain"}
                    cursor="pointer"
                    onClick={() => navigate('/')}
                />
            </Box>
            <Box display={"flex"} flex={1} justifyContent={"center"}>
                {navContent}
            </Box>
            <Box 
                flex="0 0 220px"
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
            >
                {userContent}
            </Box>
        </Box>
    )
}

export default Header