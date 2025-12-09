import React from 'react'
import { 
    Box, 
    Container, 
    Flex, 
    Heading, 
    Text, 
    Button, 
    VStack, 
    HStack,
    Spacer
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {

    const navigate = useNavigate()

    return (
        <Box minH="100vh" bg="gray.900">
            <Box bg="gray.800" py={4} px={8} boxShadow="md" borderBottom="2px" borderColor="purple.500">
                <Flex align="center" maxW="1200px" mx="auto">
                    <Heading size="lg" color="purple.300">
                        Share Your Thing
                    </Heading>
                    <Spacer />
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
                </Flex>
            </Box>

            <Container maxW="1200px" centerContent py={20}>
                <VStack spacing={8} textAlign="center">
                    <Heading 
                        as="h1" 
                        size="4xl" 
                        color="purple.300"
                        fontWeight="bold"
                        textShadow="0 0 20px rgba(168, 85, 247, 0.3)"
                    >
                        Share Your Thing
                    </Heading>
                    <Text 
                        fontSize="xl" 
                        color="gray.300" 
                        maxW="700px"
                    >
                        The easiest way to share your things with anyone, anywhere
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
        </Box>
    )
}

export default HomePage