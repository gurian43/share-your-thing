import { useEffect, useState } from 'react'
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
    Field,
    List,
} from '@chakra-ui/react'

import { toaster } from '../components/ui/toaster'

import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { PasswordInput } from '../components/ui/password-input'
import Footer from '../components/Footer'
import { Turnstile } from '@marsidev/react-turnstile'

const RegisterPage = () => {
    const { user } = useAuth();

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const [captchaKey, setCaptchaKey] = useState(0);
    const [errors, setErrors] = useState({ username: '', email: '', password: '', confirmPassword: '', submit: '' });

    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);

    useEffect(() => {
        document.title = "Register - Share Your Thing"
        if(user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleUsernameChange = (value) => {
        setUsername(value);
    }

    const handleEmailChange = (value) => {
        setEmail(value);
    }

    const handlePasswordChange = (value) => {
        setPassword(value);
    }

    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);
    }

    const validateFields = () => {
        const nextErrors = { username: '', email: '', password: '', confirmPassword: '', submit: '' };

        if (!username.trim()) {
            nextErrors.username = 'Username is required';
        }

        if (!email.trim()) {
            nextErrors.email = 'Email is required';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = 'Invalid email format';
        }

        if (!password) {
            nextErrors.password = 'Password is required';
        } else if (!hasMinLength || !hasNumber) {
            nextErrors.password = 'Password must be at least 8 characters and include a number';
        }

        if (!confirmPassword) {
            nextErrors.confirmPassword = 'Please confirm your password';
        } else if (password !== confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(nextErrors);
        return Object.values(nextErrors).every((val) => !val);
    };

    const handleSubmit = async () => {
        setErrors({ username: '', email: '', password: '', confirmPassword: '', submit: '' });

        const isValid = validateFields();
        if (!isValid) return;

        setLoading(true);
        try {
            const res = await fetch('/api/user/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email, password, captchaToken }),
            });

            const data = await res.json();

            if (res.ok) {
                toaster.create({ 
                    title: data.message || 'Registration successful. Please check your email to activate your account.', 
                    type: 'success',
                    duration: 60_000,
                    closable: true
                });
                navigate('/login');
            } else if (res.status === 400 && data?.message?.toLowerCase().includes('email or username')) {
                setErrors({ username: data.message, email: data.message, password: '', confirmPassword: '', submit: '' });
                setCaptchaToken(null);
                setCaptchaKey(prev => prev + 1);
            } else {
                setErrors((prev) => ({ ...prev, submit: data.message || 'Registration failed' }));
                setCaptchaToken(null);
                setCaptchaKey(prev => prev + 1);
            }
        } catch {
            setErrors((prev) => ({ ...prev, submit: 'Server error during registration' }));
        } finally {
            setLoading(false);
        }
    }

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
        <Header variant={"none"} />

        <Container maxW="500px" centerContent px={{ base: 4, md: 6 }} flex={1}>
            <VStack spacing={4} w="full" px={{ base: 0, md: 0 }}>
                <Heading 
                    as="h1" 
                    size="2xl" 
                    color="purple.300"
                    textAlign="center"
                >
                    Create Account
                </Heading>

                <Box w="full" bg="gray.800" p={{ base: 6, md: 8 }} borderRadius="lg" boxShadow="lg" borderTop="2px" borderColor="purple.500">
                    <Fieldset.Root>
                        <Fieldset.Content>
                            <Field.Root invalid={Boolean(errors.username)}>
                                <Field.Label color="gray.300">
                                    Username
                                </Field.Label>
                                <Input
                                    type="text"
                                    name="username"
                                    placeholder='Username'
                                    value={username}
                                    onChange={(e) => handleUsernameChange(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                    color="white"
                                    _placeholder={{ color: 'gray.400' }}
                                    required
                                />
                                {errors.username && (
                                    <Field.ErrorText>{errors.username}</Field.ErrorText>
                                )}
                            </Field.Root>
                            <Field.Root invalid={Boolean(errors.email)}>
                                <Field.Label color="gray.300">
                                    Email
                                </Field.Label>
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder='example@email.com'
                                    value={email}
                                    onChange={(e) => handleEmailChange(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                    color="white"
                                    _placeholder={{ color: 'gray.400' }}
                                    required
                                />
                                {errors.email && (
                                    <Field.ErrorText>{errors.email}</Field.ErrorText>
                                )}
                            </Field.Root>
                            <Field.Root invalid={Boolean(errors.password)}>
                                <Field.Label color="gray.300">
                                    Password
                                </Field.Label>
                                <PasswordInput
                                    type="password"
                                    name="password"
                                    placeholder='Enter your password'
                                    value={password}
                                    onChange={(e) => handlePasswordChange(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                    color="white"
                                    _placeholder={{ color: 'gray.400' }}
                                    required
                                />

                                <List.Root color="gray.400" fontSize="sm" ml={8} gap={8} display={"flex"} flexDirection={"row"}>
                                    <List.Item color={hasMinLength ? 'green.300' : 'red.300'}>
                                        At least 8 characters
                                    </List.Item>
                                    <List.Item color={hasNumber ? 'green.300' : 'red.300'}>
                                        At least 1 number
                                    </List.Item>
                                </List.Root>

                                {errors.password && (
                                    <Field.ErrorText>{errors.password}</Field.ErrorText>
                                )}

                            </Field.Root>
                            <Field.Root invalid={Boolean(errors.confirmPassword)}>
                                <Field.Label color="gray.300">
                                    Confirm Password
                                </Field.Label>
                                <Input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder='Confirm your password'
                                    value={confirmPassword}
                                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                    color="white"
                                    _placeholder={{ color: 'gray.400' }}
                                    required
                                />
                                {errors.confirmPassword && (
                                    <Field.ErrorText>{errors.confirmPassword}</Field.ErrorText>
                                )}
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
                                loadingText="Signing Up"
                                isDisabled={!captchaToken}
                                _hover={{ 
                                    bg: 'purple.500',
                                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                                }}
                                onClick={handleSubmit}
                            >
                                Sign Up
                            </Button>

                            {errors.submit && (
                                <Text color="red.300" fontSize="sm" mt={3} textAlign="center">
                                    {errors.submit}
                                </Text>
                            )}

                        </Fieldset.Content>
                    </Fieldset.Root>

                    <Text color="gray.400" textAlign="center" mt={4}>
                        Already have an account?{' '}
                        <ChakraLink 
                            color="purple.400" 
                            onClick={() => navigate('/login')}
                            cursor="pointer"
                            _hover={{ color: 'purple.300' }}
                        >
                            Sign In
                        </ChakraLink>
                    </Text>
                </Box>
            </VStack>
        </Container>

        <Footer />
    </Box>
  )
}

export default RegisterPage
