import { useEffect, useState } from 'react'
import {
    Box,
    Container,
    Heading,
    VStack,
    HStack,
    Input,
    Button,
    Text,
    Link as ChakraLink,
    Fieldset,
    Field,
    List,
    Steps,
} from '@chakra-ui/react'

import { toaster } from '../components/ui/toaster'

import { useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { PasswordInput } from '../components/ui/password-input'
import Footer from '../components/Footer'
import { Turnstile } from '@marsidev/react-turnstile'

const RegisterPage = () => {
    const { user } = useAuth();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const [captchaKey, setCaptchaKey] = useState(0);
    const [errors, setErrors] = useState({ username: '', email: '', password: '', confirmPassword: '', submit: '' });
    const [step, setStep] = useState(1);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const stepIndex = Math.max(0, Math.min(2, step - 1));
    const stepItems = [
        { title: 'Details' },
        { title: 'Activate' },
        { title: 'Login' },
    ];

    useEffect(() => {
        document.title = "Register - Share Your Thing"
        if(user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        const activationToken = searchParams.get('token');
        if (!activationToken) return;

        const activate = async () => {
            try {
                const res = await fetch(`/api/user/activate/${activationToken}`);
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    toaster.create({
                        title: data?.message || 'Account activated successfully.',
                        type: 'success',
                        duration: 5000,
                        isClosable: true,
                    });
                    setStep(3);
                } else {
                    toaster.create({
                        title: data?.message || 'Activation failed. Please request a new activation link.',
                        type: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                    setStep(2);
                }
            } catch {
                toaster.create({
                    title: 'Activation failed due to a server error.',
                    type: 'error',
                    duration: 5000,
                    isClosable: true,
                });
                setStep(2);
            }
        };

        activate();
    }, [searchParams]);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(decodeURIComponent(emailParam));
            setStep(2);
        }
    }, [searchParams]);

    useEffect(() => {
        if (step !== 2) return;
        
        setResendCooldown(60);
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [step]);

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
                setStep(2);
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

    const handleResendActivation = async () => {
        if (!email.trim()) {
            toaster.create({
                title: 'Enter your email first.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setResendLoading(true);
        try {
            const res = await fetch('/api/user/activate/resend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json().catch(() => ({}));

            toaster.create({
                title: data?.message || 'If an account exists, a new activation link has been sent.',
                type: res.ok ? 'success' : 'error',
                duration: 5000,
                isClosable: true,
            });

            if (res.ok) {
                setResendCooldown(60);
            }
        } catch {
            toaster.create({
                title: 'Failed to resend activation link.',
                type: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setResendLoading(false);
        }
    }

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
        <Header variant={"none"} />

        <Container maxW={{ base: '100%', md: '600px' }} centerContent px={{ base: 4, md: 6 }} py={{ base: 4, md: 10 }} flex={1}>
            <VStack spacing={{ base: 2, md: 4 }} w="full" px={{ base: 0, md: 0 }}>
                <Heading 
                    as="h1" 
                    size={{ base: 'lg', md: '2xl' }}
                    color="purple.300"
                    textAlign="center"
                >
                    Create Account
                </Heading>

                <Steps.Root colorPalette={"purple"} step={stepIndex} count={stepItems.length} linear w="full" mb={{ base: 0, md: 1 }}>
                    <Steps.List>
                        {stepItems.map((item, index) => (
                            <Steps.Item key={item.title} index={index}>
                                <Steps.Trigger>
                                    <Steps.Indicator>
                                        <Steps.Number color={"white"} />
                                    </Steps.Indicator>
                                    <Steps.Title color="white" display={{ base: 'none', md: 'block' }}>{item.title}</Steps.Title>
                                </Steps.Trigger>
                                {index < stepItems.length - 1 && <Steps.Separator />}
                            </Steps.Item>
                        ))}
                    </Steps.List>
                </Steps.Root>

                <Box w="full" bg="gray.800" p={{ base: 4, md: 7 }} borderRadius="lg" borderTop="2px" borderColor="purple.500">
                    {step === 1 && (
                        <Fieldset.Root>
                            <Fieldset.Content gap={{ base: 2, md: 4 }}>
                                <HStack w="full" spacing={3} align="flex-start">
                                    <Field.Root invalid={Boolean(errors.username)} flex={1}>
                                        <Field.Label color="gray.300" fontSize={{ base: 'sm', md: 'md' }}>
                                            Username
                                        </Field.Label>
                                        <Input
                                            type="text"
                                            name="username"
                                            placeholder='Username'
                                            value={username}
                                            onChange={(e) => handleUsernameChange(e.target.value)}
                                            size={{ base: 'sm', md: 'md' }}
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
                                    <Field.Root invalid={Boolean(errors.email)} flex={1}>
                                        <Field.Label color="gray.300" fontSize={{ base: 'sm', md: 'md' }}>
                                            Email
                                        </Field.Label>
                                        <Input
                                            type="email"
                                            name="email"
                                            placeholder='example@email.com'
                                            value={email}
                                            onChange={(e) => handleEmailChange(e.target.value)}
                                            size={{ base: 'sm', md: 'md' }}
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
                                </HStack>

                                <HStack w="full" spacing={3} align="flex-start">
                                    <Field.Root invalid={Boolean(errors.password)} flex={1}>
                                    <Field.Label color="gray.300" fontSize={{ base: 'sm', md: 'md' }}>
                                        Password
                                    </Field.Label>
                                    <PasswordInput
                                        type="password"
                                        name="password"
                                        placeholder='Enter your password'
                                        value={password}
                                        onChange={(e) => handlePasswordChange(e.target.value)}
                                        size={{ base: 'sm', md: 'md' }}
                                        bg="gray.700"
                                        borderColor="gray.600"
                                        color="white"
                                        _placeholder={{ color: 'gray.400' }}
                                        required
                                    />
                                    {errors.password && (
                                        <Field.ErrorText>{errors.password}</Field.ErrorText>
                                    )}
                                    </Field.Root>

                                    <Field.Root invalid={Boolean(errors.confirmPassword)} flex={1}>
                                        <Field.Label color="gray.300" fontSize={{ base: 'sm', md: 'md' }}>
                                            Confirm Password
                                        </Field.Label>
                                        <Input
                                            type="password"
                                            name="confirmPassword"
                                            placeholder='Confirm your password'
                                            value={confirmPassword}
                                            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                            size={{ base: 'sm', md: 'md' }}
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
                                </HStack>

                                <List.Root
                                    color="gray.400"
                                    fontSize={{ base: 'xs', md: 'sm' }}
                                    ml={{ base: 4, md: 8 }}
                                    gap={{ base: 4, md: 8 }}
                                    display={{ base: 'none', md: 'flex' }}
                                    flexDirection="row"
                                    w="full"
                                >
                                        <List.Item color={hasMinLength ? 'green.300' : 'red.300'}>
                                            At least 8 characters
                                        </List.Item>
                                        <List.Item color={hasNumber ? 'green.300' : 'red.300'}>
                                            At least 1 number
                                        </List.Item>
                                    </List.Root>

                                <Box w="full" display="flex" justifyContent="center" mt={{ base: 1, md: 0 }}>
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
                                    size={{ base: 'sm', md: 'md' }}
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
                    )}

                    {step === 2 && (
                        <VStack spacing={4} align="stretch">
                            <Text color="gray.200" textAlign="center">
                                {email
                                    ? <>We sent an activation link to <Text as="span" color="purple.300">{email}</Text>.</>
                                    : 'We sent an activation link to your email.'}
                            </Text>
                            <Text color="gray.400" textAlign="center">
                                Click the link in your email to activate your account.
                            </Text>
                            <Button
                                type="button"
                                w="full"
                                variant="ghost"
                                color="purple.300"
                                loading={resendLoading}
                                loadingText="Sending"
                                onClick={handleResendActivation}
                                disabled={resendCooldown > 0}
                                _hover={{ bg: resendCooldown > 0 ? 'transparent' : 'gray.700' }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend activation link'}
                            </Button>
                        </VStack>
                    )}

                    {step === 3 && (
                        <VStack spacing={4} align="stretch">
                            <Text color="gray.200" textAlign="center">
                                Your account is ready. Sign in to get started.
                            </Text>
                            <Button
                                type="button"
                                w="full"
                                bg="purple.600"
                                color="white"
                                _hover={{ 
                                    bg: 'purple.500',
                                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)'
                                }}
                                onClick={() => navigate('/login')}
                            >
                                Go to login
                            </Button>
                        </VStack>
                    )}

                    <Text color="gray.400" textAlign="center" mt={{ base: 3, md: 4 }}>
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