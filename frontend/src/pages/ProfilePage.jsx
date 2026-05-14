import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Box, Button, Container, Dialog, Heading, HStack, Avatar, Badge, Input, Spinner, Text, Textarea, VStack } from '@chakra-ui/react'
import { Tooltip } from '../components/ui/tooltip'
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'
import { LuArrowLeft } from 'react-icons/lu'

const ProfilePage = () => {
    const { userid } = useParams();
    const navigate = useNavigate()
    const location = useLocation()
    const { user, loading: authLoading, fetchUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bio, setBio] = useState('');
    const [saving, setSaving] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const profileUserId = userid || user?._id;
    const isOwnProfile = Boolean(user?._id && profileUserId && user._id === profileUserId);
    const profileSource = location.state?.from || new URLSearchParams(location.search).get('from')
    const backTarget = location.state?.returnTo || (profileSource === 'browse' ? '/browse' : '/dashboard')
    const backLabel = location.state?.returnTo ? 'Back' : profileSource === 'browse' ? 'Back to Browse' : 'Back to Dashboard'

    useEffect(() => {
        if (authLoading) return;

        const fetchProfile = async () => {
            if (!profileUserId) {
                setError('No user ID provided');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/user/profile/${profileUserId}`);
                
                if (response.ok) {
                    const data = await response.json();
                    const nextProfile = data.data;
                    setProfile(nextProfile);
                    if (isOwnProfile) {
                        setAvatarUrl(nextProfile.avatar_url || '');
                        setBio(nextProfile.bio || '');
                    }
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || 'Failed to load profile');
                }
            } catch {
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [profileUserId, authLoading, isOwnProfile]);

    useEffect(() => {
        if (!isOwnProfile || !profile) return;
        setAvatarUrl(profile.avatar_url || '');
        setBio(profile.bio || '');
    }, [isOwnProfile, profile]);

    useEffect(() => {
        if (!isEditOpen || !profile || !isOwnProfile) return;
        setAvatarUrl(profile.avatar_url || '');
        setBio(profile.bio || '');
    }, [isEditOpen, profile, isOwnProfile]);

    const handleSaveProfile = async () => {
        if (!isOwnProfile) return;

        if (bio.length > 500) {
            toaster.create({
                title: 'Bio must be 500 characters or less.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        if (avatarUrl.length > 2048) {
            toaster.create({
                title: 'Avatar URL must be 2048 characters or less.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ avatar_url: avatarUrl, bio }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                toaster.create({
                    title: data.message || 'Failed to update profile.',
                    type: 'error',
                    duration: 4000,
                    isClosable: true,
                })
                return
            }

            setProfile((prev) => prev ? { ...prev, avatar_url: data.profile?.avatar_url || '', bio: data.profile?.bio || '' } : prev)
            await fetchUser()
            setIsEditOpen(false)

            toaster.create({
                title: data.message || 'Profile updated successfully.',
                type: 'success',
                duration: 3000,
                isClosable: true,
            })
        } catch {
            toaster.create({
                title: 'Failed to update profile.',
                type: 'error',
                duration: 4000,
                isClosable: true,
            })
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />
            <Container maxW="800px" py={12} flex="1">
                {!loading && !authLoading && profile && (
                    <Button
                        variant="ghost"
                        color="gray.400"
                        onClick={() => navigate(backTarget)}
                        alignSelf="flex-start"
                        mb={4}
                        _hover={{ color: 'white', bg: 'gray.700' }}
                    >
                        <LuArrowLeft />
                        {backLabel}
                    </Button>
                )}
                {loading || authLoading ? (
                    <VStack py={20}>
                        <Spinner size="xl" color="blue.500" />
                        <Text color="gray.400">Loading profile...</Text>
                    </VStack>
                ) : error ? (
                    <VStack py={20} spacing={4}>
                        <Text color="red.400" fontSize="xl">⚠️ {error}</Text>
                    </VStack>
                ) : profile ? (
                    <VStack align="stretch" spacing={8}>
                        <Box bg="gray.800" rounded="xl" p={8} position="relative">
                            <HStack display="flex" gap={"32px"} align="center">
                                <Avatar.Root 
                                    size="2xl" 
                                    colorPalette="blue"
                                >
                                    <Avatar.Fallback name={profile.username} />
                                    {profile.avatar_url && (
                                        <Avatar.Image src={profile.avatar_url} alt={profile.username} />
                                    )}
                                </Avatar.Root>
                                <VStack align="flex-start" flex="1" spacing={3} pr={isOwnProfile ? 32 : 0}>
                                    <VStack align="flex-start" spacing={3}>
                                        <Heading size="xl" color="white">
                                            {profile.username}
                                        </Heading>
                                        <HStack>
                                            {profile.badges && profile.badges.map((badge, index) => (
                                                <Tooltip key={index} content={badge.date_awarded ? `Awarded on ${formatDate(badge.date_awarded)}` : ''}>
                                                    <Badge 
                                                        colorPalette={badge.color}
                                                        fontSize="sm"
                                                    >
                                                        {badge.title}
                                                    </Badge>
                                                </Tooltip>
                                            ))}
                                        </HStack>
                                    </VStack>
                                    <VStack align="stretch" spacing={3}>
                                        <Text color="gray.500" fontSize="sm">
                                            Member since {formatDate(profile.createdAt)}
                                        </Text>
                                    </VStack>
                                </VStack>
                            </HStack>
                            {isOwnProfile && (
                                <Button
                                    position="absolute"
                                    right={8}
                                    bottom={8}
                                    bg="purple.600"
                                    color="white"
                                    _hover={{ bg: 'purple.500' }}
                                    onClick={() => setIsEditOpen(true)}
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </Box>
                        <Box bg="gray.800" rounded="xl" p={8}>
                            <Heading size="md" color="white" mb={6}>
                                Profile Statistics
                            </Heading>
                            <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={6}>
                                <Box 
                                    flex="1" 
                                    bg="gray.700" 
                                    p={6} 
                                    rounded="lg" 
                                    borderLeft="4px solid"
                                    borderColor="blue.500"
                                >
                                    <Text color="gray.400" fontSize="sm" mb={2}>
                                        Public Files
                                    </Text>
                                    <Text color="white" fontSize="3xl" fontWeight="bold">
                                        {profile.publicFilesCount}
                                    </Text>
                                </Box>
                                <Box 
                                    flex="1" 
                                    bg="gray.700" 
                                    p={6} 
                                    rounded="lg" 
                                    borderLeft="4px solid"
                                    borderColor={profile.accountStanding >= 0 ? "green.500" : "red.500"}
                                >
                                    <Text color="gray.400" fontSize="sm" mb={2}>
                                        Account Standing
                                    </Text>
                                    <HStack spacing={2}>
                                        <Text color="white" fontSize="3xl" fontWeight="bold">
                                            {Math.abs(profile.accountStanding)}
                                        </Text>
                                        {profile.accountStanding > 0 && (
                                            <IoIosArrowUp size={32} color="#48bb78" />
                                        )}
                                        {profile.accountStanding < 0 && (
                                            <IoIosArrowDown size={32} color="#f56565" />
                                        )}
                                    </HStack>
                                </Box>
                            </Box>
                        </Box>
                        <Box bg="gray.800" rounded="xl" p={8}>
                            <Heading size="md" color="white" mb={4}>
                                Bio
                            </Heading>
                            {profile.bio ? (
                                <Text color="gray.300" fontSize="md" whiteSpace="pre-wrap">
                                    {profile.bio}
                                </Text>
                            ) : (
                                <Text color="gray.500" fontSize="sm">
                                    This user hasn't added a bio yet.
                                </Text>
                            )}
                        </Box>
                    </VStack>
                ) : null}
            </Container>

            {isOwnProfile && (
                <Dialog.Root open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)} zIndex={9999}>
                    <Dialog.Backdrop />
                    <Dialog.Content position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" maxW="720px" w="calc(100vw - 32px)" bg="gray.800">
                        <Dialog.Body>
                            <VStack align="stretch" spacing={5} py={2}>
                                <Heading size="lg" color="white">Edit Profile</Heading>
                                <Text color="gray.400">
                                    Change how your profile looks to other users.
                                </Text>
                                <HStack align="start" spacing={5}>
                                    <Avatar.Root size="xl" colorPalette="blue">
                                        <Avatar.Fallback name={profile?.username} />
                                        {avatarUrl && <Avatar.Image src={avatarUrl} alt={profile?.username} />}
                                    </Avatar.Root>
                                    <VStack align="stretch" flex="1" spacing={4}>
                                        <Box>
                                            <Text color="gray.200" fontWeight="semibold" mb={2}>Avatar image URL</Text>
                                            <Input
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="Paste an image URL"
                                                bg="gray.700"
                                                borderColor="gray.600"
                                                color="white"
                                                _placeholder={{ color: 'gray.400' }}
                                            />
                                            <Text color="gray.500" fontSize="sm" mt={1}>
                                                Leave blank to remove your avatar image.
                                            </Text>
                                        </Box>
                                        <Box>
                                            <Text color="gray.200" fontWeight="semibold" mb={2}>Bio</Text>
                                            <Textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                placeholder="Write a short bio about yourself"
                                                bg="gray.700"
                                                borderColor="gray.600"
                                                color="white"
                                                minH="160px"
                                                _placeholder={{ color: 'gray.400' }}
                                            />
                                            <Text color="gray.500" fontSize="sm" mt={1}>
                                                {bio.length}/500 characters
                                            </Text>
                                        </Box>
                                    </VStack>
                                </HStack>
                                <HStack justify="flex-end" spacing={3} pt={2}>
                                    <Button variant="ghost" color="gray.300" _hover={{ bg: 'gray.700', color: 'white' }} onClick={() => setIsEditOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        bg="purple.600"
                                        color="white"
                                        _hover={{ bg: 'purple.500' }}
                                        onClick={handleSaveProfile}
                                        loading={saving}
                                        disabled={saving}
                                    >
                                        Save Profile
                                    </Button>
                                </HStack>
                            </VStack>
                        </Dialog.Body>
                    </Dialog.Content>
                </Dialog.Root>
            )}
            <Footer />
        </Box>
    )
}

export default ProfilePage