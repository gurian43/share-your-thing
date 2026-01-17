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
import { Turnstile } from '@marsidev/react-turnstile'

const LoginPage = () => {
    const navigate = useNavigate()
    const { user, login } = useAuth();
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [captchaKey, setCaptchaKey] = useState(0);

    const handlePasswordChange = (value) => {
        setPassword(value);
    }

    const handleEmailChange = (value) => {
        setEmail(value);
    }

    const handleSubmit = async () => {
        if (!captchaToken) {
            toaster.create({
                title: 'Please complete the captcha.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        const { success, message } = await login(email, password, captchaToken);
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
            setCaptchaToken(null);
            setCaptchaKey(prev => prev + 1);
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

        <Container maxW="500px" centerContent py={20} px={{ base: 5, md: 6 }} flex={1}>
            <VStack spacing={8} w="full">
            <Heading 
                as="h1" 
                size="2xl" 
                color="purple.300"
                textAlign="center"
            >
                Sign In
            </Heading>

            <Box w="full" bg="gray.800" p={{ base: 6, md: 8 }} borderRadius="lg" boxShadow="lg" borderTop="2px" borderColor="purple.500">
                <Fieldset.Root>
                    <Fieldset.Content gap={4}>
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
                        <Box w="full" display="flex" justifyContent="center">
                            <Turnstile
                                key={captchaKey}
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onSuccess={(token) => setCaptchaToken(token)}
                                onError={() => setCaptchaToken(null)}
                                onExpire={() => setCaptchaToken(null)}
                                options={{ theme: 'dark', size: 'flexible' }}
                            />
                        </Box>
                        <Button 
                            type="submit"
                            w="full"
                            bg="purple.600"
                            color="white"
                            loading={loading}
                            loadingText="Signing In"
                            isDisabled={!captchaToken}
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
