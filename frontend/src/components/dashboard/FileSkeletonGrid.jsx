import { Box, Card, Grid, Separator, VStack, Flex, HStack } from '@chakra-ui/react'

const Placeholder = (props) => (
    <Box bg="gray.700" opacity={0.8} borderRadius="md" {...props} />
)

const FileSkeletonGrid = () => {
    return (
        <Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(auto-fill, minmax(200px, 1fr))' }} gap={4}>
            {Array.from({ length: 6 }).map((_, idx) => (
                <Card.Root key={idx} bg="gray.800" borderColor="gray.700">
                    <Card.Body>
                        <VStack align="stretch" spacing={3}>
                            <Flex justify="space-between" align="start">
                                <Placeholder h="32px" w="32px" />
                                <Placeholder h="20px" w="20px" borderRadius="full" />
                            </Flex>
                            <Placeholder h="18px" w="80%" />
                            <Placeholder h="14px" w="60%" />
                            <Separator />
                            <HStack spacing={2} justify="space-between">
                                <Placeholder h="20px" w="20px" />
                                <Placeholder h="20px" w="20px" />
                                <Placeholder h="20px" w="20px" />
                            </HStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ))}
        </Grid>
    )
}

export default FileSkeletonGrid
