import { Box, Container, Heading, Link as ChakraLink, Text } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

const ActivationPage = () => {
    const { token } = useParams()
    const [status, setStatus] = useState('loading')
    const [message, setMessage] = useState('Activating your account...')

    useEffect(() => {
        const activate = async () => {
            if (!token) {
                setStatus('error')
                setMessage('Missing activation token.')
                return
            }

            try {
                const res = await fetch(`/api/user/activate/${token}`)
                const data = await res.json().catch(() => ({}))

                if (res.ok) {
                    setStatus('success')
                    setMessage(data?.message || 'Account activated successfully.')
                } else {
                    setStatus('error')
                    setMessage(data?.message || 'Activation failed. Please try again later.')
                }
            } catch {
                setStatus('error')
                setMessage('Activation failed due to a server error.')
            }
        }

        activate()
    }, [token])

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />
            <Container
                maxW="800px"
                py={12}
                flex="1"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                textAlign="center"
            >
                <Heading size="lg" mb={4} color={"white"}>
                    {status === 'success' ? 'Activation successful' : status === 'error' ? 'Activation failed' : 'Activating'}
                </Heading>
                <Text color="gray.300" mb={4}>
                    {message}
                </Text>
                <ChakraLink as={RouterLink} to="/login" color="purple.400" _hover={{ color: 'purple.300' }}>
                    Go to login
                </ChakraLink>
            </Container>
            <Footer />
        </Box>
    )
}

export default ActivationPage