import { useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'

const PrivacyPage = () => {
    useEffect(() => {
        document.title = 'Privacy Policy - Share Your Thing'
    }, [])

    const lastUpdated = 'April 5, 2026'

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />
            <Container maxW="900px" py={12} flex="1">
                <VStack align="flex-start" spacing={6} color="gray.200">
                    <Heading size="lg">Privacy Policy</Heading>
                    <Text fontSize="sm" color="gray.400">
                        Last updated: {lastUpdated}
                    </Text>

                    <Text fontSize="sm" color="gray.300" lineHeight="tall">
                        This app is currently a student project and is not offered as a commercial service.
                        It may still be used for personal file sharing by the project author. This page explains
                        what data is processed and how it is handled.
                    </Text>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">1. Data We Process</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            The app may process account information (such as username and email), uploaded files,
                            file metadata (name, size, upload date, expiry), and basic technical data needed for
                            security and operation.
                        </Text>
                    </VStack>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">2. Why Data Is Used</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            Data is used to create and manage accounts, store and share files, protect downloads,
                            prevent abuse, and keep the application stable.
                        </Text>
                    </VStack>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">3. File Storage and Retention</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            Uploaded files are stored on the project server storage. Files may be deleted manually
                            by the account owner or automatically after expiration or cleanup routines.
                        </Text>
                    </VStack>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">4. Security Measures</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            Reasonable technical safeguards are used, such as authentication, optional password
                            protection for downloads, and server-side validation. No system can guarantee absolute
                            security, so avoid uploading highly sensitive data.
                        </Text>
                    </VStack>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">5. Cookies and Session Data</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            The app may use cookies or session identifiers for login state, security checks, and
                            request handling. These are used only for essential app functionality.
                        </Text>
                    </VStack>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">6. Third-Party Services</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            Certain security or infrastructure features may rely on third-party providers
                            (for example CAPTCHA or email delivery). Those providers may process limited technical
                            data required to deliver their services.
                        </Text>
                    </VStack>

                    <VStack align="flex-start" spacing={2}>
                        <Heading size="sm">8. Contact</Heading>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                            For questions about privacy in this project, contact the project owner/maintainer.
                        </Text>
                    </VStack>
                </VStack>
            </Container>
            <Footer />
        </Box>
    )
}

export default PrivacyPage
