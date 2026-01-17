import { Card, Heading, Separator, Text, VStack } from '@chakra-ui/react'

const FileDescriptionCard = ({ description }) => {
    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body>
                <VStack align="stretch" spacing={4}>
                    <Heading size="md" color="purple.300">
                        Description
                    </Heading>
                    <Separator />
                    <Text color="gray.300">
                        {description || 'No description provided.'}
                    </Text>
                </VStack>
            </Card.Body>
        </Card.Root>
    )
}

export default FileDescriptionCard
