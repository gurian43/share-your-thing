import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
    Skeleton,
    Dialog,
} from '@chakra-ui/react'
import { LuUpload, LuFolder, LuFile, LuDownload, LuTrash2, LuShare2, LuSearch, LuLayoutGrid, LuList, LuFileVideo, LuFileImage, LuFileSpreadsheet, LuFileAudio, LuFileArchive, LuFileText, LuInfinity } from 'react-icons/lu'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { toaster } from '../components/ui/toaster'

const DashboardPage = () => {
    const navigate = useNavigate()
    const [viewMode, setViewMode] = useState('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [files, setFiles] = useState([])
    const [filteredFiles, setFilteredFiles] = useState([])
    const [stats, setStats] = useState({
        totalStorage: 0,
        usedStorage: 0,
        totalStorageBytes: 0,
        usedStorageBytes: 0,
        filesCount: 0,
        sharedCount: 0,
        isAdmin: false,
    })
    const [loading, setLoading] = useState(true)
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const [shareDialogFile, setShareDialogFile] = useState(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteDialogFile, setDeleteDialogFile] = useState(null)

    useEffect(() => {
        document.title = "Dashboard - Share Your Thing"
        const fetchData = async () => {
            setLoading(true)
            try {
                const userRes = await fetch('/api/user/me', {
                    method: 'GET',
                    credentials: 'include',
                })
                const filesRes = await fetch('/api/user/files', {
                    method: 'GET',
                    credentials: 'include',
                })

                if (userRes.ok && filesRes.ok) {
                    const userData = await userRes.json()
                    const filesData = await filesRes.json()
                    
                    const formattedFiles = filesData.files.map(file => ({
                        id: file._id,
                        name: file.file_name,
                        size: file.file_size,
                        type: getFileType(file.file_name),
                        uploadedAt: new Date(file.uploaded_at).toISOString().split('T')[0],
                        shared: file.visibility !== 'private',
                        visibility: file.visibility,
                        shared_with_count: file.shared_with_count || 0,
                    }))

                    const totalStorageBytes = userData.user.max_storage
                    const usedStorageBytes = userData.user.current_storage
                    const sharedFilesCount = formattedFiles.filter(f => 
                        (f.shared_with_count > 0 || f.visibility === 'public' || f.visibility === 'unlisted')
                    ).length

                    setFiles(formattedFiles)
                    setFilteredFiles(formattedFiles)
                    const isAdmin = userData.user.admin
                    setStats({
                        totalStorage: isAdmin ? 'Unlimited' : formatBytes(totalStorageBytes),
                        usedStorage: formatBytes(usedStorageBytes),
                        totalStorageBytes: totalStorageBytes,
                        usedStorageBytes: usedStorageBytes,
                        filesCount: formattedFiles.length,
                        sharedCount: sharedFilesCount,
                        isAdmin: isAdmin,
                    })
                } else {
                    setFiles([])
                    setStats({
                        totalStorage: '- GB',
                        usedStorage: '- B',
                        filesCount: 0,
                        sharedCount: 0,
                        isAdmin: false,
                    })
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err)
                setFiles([])
                setStats({
                    totalStorage: '- GB',
                    usedStorage: '- B',
                    filesCount: 0,
                    sharedCount: 0,
                    isAdmin: false,
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleSearch = (query) => {
        setSearchQuery(query)
        setFilteredFiles(files.filter(file => file.name.toLowerCase().includes(query.toLowerCase())));
    }

    const handleUpload = () => {
        setUploadDialogOpen(true)
    }

    const handleDelete = (e, file) => {
        e.stopPropagation()
        setDeleteDialogFile(file)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteDialogFile) return
        setDeleteDialogOpen(false)
        
        const res = fetch(`/api/file/${deleteDialogFile.id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        toaster.promise(res, {
            success: {
                title: 'File deleted successfully!'
            },
            error: {
                title: 'Failed to delete file.'
            },
            loading: {
                title: 'Deleting file...'
            }
        })
        res.then(async (response) => {
            if (response.ok) {
                setFiles(prevFiles => prevFiles.filter(f => f.id !== deleteDialogFile.id))
                setFilteredFiles(prevFiles => prevFiles.filter(f => f.id !== deleteDialogFile.id))
                setStats(prevStats => {
                    const newUsedBytes = prevStats.usedStorageBytes - deleteDialogFile.size
                    return {
                        totalStorage: prevStats.totalStorage,
                        usedStorage: formatBytes(newUsedBytes),
                        totalStorageBytes: prevStats.totalStorageBytes,
                        usedStorageBytes: newUsedBytes,
                        filesCount: prevStats.filesCount - 1,
                        sharedCount: (deleteDialogFile.shared_with_count > 0 || deleteDialogFile.visibility === 'public' || deleteDialogFile.visibility === 'unlisted') ? prevStats.sharedCount - 1 : prevStats.sharedCount,
                    }
                })
                setDeleteDialogFile(null)
            }
        })
    }

    const handleShare = (e, file) => {
        e.stopPropagation()
        setShareDialogFile(file)
        setShareDialogOpen(true)
    }

    const formatBytes = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    const getFileType = (fileName) => {
        if (!fileName) return 'unknown';
        const ext = fileName.split('.').pop()?.toLowerCase();
        return ext || 'unknown';
    }

    const getFileIcon = (fileName) => {
        const iconProps = { size: 24 }
        const ext = getFileType(fileName);
        switch(ext) {
            case 'pdf':
            case 'doc':
            case 'docx':
            case 'txt':
            case 'rtf':
                return <LuFileText {...iconProps} />
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
            case 'svg':
                return <LuFileImage {...iconProps} />
            case 'mp4':
            case 'avi':
            case 'mov':
            case 'mkv':
            case 'webm':
                return <LuFileVideo {...iconProps} />
            case 'mp3':
            case 'wav':
            case 'ogg':
            case 'flac':
                return <LuFileAudio {...iconProps} />
            case 'zip':
            case 'rar':
            case '7z':
            case 'tar':
            case 'gz':
                return <LuFileArchive {...iconProps} />
            case 'xlsx':
            case 'xls':
            case 'csv':
                return <LuFileSpreadsheet {...iconProps} />
            default:
                return <LuFile {...iconProps} />
        }
    }

    return (
        <Box minH="100vh" bg="gray.900" display={"flex"} flexDirection="column" overflowX="hidden">
            <Header />

            <Container maxW="1400px" py={6} px={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                    {loading ? (
                        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
                            {[
                                { label: 'Total Storage', color: 'white' },
                                { label: 'Used Storage', color: 'purple.300' },
                                { label: 'Total Files', color: 'white' },
                                { label: 'Shared Files', color: 'white' },
                            ].map((item, idx) => (
                                <Card.Root key={idx} bg="gray.800" borderColor="gray.700">
                                    <Card.Body>
                                        <Text color="gray.400" fontSize="sm">{item.label}</Text>
                                        <Skeleton height="26px" width="70%" mt={2} />
                                    </Card.Body>
                                </Card.Root>
                            ))}
                        </Grid>
                    ) : (
                        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
                            <Card.Root bg="gray.800" borderColor="gray.700">
                                <Card.Body>
                                    <Text color="gray.400" fontSize="sm">Total Storage</Text>
                                    {stats.isAdmin ? (
                                        <HStack spacing={2} mt={2}>
                                            <LuInfinity size={28} color="white" />
                                            <Text color="white" fontSize="2xl" fontWeight="bold">Unlimited</Text>
                                        </HStack>
                                    ) : (
                                        <Text color="white" fontSize="2xl" fontWeight="bold">{stats.totalStorage}</Text>
                                    )}
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
                    )}

                    <Card.Root bg="gray.800" borderColor="gray.700">
                        <Card.Body>
                            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                                <Button
                                    bg="purple.600"
                                    color="white"
                                    _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                                    onClick={handleUpload}
                                >
                                    <LuUpload />
                                    Upload File
                                </Button>

                                <HStack spacing={3}>
                                    <Box position="relative" maxW={{ base: '100%', md: '300px' }} w="full">
                                        <Input
                                            placeholder="Search files..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            bg="gray.700"
                                            borderColor="gray.600"
                                            color="white"
                                            _placeholder={{ color: 'gray.400' }}
                                            pl={10}
                                        />
                                        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                                            <LuSearch color="white" />
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

                    {loading ? (
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
                    ) : viewMode === 'grid' ? (
                        files.length === 0 ? (
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
                                                Upload your first file to get started. You have 5 GB of storage available.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        ) : (
                        <Grid templateColumns={{ base: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(auto-fill, minmax(200px, 1fr))' }} gap={4}>
                            {filteredFiles.map((file) => (
                                <Card.Root
                                    key={file.id}
                                    bg="gray.800"
                                    borderColor="gray.700"
                                    cursor="pointer"
                                    _hover={{ borderColor: 'purple.500', boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)' }}
                                    transition="all 0.2s"
                                    onClick={() => navigate(`/file/${file.id}`)}
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
                                                    {(
                                                        file.shared_with_count > 0 ||
                                                        file.visibility === 'public' ||
                                                        file.visibility === 'unlisted'
                                                    ) && (
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
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <LuDownload size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'purple.300', bg: 'gray.700' }}
                                                    onClick={(e) => handleShare(e, file)}
                                                >
                                                    <LuShare2 size={16} />
                                                </IconButton>
                                                <IconButton
                                                    size="xs"
                                                    variant="ghost"
                                                    color="gray.400"
                                                    _hover={{ color: 'red.300', bg: 'gray.700' }}
                                                    onClick={(e) => handleDelete(e, file)}
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
                    ) : (
                        files.length === 0 ? (
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
                                                Upload your first file to get started. You have 5 GB of storage available.
                                            </Text>
                                        </VStack>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
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
                                                onClick={() => navigate(`/file/${file.id}`)}
                                            >
                                                <HStack flex="1" spacing={3}>
                                                    <Box color="purple.300">
                                                        {getFileIcon(file.type)}
                                                    </Box>
                                                    <Text color="white" fontSize="sm">{file.name}</Text>
                                                </HStack>

                                                <Text w="120px" color="gray.400" fontSize="sm">{formatBytes(file.size)}</Text>
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
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <LuDownload size={16} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="xs"
                                                        variant="ghost"
                                                        color="gray.400"
                                                        _hover={{ color: 'purple.300' }}
                                                        onClick={(e) => handleShare(e, file)}
                                                    >
                                                        <LuShare2 size={16} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="xs"
                                                        variant="ghost"
                                                        color="gray.400"
                                                        _hover={{ color: 'red.300' }}
                                                        onClick={(e) => handleDelete(e, file)}
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
                    )}
                </VStack>
            </Container>

            <Dialog.Root open={uploadDialogOpen} onOpenChange={(e) => setUploadDialogOpen(e.open)} zIndex={9999}>
                <Dialog.Backdrop/>
                <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                    <Dialog.Header>
                        <Dialog.Title color="white">Upload File</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack spacing={4} align="stretch">
                            <Input placeholder="File name" bg="gray.700" borderColor="gray.600" color="white" />
                            <Input placeholder="File description" bg="gray.700" borderColor="gray.600" color="white" />
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="outline" color="white" _hover={{color: "black"}} onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
                        <Button bg="purple.600" color="white" onClick={() => setUploadDialogOpen(false)}>Upload</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger />
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={shareDialogOpen} onOpenChange={(e) => setShareDialogOpen(e.open)} zIndex={9999}>
                <Dialog.Backdrop />
                <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                    <Dialog.Header>
                        <Dialog.Title color="white">Share File: {shareDialogFile?.name}</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <VStack spacing={4} align="stretch">
                            <Input placeholder="Share with email or username" bg="gray.700" borderColor="gray.600" color="white" />
                        </VStack>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button variant="outline" color="white" _hover={{color: "black"}} onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                        <Button bg="purple.600" color="white" onClick={() => setShareDialogOpen(false)}>Share</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger />
                </Dialog.Content>
            </Dialog.Root>

            <Dialog.Root open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)} zIndex={9999}>
                <Dialog.Backdrop />
                <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                    <Dialog.Body>
                        <VStack spacing={6} align="center" justify="center" py={8}>
                            <Heading size="lg" color="white" textAlign="center">
                                Are you really sure you want to delete <Text as="span" fontWeight="bold" color="red.400">{deleteDialogFile?.name}</Text>?
                            </Heading>
                            <HStack spacing={4}>
                                <Button variant="outline" color="white" _hover={{color: "black"}} onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                                <Button bg="red.600" color="white" onClick={confirmDelete} _hover={{ bg: 'red.500' }}>Delete</Button>
                            </HStack>
                        </VStack>
                    </Dialog.Body>
                </Dialog.Content>
            </Dialog.Root>

            <Footer />
        </Box>
    )
}

export default DashboardPage