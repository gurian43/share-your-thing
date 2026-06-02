import { Box, Container, Heading, VStack, Text, Code, Link } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ApiDocsPage = () => {
    return (
        <Box minH="100vh" bg="gray.900" color="gray.200">
            <Header />
            <Container maxW="900px" py={8}>
                <VStack align="stretch" spacing={6}>
                    <Heading size="lg" color="purple.300">API Documentation</Heading>

                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        <Heading size="sm" mb={2}>Authentication</Heading>
                        <Text fontSize="sm">The API uses cookie-based session authentication. Make requests with credentials included.</Text>
                    </Box>

                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        <Heading size="sm" mb={2}>File Upload (chunked)</Heading>
                        <VStack align="start" spacing={2}>
                            <Text fontSize="sm"><Code>/api/file/upload/chunk</Code> (POST) — upload a single chunk. Form fields: <Code>chunk</Code> (file), <Code>chunkIndex</Code>, <Code>totalChunks</Code>, <Code>uploadId</Code>, <Code>fileName</Code>, <Code>fileSize</Code>.</Text>
                            <Text fontSize="sm"><Code>/api/file/upload/finalize</Code> (POST) — merge uploaded chunks and create the file record. JSON body: <Code>uploadId, fileName, fileSize, totalChunks, checksum</Code> plus optional metadata.</Text>
                            <Text fontSize="sm"><Code>/api/file/upload/status?uploadId=...</Code> (GET) — check uploaded chunk indexes for resuming.</Text>
                            <Text fontSize="sm"><Code>/api/file/upload/cancel</Code> (POST) — cancel and delete temp chunks. JSON body: <Code>uploadId</Code>.</Text>
                        </VStack>
                    </Box>

                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        <Heading size="sm" mb={2}>File Download</Heading>
                        <Text fontSize="sm"><Code>/api/file/:fileId/download</Code> (POST) — initiate file download. Supply <Code>password</Code> when required.</Text>
                    </Box>

                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        <Heading size="sm" mb={2}>File Management</Heading>
                        <Text fontSize="sm"><Code>/api/user/files</Code> (GET) — list user files.</Text>
                        <Text fontSize="sm"><Code>/api/file/:fileId</Code> (GET, DELETE, PUT) — fetch, delete, or update metadata.</Text>
                    </Box>

                    <Box bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                        <Heading size="sm" mb={2}>Notes</Heading>
                        <Text fontSize="sm">This documentation is a concise reference for the app's public endpoints.</Text>
                        <Text fontSize="sm">Example: curl with cookies:</Text>
                        <Code p={2} bg="gray.900" borderRadius="md">{`curl -b cookies.txt -X POST https://example.com/api/file/123/download -d '{"password":"..."}' -H 'Content-Type: application/json' -o file.enc`}</Code>
                    </Box>
                </VStack>
            </Container>
            <Footer />
        </Box>
    )
}

export default ApiDocsPage