import React from 'react'
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const FaqPage = () => {
  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
        <Header />
        <Container maxW="800px" py={12} flex="1">
            <VStack align="flex-start" spacing={4} color="gray.200">
                <Heading size="lg">Frequently Asked Questions</Heading>
                <Text fontSize="sm" color="gray.400">
                    not implemented
                </Text>
            </VStack>
        </Container>
        <Footer />
    </Box>
  )
}

export default FaqPage