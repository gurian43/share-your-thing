import { Box, Card, Flex, Grid, HStack, IconButton, Separator, Text, VStack } from '@chakra-ui/react'
import { LuDownload, LuShare2, LuTrash2 } from 'react-icons/lu'
import { formatBytes, getFileIcon } from '../../utils/fileUtils'

const noop = () => {}

const FileGrid = ({ files, onOpenFile, onShare = noop, onDelete = noop, onDownload = noop }) => {
    return (
        <Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(auto-fill, minmax(200px, 1fr))' }} gap={4}>
            {files.map((file) => (
                <Card.Root
                    key={file.id}
                    bg="gray.800"
                    borderColor="gray.700"
                    cursor="pointer"
                    _hover={{ borderColor: 'purple.500', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}
                    transition="all 0.2s"
                    onClick={() => onOpenFile(file)}
                >
                    <Card.Body>
                        <VStack align="stretch" spacing={3}>
                            <Flex justify="space-between" align="start">
                                <Box color="purple.300">
                                    {getFileIcon(file.type)}
                                </Box>
                            </Flex>

                            <VStack align="start" spacing={1}>
                                <Text
                                    color="white"
                                    fontSize="sm"
                                    fontWeight="medium"
                                    noOfLines={1}
                                >
                                    {file.name}
                                </Text>
                                <HStack spacing={2} fontSize="xs" color="gray.400">
                                    <Text>{formatBytes(file.size)}</Text>
                                    {(file.shared_with_count > 0 || file.visibility === 'public' || file.visibility === 'unlisted') && (
                                        <>
                                            <Text>•</Text>
                                            <HStack spacing={1}>
                                                <LuShare2 size={12} />
                                                <Text>Shared</Text>
                                            </HStack>
                                        </>
                                    )}
                                </HStack>
                            </VStack>

                            <Separator />

                            <HStack spacing={2} justify="space-between">
                                <IconButton
                                    size="xs"
                                    variant="ghost"
                                    color="gray.400"
                                    _hover={{ color: 'purple.300', bg: 'gray.700' }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDownload(file)
                                    }}
                                >
                                    <LuDownload size={16} />
                                </IconButton>
                                <IconButton
                                    size="xs"
                                    variant="ghost"
                                    color="gray.400"
                                    _hover={{ color: 'purple.300', bg: 'gray.700' }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onShare(file)
                                    }}
                                >
                                    <LuShare2 size={16} />
                                </IconButton>
                                <IconButton
                                    size="xs"
                                    variant="ghost"
                                    color="gray.400"
                                    _hover={{ color: 'red.300', bg: 'gray.700' }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(file)
                                    }}
                                >
                                    <LuTrash2 size={16} />
                                </IconButton>
                            </HStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            ))}
        </Grid>
    )
}

export default FileGrid
