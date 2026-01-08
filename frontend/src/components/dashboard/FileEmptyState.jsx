import { Box, Card, Heading, Text, VStack } from '@chakra-ui/react'
import { LuFolder } from 'react-icons/lu'

const FileEmptyState = ({ message = 'Upload your first file to get started. You have 5 GB of storage available.' }) => {
    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body>
                <VStack spacing={4} py={12} align="center" justify="center">
                    <Box color="gray.600" fontSize="48px">
                        <LuFolder />
                    </Box>
                    <VStack spacing={2} align="center">
                        <Heading size="lg" color="gray.400">
                            No files yet
                        </Heading>
                        <Text color="gray.500" textAlign="center">
                            {message}
                        </Text>
                    </VStack>
                </VStack>
            </Card.Body>
        </Card.Root>
    )
}

export default FileEmptyState
