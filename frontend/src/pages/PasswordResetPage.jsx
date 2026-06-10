import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Container,
  Field,
  Fieldset,
  Heading,
  Input,
  Link as ChakraLink,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import Footer from '../components/Footer'
import Header from '../components/Header'
import { PasswordInput } from '../components/ui/password-input'
import { toaster } from '../components/ui/toaster'

const PasswordResetPage = () => {
    const navigate = useNavigate();
    const params = useParams();
    const [searchParams] = useSearchParams();

    const token = useMemo(() => params.token || searchParams.get('token') || '', [params.token, searchParams]);

    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [tokenStatus, setTokenStatus] = useState(token ? 'checking' : 'missing');
    const [tokenMessage, setTokenMessage] = useState('');

    const hasMinLength = newPassword.length >= 8;
    const hasNumber = /\d/.test(newPassword);

    useEffect(() => {
        document.title = 'Reset Password - Share Your Thing';
    }, []);

    useEffect(() => {
        if (!token) {
        setTokenStatus('missing');
        setTokenMessage('');
        return;
        }

        let isCancelled = false;
        const validateToken = async () => {
        setTokenStatus('checking');
        setTokenMessage('');

        try {
            const res = await fetch(`/api/user/password/reset/validate/${encodeURIComponent(token)}`);
            const data = await res.json().catch(() => ({}));

            if (isCancelled) {
                return;
            }

            if (res.ok) {
                setTokenStatus('valid');
            return;
            }

            setTokenStatus('invalid');
            setTokenMessage(data.message || 'Invalid or expired reset token');
            toaster.create({
                title: data.message || 'Invalid or expired reset token',
                type: 'error',
                duration: 4000,
                isClosable: true,
            });
        } catch {
            if (isCancelled) {
                return;
            }

            setTokenStatus('invalid');
            setTokenMessage('Unable to validate reset token right now.');
            toaster.create({
                title: 'Unable to validate reset token right now.',
                type: 'error',
                duration: 4000,
                isClosable: true,
            });
        }
        };

        validateToken();

        return () => {
            isCancelled = true;
        };
    }, [token]);

    const handleRequestResetEmail = async () => {
        if (!email.trim()) {
            toaster.create({
                title: 'Enter your email address.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setEmailLoading(true);
        try {
            const res = await fetch('/api/user/password/reset/email', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            setEmailSent(true);
            toaster.create({
                title: data.message || 'If an account exists, a password reset link has been sent.',
                type: 'success',
                duration: 4000,
                isClosable: true,
            });
            return;
        }

        toaster.create({
            title: data.message || 'Failed to send password reset email.',
            type: 'error',
            duration: 4000,
            isClosable: true,
        });
        } catch {
            toaster.create({
                title: 'Failed to send password reset email.',
                type: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setEmailLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            toaster.create({
                title: 'Enter and confirm your new password.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!hasMinLength || !hasNumber) {
            toaster.create({
                title: 'Password must be at least 8 characters and include a number.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toaster.create({
                title: 'Passwords do not match.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setResetLoading(true);
        try {
            const res = await fetch(`/api/user/password/reset/${encodeURIComponent(token)}`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok) {
                toaster.create({
                    title: data.message || 'Password reset successful.',
                    type: 'success',
                    duration: 4000,
                    isClosable: true,
                });
                navigate('/login');
                return;
            }

            toaster.create({
                title: data.message || 'Password reset failed.',
                type: 'error',
                duration: 4000,
                isClosable: true,
            });

            if (res.status === 400 || res.status === 404) {
                setTokenStatus('invalid');
                setTokenMessage(data.message || 'Invalid or expired reset token');
            }

        } catch {
            toaster.create({
                title: 'Password reset failed.',
                type: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setResetLoading(false);
        }
    };

    const showPasswordForm = tokenStatus === 'valid';
    const showEmailForm = tokenStatus === 'missing' || tokenStatus === 'invalid';

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header variant="none" />

            <Container maxW="500px" centerContent py={20} px={{ base: 5, md: 6 }} flex={1}>
                <VStack spacing={8} w="full">
                    <Heading as="h1" size="2xl" color="purple.300" textAlign="center">
                        Reset Password
                    </Heading>

                    <Box 
                        w="full" 
                        bg="gray.800" 
                        p={{ base: 6, md: 8 }} 
                        display="flex" 
                        justifyContent={"center"} 
                        alignItems={"center"} 
                        flexDir={"column"} 
                        gap={"8px"} 
                        orderRadius="lg" 
                    >
                        {tokenStatus === 'checking' && (
                            <VStack spacing={4} py={8}>
                                <Spinner color="purple.300" size="lg" />
                                <Text color="gray.300" textAlign="center">
                                    Validating your reset link...
                                </Text>
                            </VStack>
                        )}

                        {showEmailForm && (
                            <form onSubmit={(e) => { e.preventDefault(); handleRequestResetEmail(); }}>
                                <Fieldset.Root>
                                    <Fieldset.Content gap={4}>
                                        <Text color="gray.300" textAlign="center">
                                            {emailSent
                                                ? <>If an account exists for <Text as="span" color="purple.300">{email}</Text>, a password reset link has been sent.</>
                                                : tokenStatus === 'invalid'
                                                ? tokenMessage || 'That reset link is no longer valid. Request a new one below.'
                                                : 'Enter your email and we will send you a password reset link.'}
                                        </Text>
                                        {!emailSent && (
                                            <>
                                                <Field.Root>
                                                    <Field.Label color="gray.300">
                                                        Email
                                                    </Field.Label>
                                                    <Input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        placeholder="Enter your email"
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
                                                    loading={emailLoading}
                                                    loadingText="Sending"
                                                    _hover={{
                                                        bg: 'purple.500'
                                                    }}
                                                    onClick={handleRequestResetEmail}
                                                >
                                                    Send reset link
                                                </Button>
                                            </>
                                        )}
                                    </Fieldset.Content>
                                </Fieldset.Root>
                            </form>
                        )}

                        {showPasswordForm && (
                            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}>
                                <Fieldset.Root>
                                    <Fieldset.Content gap={4}>
                                        <Text color="gray.300" textAlign="center">
                                            Enter your new password twice to complete the reset.
                                        </Text>

                                        <Field.Root>
                                            <Field.Label color="gray.300">
                                                New Password
                                            </Field.Label>
                                            <PasswordInput
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter your new password"
                                                bg="gray.700"
                                                color="white"
                                                _placeholder={{ color: 'gray.400' }}
                                                required
                                            />
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label color="gray.300">
                                                Confirm Password
                                            </Field.Label>
                                            <PasswordInput
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm your new password"
                                                bg="gray.700"
                                                color="white"
                                                _placeholder={{ color: 'gray.400' }}
                                                required
                                            />
                                        </Field.Root>

                                        <Text color={hasMinLength ? 'green.300' : 'red.300'} fontSize="sm">
                                            At least 8 characters
                                        </Text>
                                        <Text color={hasNumber ? 'green.300' : 'red.300'} fontSize="sm" mt={-3}>
                                            At least 1 number
                                        </Text>

                                        <Button
                                            type="submit"
                                            w="full"
                                            bg="purple.600"
                                            color="white"
                                            loading={resetLoading}
                                            loadingText="Resetting"
                                            _hover={{
                                                bg: 'purple.500'
                                            }}
                                            onClick={handleResetPassword}
                                        >
                                            Reset password
                                        </Button>
                                    </Fieldset.Content>
                                </Fieldset.Root>
                            </form>
                        )}

                        <ChakraLink
                            color="purple.400"
                            onClick={() => navigate('/login')}
                            cursor="pointer"
                            _hover={{ color: 'purple.300' }}
                        >
                            Back to login
                        </ChakraLink>
                    </Box>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}

export default PasswordResetPage