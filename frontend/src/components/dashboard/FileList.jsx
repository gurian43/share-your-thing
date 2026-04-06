import { Box, Card, Flex, HStack, IconButton, Text, VStack, Badge } from '@chakra-ui/react'
import { LuDownload, LuShare2, LuTrash2 } from 'react-icons/lu'
import { formatBytes, getFileIcon, trimFileName } from '../../utils/fileUtils'

const noop = () => {}

const FileList = ({ files, onOpenFile, onShare = noop, onDelete = noop, onDownload = noop }) => {
    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body p={0}>
                <VStack spacing={0} align="stretch">
                    <Flex
                        px={4}
                        py={3}
                        borderBottom="1px"
                        borderColor="gray.700"
                        fontSize="sm"
                        color="gray.400"
                        fontWeight="medium"
                    >
                        <Box flex="1">Name</Box>
                        <Box w="120px">Size</Box>
                        <Box w="120px">Date</Box>
                        <Box w="100px">Status</Box>
                        <Box w="120px" textAlign="right">Actions</Box>
                    </Flex>

                    {files.map((file) => (
                        <Flex
                            key={file.id}
                            px={4}
                            py={3}
                            borderBottom="1px"
                            borderColor="gray.700"
                            _hover={{ bg: 'gray.700' }}
                            align="center"
                            cursor="pointer"
                            onClick={() => onOpenFile(file)}
                        >
                            <HStack flex="1" spacing={3}>
                                <Box color="purple.300">
                                    {getFileIcon(file.type)}
                                </Box>
                                <Text color="white" fontSize="sm" title={trimFileName(file.name, 40).trimmed ? file.name : undefined}>{trimFileName(file.name, 40).name}</Text>
                            </HStack>

                            <Text w="120px" color="gray.400" fontSize="sm">{formatBytes(file.size)}</Text>
                            <Text w="120px" color="gray.400" fontSize="sm">{file.uploadedAt}</Text>
                            <Box w="100px">
                                {!file.active ? (
                                    <Badge colorPalette="red" fontSize="xs">
                                        Inactive
                                    </Badge>
                                ) : file.shared ? (
                                    <HStack spacing={1} color="purple.300" fontSize="sm">
                                        <LuShare2 size={14} />
                                        <Text>Shared</Text>
                                    </HStack>
                                ) : null}
                            </Box>

                            <HStack w="120px" spacing={2} justify="flex-end">
                                <IconButton
                                    size="xs"
                                    variant="ghost"
                                    color="gray.400"
                                    _hover={{ color: 'purple.300' }}
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
                                    _hover={{ color: 'purple.300' }}
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
                                    _hover={{ color: 'red.300' }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(file)
                                    }}
                                >
                                    <LuTrash2 size={16} />
                                </IconButton>
                            </HStack>
                        </Flex>
                    ))}
                </VStack>
            </Card.Body>
        </Card.Root>
    )
}

export default FileList