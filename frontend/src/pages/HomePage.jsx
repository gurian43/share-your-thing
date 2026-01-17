import { 
    Box, 
    Container, 
    Text, 
    Button, 
    VStack, 
    Image
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

import logo from '../assets/logo-text-white.webp'
import { useEffect } from 'react'

const HomePage = () => {

    useEffect(() => {
        document.title = "Share Your Thing"
    }, [])

    const navigate = useNavigate()

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />

            <Container maxW="1200px" centerContent py={20} flex="1">
                <VStack spacing={8} textAlign="center">
                    <Image
                        src={logo} 
                        alt="Share Your Thing Logo" 
                        maxW={{ base: '80%', md: '400px' }}
                    />
                    <Text
                        fontSize="xl" 
                        color="gray.300" 
                        maxW={{ base: '90%', md: '700px' }}
                    >
                        The easiest way to share your files with anyone, anywhere
                    </Text>
                    <Button
                        size="lg" 
                        bg="purple.600"
                        color="white"
                        px={12} 
                        py={7}
                        fontSize="xl"
                        onClick={() => navigate('/register')}
                        _hover={{ 
                            bg: 'purple.500',
                            transform: 'scale(1.05)',
                            boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)'
                        }}
                        transition="all 0.3s"
                    >
                        Get Started
                    </Button>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}

export default HomePage