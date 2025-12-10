import { Box, Container, Text } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const BrowsePage = () => {
    return (
        <Box minH="100vh" bg="gray.900" display={"flex"} flexDirection="column">
            <Header />

            <Container maxW="1200px" centerContent py={20}>
                <Text
                    fontSize="xl" 
                    color="gray.300" 
                    maxW="700px"
                >
                    not implemented
                </Text>
            </Container>

            <Footer />
        </Box>
    )
}

export default BrowsePage