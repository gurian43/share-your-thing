import React, { useEffect, useState } from 'react'
import {
    Box,
    Container,
    Heading,
    VStack,
    Input,
    Button,
    Text,
    Link as ChakraLink,
    Fieldset,
    Field
} from '@chakra-ui/react'
import { toaster } from '../components/ui/toaster.jsx'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { PasswordInput } from '../components/ui/password-input.jsx'
import Footer from '../components/Footer.jsx'

const LoginPage = () => {
    const navigate = useNavigate()
    const { user, login } = useAuth();
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = (value) => {
        setPassword(value);
    }

    const handleEmailChange = (value) => {
        setEmail(value);
    }

    const handleSubmit = async () => {
        setLoading(true);
        const { success, message } = await login(email, password);
        if (success) {
            toaster.create({
                title: message,
                type: 'success',
                duration: 3000,
                isClosable: true,
            });
            navigate('/dashboard');
            setLoading(false);
        } else {
            toaster.create({
                title: message,
                type: 'error',
                duration: 3000,
                isClosable: true,
            });
            setLoading(false);
            setPassword('');
        }
    }

    useEffect(() => {
        if(user) {
            navigate('/dashboard');
        }
        document.title = "Login - Share Your Thing"
    }, [navigate, user])

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">

        <Header variant={"none"} />

        <Container maxW="500px" centerContent py={20}>
            <VStack spacing={8} w="full">
            <Heading 
                as="h1" 
                size="2xl" 
                color="purple.300"
                textAlign="center"
            >
                Sign In
            </Heading>

            <Box w="full" bg="gray.800" p={8} borderRadius="lg" boxShadow="lg" borderTop="2px" borderColor="purple.500">
                <Fieldset.Root>
                    <Fieldset.Content>
                        <Field.Root>
                            <Field.Label color="gray.300">
                                Email
                            </Field.Label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => {handleEmailChange(e.target.value)}}
                                placeholder="Enter your email"
                                bg="gray.700"
                                color="white"
                                _placeholder={{ color: 'gray.400' }}
                                required
                            />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label color="gray.300">
                                Password
                            </Field.Label>
                            <PasswordInput
                                value={password}
                                onChange={(e) => {handlePasswordChange(e.target.value)}}
                                placeholder="Enter your password"
                                bg="gray.700"
                                color="white"
                                _placeholder={{ color: 'gray.400' }}
                                required
                            />
                        </Field.Root>
                        <Button 
                            type="submit"
                            w="full"
                            bg="purple.600"
                            color="white"
                            loading={loading}
                            loadingText="Signing In"
                            _hover={{ 
                                bg: 'purple.500',
                                boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                            }}
                            onClick={handleSubmit}
                        >
                            Sign In
                        </Button>
                    </Fieldset.Content>
                </Fieldset.Root>
                <Text color="gray.400" textAlign="center" mt={6}>
                Don't have an account?{' '}
                <ChakraLink 
                    color="purple.400" 
                    onClick={() => navigate('/register')}
                    cursor="pointer"
                    _hover={{ color: 'purple.300' }}
                >
                    Sign Up
                </ChakraLink>
                </Text>
            </Box>
            </VStack>
        </Container>

        <Footer />
    </Box>
  )
}

export default LoginPage
