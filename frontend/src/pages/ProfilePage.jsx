import { Box, Container, Text } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ProfilePage = () => {
    return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
        <Header />
        <Container maxW="800px" py={12} flex="1">
            <VStack align="flex-start" spacing={4} color="gray.200">
                <Heading size="lg">Profile Page</Heading>
                <Text fontSize="sm" color="gray.400">
                    not implemented
                </Text>
            </VStack>
        </Container>
        <Footer />
    </Box>
    )
}

export default ProfilePage