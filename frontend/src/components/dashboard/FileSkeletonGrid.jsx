import { Card, Grid, Separator, Skeleton, VStack, Flex, HStack } from '@chakra-ui/react'

const FileSkeletonGrid = () => {
    return (
        <Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(auto-fill, minmax(200px, 1fr))' }} gap={4}>
            {Array.from({ length: 6 }).map((_, idx) => (
                <Card.Root key={idx} bg="gray.800" borderColor="gray.700">
                    <Card.Body>
                        <VStack align="stretch" spacing={3}>
                            <Flex justify="space-between" align="start">
                                <Skeleton height="32px" width="32px" borderRadius="md" />
                                <Skeleton height="20px" width="20px" borderRadius="full" />
                            </Flex>
                            <Skeleton height="18px" width="80%" />
                            <Skeleton height="14px" width="60%" />
                            <Separator />
                            <HStack spacing={2} justify="space-between">
                                <Skeleton height="20px" width="20px" borderRadius="md" />
                                <Skeleton height="20px" width="20px" borderRadius="md" />
                                <Skeleton height="20px" width="20px" borderRadius="md" />
                            </HStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ))}
        </Grid>
    )
}

export default FileSkeletonGrid
