import { useState } from 'react'
import {
    Box,
    Container,
    Heading,
    VStack,
    HStack,
    Button,
    Input,
    Text,
    IconButton,
    Grid,
    Card,
    Flex,
    Separator,
} from '@chakra-ui/react'
import { LuUpload, LuFolder, LuFile, LuDownload, LuTrash2, LuShare2, LuSearch, LuLayoutGrid, LuList, LuEllipsisVertical } from 'react-icons/lu'
import Header from '../components/Header'
import Footer from '../components/Footer'

const DashboardPage = () => {
    const [viewMode, setViewMode] = useState('grid')
    const [searchQuery, setSearchQuery] = useState('')

    // not real data
    const files = [
        { id: 1, name: 'Project Proposal.pdf', size: '2.4 MB', type: 'pdf', uploadedAt: '2025-12-08', shared: false },
        { id: 2, name: 'Vacation Photos', size: '156 MB', type: 'folder', uploadedAt: '2025-12-07', shared: true },
        { id: 3, name: 'Meeting Recording.mp4', size: '45.8 MB', type: 'video', uploadedAt: '2025-12-06', shared: false },
        { id: 4, name: 'Budget 2025.xlsx', size: '890 KB', type: 'excel', uploadedAt: '2025-12-05', shared: true },
        { id: 5, name: 'Logo Design.png', size: '3.2 MB', type: 'image', uploadedAt: '2025-12-04', shared: false },
        { id: 6, name: 'Source Code', size: '12.5 MB', type: 'folder', uploadedAt: '2025-12-03', shared: false },
    ]

    const stats = {
        totalStorage: '100 GB',
        usedStorage: '23.5 GB',
        filesCount: 342,
        sharedCount: 12,
    }

    const getFileIcon = (type) => {
        if (type === 'folder') return <LuFolder size={24} />
        return <LuFile size={24} />
    }

    return (
        <Box minH="100vh" bg="gray.900" display={"flex"} flexDirection="column" overflowX="hidden">
            <Header />

            <Container maxW="1400px" py={6} px={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                    <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <Text color="gray.400" fontSize="sm">Total Storage</Text>
                                <Text color="white" fontSize="2xl" fontWeight="bold">{stats.totalStorage}</Text>
                            </Card.Body>
                        </Card.Root>
                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <Text color="gray.400" fontSize="sm">Used Storage</Text>
                                <Text color="purple.300" fontSize="2xl" fontWeight="bold">{stats.usedStorage}</Text>
                            </Card.Body>
                        </Card.Root>
                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <Text color="gray.400" fontSize="sm">Total Files</Text>
                                <Text color="white" fontSize="2xl" fontWeight="bold">{stats.filesCount}</Text>
                            </Card.Body>
                        </Card.Root>
                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <Text color="gray.400" fontSize="sm">Shared Files</Text>
                                <Text color="white" fontSize="2xl" fontWeight="bold">{stats.sharedCount}</Text>
                            </Card.Body>
                        </Card.Root>
                    </Grid>

                    <Card.Root bg="gray.800" borderColor="gray.700">
                        <Card.Body>
                            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                                <Button
                                    bg="purple.600"
                                    color="white"
                                    _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                                >
                                    <LuUpload />
                                    Upload File
                                </Button>

                                <HStack spacing={3}>
                                    <Box position="relative" maxW={{ base: '100%', md: '300px' }} w="full">
                                        <Input
                                            placeholder="Search files..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            bg="gray.700"
                                            borderColor="gray.600"
                                            color="white"
                                            _placeholder={{ color: 'gray.400' }}
                                            pl={10}
                                        />
                                        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                                            <LuSearch color="gray.400" />
                                        </Box>
                                    </Box>

                                    <HStack spacing={1} bg="gray.700" borderRadius="md" p={1}>
                                        <IconButton
                                            size="sm"
                                            variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                                            colorScheme={viewMode === 'grid' ? 'purple' : 'gray'}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <LuLayoutGrid />
                                        </IconButton>
                                        <IconButton
                                            size="sm"
                                            variant={viewMode === 'list' ? 'solid' : 'ghost'}
                                            colorScheme={viewMode === 'list' ? 'purple' : 'gray'}
                                            onClick={() => setViewMode('list')}
                                        >
                                            <LuList />
                                        </IconButton>
                                    </HStack>
                                </HStack>
                            </Flex>
                        </Card.Body>
                    </Card.Root>

                    {viewMode === 'grid' ? (
                        <Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(auto-fill, minmax(200px, 1fr))' }} gap={4}>
                            {files.map((file) => (
                                <Card.Root
                                    key={file.id}
                                    bg="gray.800"
                                    borderColor="gray.700"
                                    cursor="pointer"
                                    _hover={{ borderColor: 'purple.500', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}
                                    transition="all 0.2s"
                                >
                                    <Card.Body>
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="start">
                                                <Box color="purple.300">
                                                    {getFileIcon(file.type)}
                                                </Box>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'white', bg: 'gray.700' }}
                                                >
                                                    <LuEllipsisVertical />
                                                </IconButton>
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
                                                    <Text>{file.size}</Text>
                                                    {file.shared && (
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
                                                >
                                                    <LuDownload size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'purple.300', bg: 'gray.700' }}
                                                >
                                                    <LuShare2 size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'red.300', bg: 'gray.700' }}
                                                >
                                                    <LuTrash2 size={16} />
                                                </IconButton>
                                            </HStack>
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            ))}
                        </Grid>
                    ) : (
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
                                            _hover={{ bg: 'gray.750' }}
                                            align="center"
                                            cursor="pointer"
                                        >
                                            <HStack flex="1" spacing={3}>
                                                <Box color="purple.300">
                                                    {getFileIcon(file.type)}
                                                </Box>
                                                <Text color="white" fontSize="sm">{file.name}</Text>
                                            </HStack>

                                            <Text w="120px" color="gray.400" fontSize="sm">{file.size}</Text>
                                            <Text w="120px" color="gray.400" fontSize="sm">{file.uploadedAt}</Text>
                                            <Box w="100px">
                                                {file.shared && (
                                                    <HStack spacing={1} color="purple.300" fontSize="sm">
                                                        <LuShare2 size={14} />
                                                        <Text>Shared</Text>
                                                    </HStack>
                                                )}
                                            </Box>

                                            <HStack w="120px" spacing={2} justify="flex-end">
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'purple.300' }}
                                                >
                                                    <LuDownload size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'purple.300' }}
                                                >
                                                    <LuShare2 size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'red.300' }}
                                                >
                                                    <LuTrash2 size={16} />
                                                </IconButton>
                                            </HStack>
                                        </Flex>
                                    ))}
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )}
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}

export default DashboardPage