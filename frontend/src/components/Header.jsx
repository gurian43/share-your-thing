import { Box, Button, HStack, Image, Avatar, AvatarGroup, Menu, Portal, Tabs, useBreakpointValue } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'
import logotext from '../assets/logo-text-white.webp'

import { useAuth } from '../context/AuthContext'
import { toaster } from './ui/toaster'

//variant: 'logged in' | 'default' | 'none'
const Header = ({variant}) => {

    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout, loading } = useAuth()
    const isMobile = useBreakpointValue({ base: true, md: false })

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
                isMobile ? (
                    <Menu.Root>
                        <Menu.Trigger>
                            <Button variant="subtle" colorScheme="purple">Menu</Button>
                        </Menu.Trigger>
                        <Portal>
                            <Menu.Positioner>
                                <Menu.Content bg="gray.800" border="1px solid" borderColor="gray.700" rounded="md" minW="150px" boxShadow="lg">
                                    <Menu.Item value="home" color="white" cursor="pointer" onClick={() => navigate('/')}>Home</Menu.Item>
                                    <Menu.Item value="dashboard" color="white" cursor="pointer" onClick={() => navigate('/dashboard')}>Dashboard</Menu.Item>
                                    <Menu.Item value="browse" color="white" cursor="pointer" onClick={() => navigate('/browse')}>Browse</Menu.Item>
                                </Menu.Content>
                            </Menu.Positioner>
                        </Portal>
                    </Menu.Root>
                ) : (
                    <Tabs.Root 
                        variant={"enclosed"}
                        value={getCurrentPage()} 
                        onValueChange={(details) => handleNavigation(details.value)}
                        maxW="100%"
                    >
                        <Tabs.List display="flex" flexWrap="wrap">
                            <Tabs.Trigger value="home" color="white" _selected={{ bg: 'purple.600'}}>Home</Tabs.Trigger>
                            <Tabs.Trigger value="dashboard" color="white" _selected={{ bg: 'purple.600'}}>Dashboard</Tabs.Trigger>
                            <Tabs.Trigger value="browse" color="white" _selected={{ bg: 'purple.600'}}>Browse</Tabs.Trigger>
                        </Tabs.List>
                    </Tabs.Root>
                )
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
                                    onClick={() => navigate('/profile/' + user._id)}
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
                isMobile ? null : (
                    <Tabs.Root value={getCurrentPage()} onValueChange={(details) => handleNavigation(details.value)} colorPalette="purple" maxW="100%">
                        <Tabs.List display="flex" flexWrap="wrap">
                            <Tabs.Trigger value="home" color="white" _selected={{ bg: 'purple.600'}}>Home</Tabs.Trigger>
                            <Tabs.Trigger value="browse" color="white" _selected={{ bg: 'purple.600'}}>Browse</Tabs.Trigger>
                        </Tabs.List>
                    </Tabs.Root>
                )
            )
            userContent = (
                <HStack spacing={{ base: 2, md: 4 }}>
                    <Button 
                        color={"white"}
                        colorScheme="purple" 
                        variant="outline" 
                        size={{ base: 'sm', md: 'md' }}
                        _hover={{ bg: 'purple.700', boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
                        onClick={() => navigate('/login')}
                    >
                        Sign In
                    </Button>
                    <Button 
                        bg="purple.600" 
                        color="white"
                        size={{ base: 'sm', md: 'md' }}
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
        <Box bg="gray.800" p={{ base: '8px', md: '8px 12px' }} display={"flex"} justifyContent={"space-between"} alignItems={"center"} h={{ base: '56px', md: '64px' }} w="100%" overflow="hidden">
            <Box flex={{ base: '0 0 160px', md: '0 0 220px' }} display="flex" alignItems="center" minW={0}>
                <Image
                    src={logotext}
                    alt="Logo"
                    height={{ base: '40px', md: '50px' }}
                    objectFit={"contain"}
                    cursor="pointer"
                    onClick={() => navigate('/')}
                />
            </Box>
            <Box display={"flex"} flex={1} justifyContent={{ base: 'flex-start', md: 'center' }} minW={0} overflow="hidden">
                {navContent}
            </Box>
            <Box 
                flex={{ base: '0 0 auto', md: '0 0 220px' }}
                display="flex"
                justifyContent="flex-end"
                alignItems="center"
                minW={0}
            >
                {userContent}
            </Box>
        </Box>
    )
}

export default Header