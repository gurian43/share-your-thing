import {
    Box,
    Container,
    Text,
    Button,
    VStack,
    Image,
    SimpleGrid,
    Stack,
    Heading,
    HStack,
    Icon,
} from '@chakra-ui/react'
import { HiOutlineCheck, HiOutlineLockClosed, HiOutlineRefresh } from 'react-icons/hi'
import { AiOutlineArrowRight } from 'react-icons/ai'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

import logo from '../assets/logo-text-white.webp'
import { useEffect } from 'react'

const features = [
    {
        icon: HiOutlineCheck,
        title: 'Fast Sharing',
        description: 'Upload files in seconds and send secure links that work everywhere.',
    },
    {
        icon: HiOutlineLockClosed,
        title: 'Privacy First',
        description: 'Protect downloads with passwords and keep full control over access.',
    },
    {
        icon: HiOutlineRefresh,
        title: 'Effortless Management',
        description: 'Edit, remove, or resend shared files from one clean dashboard.',
    },
]

const HomePage = () => {

    useEffect(() => {
        document.title = "Share Your Thing"
    }, [])

    const navigate = useNavigate()

    return (
        <Box minH="100vh" bg="gray.900" color="white" display="flex" flexDirection="column" overflow="hidden">
            <Header />

            <Box position="relative" flex="1" w="full" overflow="hidden" gap={12} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                <Box
                    as="svg"
                    position="absolute"
                    bottom="-120px"
                    left={0}
                    w="100%"
                    h="320px"
                    viewBox="0 0 1440 320"
                    preserveAspectRatio="none"
                    pointerEvents="none"
                    zIndex={0}
                >
                    <path
                        fill="rgba(124, 58, 237, 0.16)"
                        d="M0,96L48,85.3C96,75,192,53,288,42.7C384,32,480,32,576,58.7C672,85,768,139,864,176C960,213,1056,235,1152,224C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                    <path
                        fill="rgba(192, 132, 252, 0.2)"
                        d="M0,64L48,69.3C96,75,192,85,288,106.7C384,128,480,160,576,165.3C672,171,768,149,864,144C960,139,1056,149,1152,154.7C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    />
                </Box>

                <Container maxW="1200px" centerContent flex="1" justifyContent="center" display="flex" position="relative" zIndex={1} pt={{ base: 8, md: 12 }}>
                    <VStack spacing={12} textAlign="center" w="full">
                        <Stack spacing={8} align="center" maxW="3xl" >
                            <Image src={logo} alt="Share Your Thing Logo" maxW={{ base: '80%', md: '360px' }} />
                            <Heading as="h1" fontSize={{ base: '2xl', md: '3xl' }} lineHeight="shorter">
                                Share files securely, instantly, effortlessly.
                            </Heading>

                            <HStack spacing={4} flexWrap="wrap" justify="center">
                                <Button
                                    size="lg"
                                    bg="purple.500"
                                    color="white"
                                    px={10}
                                    py={7}
                                    fontSize="lg"
                                    onClick={() => navigate('/register')}
                                    transition="all 0.25s"
                                >
                                    Get Started
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    borderColor="purple.500"
                                    color="white"
                                    px={10}
                                    py={7}
                                    fontSize="lg"
                                    rightIcon={<AiOutlineArrowRight />}
                                    onClick={() => navigate('/browse')}
                                    _hover={{
                                        bg: 'whiteAlpha.100',
                                    }}
                                >
                                    Browse Files
                                </Button>
                            </HStack>
                        </Stack>

                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} w="full">
                            {features.map((feature) => (
                                <Box key={feature.title} bg="whiteAlpha.075" border="1px" borderColor="gray.600" rounded="3xl" p={8} textAlign="left">
                                    <Icon as={feature.icon} boxSize={8} color="purple.300" mb={4} />
                                    <Heading as="h3" fontSize="xl" mb={3}>
                                        {feature.title}
                                    </Heading>
                                    <Text color="gray.300" lineHeight="tall">
                                        {feature.description}
                                    </Text>
                                </Box>
                            ))}
                        </SimpleGrid>
                    </VStack>
                </Container>
            </Box>

            <Footer />
        </Box>
    )
}

export default HomePage