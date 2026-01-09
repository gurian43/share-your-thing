import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Container, Heading, Text, VStack, HStack, Avatar, Badge, Spinner } from '@chakra-ui/react'
import { Tooltip } from '../components/ui/tooltip'
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

const ProfilePage = () => {
    const { userid } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const profileUserId = userid || user?._id;

    useEffect(() => {
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
                    setProfile(data.data);
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
    }, [profileUserId]);

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
                {loading ? (
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
                        <Box bg="gray.800" rounded="xl" p={8}>
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
                                <VStack align="flex-start" flex="1" spacing={3}>
                                    <VStack>
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
                                    {profile.bio && (
                                        <Text color="gray.300" fontSize="md">
                                            {profile.bio}
                                        </Text>
                                    )}
                                    <Text color="gray.500" fontSize="sm">
                                        Member since {formatDate(profile.createdAt)}
                                    </Text>
                                </VStack>
                            </HStack>
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
                        {!profile.bio && (
                            <Box bg="gray.800" rounded="xl" p={6} textAlign="center">
                                <Text color="gray.500" fontSize="sm">
                                    This user hasn't added a bio yet.
                                </Text>
                            </Box>
                        )}
                    </VStack>
                ) : null}
            </Container>
            <Footer />
        </Box>
    )
}

export default ProfilePage