import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box,
    Container,
    Heading,
    VStack,
    HStack,
    Button,
    Text,
    Grid,
    Card,
    IconButton,
    Separator,
    Badge,
} from '@chakra-ui/react'
import { 
    LuDownload, 
    LuShare2,
    LuFile, 
    LuFileText, 
    LuFileImage, 
    LuFileVideo, 
    LuFileAudio,
    LuFileArchive,
    LuFileSpreadsheet,
    LuArrowLeft,
    LuCalendar,
    LuHardDrive,
    LuUser
} from 'react-icons/lu'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'

const FilePage = () => {
    const { user } = useAuth()
    const { fileId } = useParams()
    const navigate = useNavigate()
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [timeRemaining, setTimeRemaining] = useState('')

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
    }

    const getFileExtension = (fileName) => {
        if (!fileName) return ''
        const parts = fileName.split('.')
        return parts.length > 1 ? parts.pop().toLowerCase() : ''
    }

    const getVisibilityColor = (visibility) => {
        switch(visibility) {
            case 'public': return 'green'
            case 'unlisted': return 'yellow'
            case 'private': return 'red'
            default: return 'gray'
        }
    }

    useEffect(() => {
        document.title = "File - Share Your Thing"
        setLoading(true)
        const getFile = async (fileId) => {
            const res = await fetch(`/api/file/${fileId}`, {
                method: 'GET',
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json()
                document.title = `${data.file.file_name}`
                return data.file;
            } else {
                return null;
            }
        }

        getFile(fileId).then(fileData => {
            setFile(fileData)
            setLoading(false)
        })
    }, [fileId])

    useEffect(() => {
        if (!file?.expires_at) return

        const updateTimer = () => {
            const now = new Date().getTime()
            const expiry = new Date(file.expires_at).getTime()
            const distance = expiry - now

            if (distance < 0) {
                setTimeRemaining('Expired')
                return
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24))
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((distance % (1000 * 60)) / 1000)

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`)
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
            } else if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s`)
            } else {
                setTimeRemaining(`${seconds}s`)
            }
        }

        updateTimer()
        const interval = setInterval(updateTimer, 1000)

        return () => clearInterval(interval)
    }, [file])

    const getFileIcon = (fileName) => {
        const iconProps = { size: 48 }
        const ext = getFileExtension(fileName)
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

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleDownload = () => {
        const downloadPromise = new Promise((resolve, reject) => {
            setTimeout(() => {
                Math.random() < 0.5 ? resolve() : reject(new Error('Download failed'))
            }, 1000)
        })
        
        toaster.promise(downloadPromise, {
            success: {
                title: 'Download started!'
            },
            error: {
                title: 'Failed to start download.'
            },
            loading: {
                title: 'Preparing your download...'
            }
        })
    }

    const handleShare = () => {
        const shareLink = `${window.location.origin}/file/${file._id}`
        navigator.clipboard.writeText(shareLink)
        toaster.create({
            title: 'Share link copied to clipboard!',
            type: 'success',
            duration: 3000,
        })
    }

    if (loading) {
        return (
            <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
                <Header />
                <Container maxW="1200px" py={20} flex={1}>
                    <Text color="gray.400" textAlign="center">Loading...</Text>
                </Container>
                <Footer />
            </Box>
        )
    }

    if (!file) {
        return (
            <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
                <Header />
                <Container maxW="1200px" py={20} flex={1}>
                    <Text color="gray.400" textAlign="center">File not found or is private :c</Text>
                </Container>
                <Footer />
            </Box>
        )
    }

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column" overflowX="hidden">
            <Header />

            <Container maxW="1200px" py={6} px={{ base: 4, md: 6 }} flex={1}>
                <VStack spacing={6} align="stretch">
                    {user &&
                    <Button
                        variant="ghost"
                        color="gray.400"
                        onClick={() => navigate('/dashboard')}
                        alignSelf="flex-start"
                        _hover={{ color: 'white', bg: 'gray.800' }}
                    >
                        <LuArrowLeft />
                        Back to Dashboard
                    </Button>
                    }

                    <Card.Root bg="gray.800" borderColor="gray.700">
                        <Card.Body>
                            <HStack spacing={4} align="start" flexWrap="wrap">
                                <Box color="purple.300" p={4} bg="gray.700" borderRadius="lg">
                                    {getFileIcon(file.file_name)}
                                </Box>
                                <VStack align="start" flex={1} spacing={2}>
                                    <Heading size="xl" color="white">
                                        {file.file_name}
                                    </Heading>
                                    <HStack spacing={2} flexWrap="wrap">
                                        <Badge colorScheme="purple" textTransform="uppercase">
                                            {getFileExtension(file.file_name)}
                                        </Badge>
                                        <Badge colorScheme={getVisibilityColor(file.visibility)} textTransform="capitalize">
                                            {file.visibility}
                                        </Badge>
                                        {file.password && (
                                            <Badge colorScheme="orange">
                                                Password Protected
                                            </Badge>
                                        )}
                                    </HStack>
                                </VStack>
                                <HStack spacing={2} flexWrap="wrap">
                                    <IconButton
                                        variant="outline"
                                        colorScheme="purple"
                                        onClick={handleShare}
                                        _hover={{ bg: 'purple.600' }}
                                    >
                                        <LuShare2 size={20} color='white' />
                                    </IconButton>
                                </HStack>
                            </HStack>
                        </Card.Body>
                    </Card.Root>

                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <VStack align="stretch" spacing={4}>
                                    <Heading size="md" color="purple.300">
                                        File Information
                                    </Heading>
                                    <Separator />
                                    <HStack justify="space-between">
                                        <HStack>
                                            <LuHardDrive size={20} color="gray" />
                                            <Text color="gray.400">Size</Text>
                                        </HStack>
                                        <Text color="white" fontWeight="bold">{formatFileSize(file.file_size)}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <HStack>
                                            <LuCalendar size={20} color="gray" />
                                            <Text color="gray.400">Uploaded</Text>
                                        </HStack>
                                        <Text color="white">{formatDate(file.uploaded_at)}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <HStack>
                                            <LuUser size={20} color="gray" />
                                            <Text color="gray.400">Owner</Text>
                                        </HStack>
                                        <Text color="white">{file.owner?.username || 'Unknown'}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <HStack>
                                            <LuDownload size={20} color="gray" />
                                            <Text color="gray.400">Downloads</Text>
                                        </HStack>
                                        <Text color="white" fontWeight="bold">
                                            {file.download_count}{file.max_downloads ? ` / ${file.max_downloads}` : ''}
                                        </Text>
                                    </HStack>
                                    {file.expires_at && (
                                        <HStack justify="space-between">
                                            <HStack>
                                                <LuCalendar size={20} color="gray" />
                                                <Text color="gray.400">Expires In</Text>
                                            </HStack>
                                            <Text color={timeRemaining === 'Expired' ? 'red.600' : 'red.400'} fontWeight="bold">
                                                {timeRemaining || 'Calculating...'}
                                            </Text>
                                        </HStack>
                                    )}
                                </VStack>
                            </Card.Body>
                        </Card.Root>

                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <VStack align="stretch" spacing={4}>
                                    <Heading size="md" color="purple.300">
                                        Description
                                    </Heading>
                                    <Separator />
                                    <Text color="gray.300">
                                        {file.description || 'No description provided.'}
                                    </Text>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    </Grid>

                    <HStack spacing={4} justify="center" pt={4}>
                        <Button
                            size="lg"
                            bg="purple.600"
                            color="white"
                            onClick={handleDownload}
                            _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                        >
                            <LuDownload />
                            Download File
                        </Button>
                    </HStack>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}

export default FilePage