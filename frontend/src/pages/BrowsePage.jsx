import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Box, Button, Card, Container, Flex, Grid, Heading, HStack, Input, Separator, Skeleton, Text, VStack } from '@chakra-ui/react'
import { LuArrowLeft, LuArrowRight, LuLock, LuLockOpen, LuRefreshCw, LuSearch, LuTrendingUp } from 'react-icons/lu'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { toaster } from '../components/ui/toaster'
import { formatBytes, getFileIcon, trimFileName } from '../utils/fileUtils'

const BrowsePage = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('score')
    const [sortOrder, setSortOrder] = useState('desc')
    const [passwordFilter, setPasswordFilter] = useState('all')
    const [limit, setLimit] = useState(12)
    const [page, setPage] = useState(1)
    const [files, setFiles] = useState([])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    })

    useEffect(() => {
        document.title = 'Browse - Share Your Thing'
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setSearchQuery(searchInput.trim())
            setPage(1)
        }, 350)

        return () => clearTimeout(timeoutId)
    }, [searchInput])

    const loadPublicFiles = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                sortBy,
                sortOrder,
                passwordFilter,
                page: String(page),
                limit: String(limit),
            })

            const res = await fetch(`/api/file/public?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
            })

            if (!res.ok) {
                throw new Error('Failed to load public files')
            }

            const data = await res.json()
            setFiles(data.files || [])
            setPagination(data.pagination || {
                page,
                limit,
                total: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })
        } catch {
            setFiles([])
            setPagination({
                page: 1,
                limit,
                total: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            })
            toaster.create({
                title: 'Could not load public files.',
                type: 'error',
                duration: 3000,
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadPublicFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, sortBy, sortOrder, passwordFilter, page, limit])

    const totalLabel = useMemo(() => {
        if (pagination.total === 0) return 'No public files found'
        if (pagination.total === 1) return '1 public file found'
        return `${pagination.total} public files found`
    }, [pagination.total])

    const handleRefresh = () => {
        loadPublicFiles()
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
            <Header />

            <Container maxW="1400px" py={8} px={{ base: 4, md: 6 }} flex="1">
                <VStack align="stretch" spacing={5}>
                    <VStack align="flex-start" spacing={2}>
                        <Heading size="lg" color="white">Browse Public Files</Heading>
                        <Text color="gray.400" fontSize="sm">Discover files shared publicly by the community.</Text>
                    </VStack>

                    <Card.Root bg="gray.800" borderColor="gray.700">
                        <Card.Body>
                            <Flex gap={3} direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }}>
                                <Box position="relative" flex="1">
                                    <Input
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        placeholder="Search by file name"
                                        bg="gray.700"
                                        borderColor="gray.600"
                                        color="white"
                                        _placeholder={{ color: 'gray.400' }}
                                        pl={10}
                                    />
                                    <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="gray.400">
                                        <LuSearch />
                                    </Box>
                                </Box>

                                <HStack spacing={3} flexWrap="wrap">
                                    <Box
                                        as="select"
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value)
                                            setPage(1)
                                        }}
                                        bg="gray.700"
                                        color="white"
                                        border="1px solid"
                                        borderColor="gray.600"
                                        borderRadius="md"
                                        px={3}
                                        h="40px"
                                    >
                                        <option value="date">Sort: Date</option>
                                        <option value="score">Sort: Score</option>
                                        <option value="size">Sort: File Size</option>
                                    </Box>

                                    <Box
                                        as="select"
                                        value={sortOrder}
                                        onChange={(e) => {
                                            setSortOrder(e.target.value)
                                            setPage(1)
                                        }}
                                        bg="gray.700"
                                        color="white"
                                        border="1px solid"
                                        borderColor="gray.600"
                                        borderRadius="md"
                                        px={3}
                                        h="40px"
                                    >
                                        <option value="desc">{sortBy === 'date' ? 'Newest first' : 'Descending'}</option>
                                        <option value="asc">{sortBy === 'date' ? 'Oldest first' : 'Ascending'}</option>
                                    </Box>

                                    <Box
                                        as="select"
                                        value={passwordFilter}
                                        onChange={(e) => {
                                            setPasswordFilter(e.target.value)
                                            setPage(1)
                                        }}
                                        bg="gray.700"
                                        color="white"
                                        border="1px solid"
                                        borderColor="gray.600"
                                        borderRadius="md"
                                        px={3}
                                        h="40px"
                                    >
                                        <option value="all">All files</option>
                                        <option value="protected">Password: Protected</option>
                                        <option value="unprotected">Password: Not protected</option>
                                    </Box>

                                    <Box
                                        as="select"
                                        value={limit}
                                        onChange={(e) => {
                                            setLimit(parseInt(e.target.value, 10))
                                            setPage(1)
                                        }}
                                        bg="gray.700"
                                        color="white"
                                        border="1px solid"
                                        borderColor="gray.600"
                                        borderRadius="md"
                                        px={3}
                                        h="40px"
                                    >
                                        <option value={12}>12 / page</option>
                                        <option value={24}>24 / page</option>
                                        <option value={36}>36 / page</option>
                                    </Box>

                                    <Button
                                        variant="outline"
                                        borderColor="gray.600"
                                        color="gray.200"
                                        _hover={{ bg: 'gray.700', color: 'white' }}
                                        onClick={handleRefresh}
                                        disabled={loading}
                                    >
                                        <LuRefreshCw />
                                    </Button>
                                </HStack>
                            </Flex>
                        </Card.Body>
                    </Card.Root>

                    <HStack justify="space-between" color="gray.400" fontSize="sm">
                        <Text>{totalLabel}</Text>
                        <Text>Page {pagination.page} of {pagination.totalPages}</Text>
                    </HStack>

                    {loading ? (
                        <Grid templateColumns={{ base: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }} gap={4}>
                            {Array.from({ length: limit }).map((_, idx) => (
                                <Card.Root key={`browse-skeleton-${idx}`} bg="gray.800" borderColor="gray.700">
                                    <Card.Body>
                                        <VStack align="stretch" spacing={3}>
                                            <Skeleton height="20px" />
                                            <Skeleton height="16px" />
                                            <Skeleton height="16px" />
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            ))}
                        </Grid>
                    ) : files.length > 0 ? (
                        <Grid templateColumns={{ base: 'repeat(1, minmax(0, 1fr))', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }} gap={4}>
                            {files.map((file) => (
                                <Card.Root
                                    key={file._id}
                                    bg="gray.800"
                                    borderColor="gray.700"
                                    cursor="pointer"
                                    _hover={{ borderColor: 'purple.500', boxShadow: '0 0 18px rgba(168, 85, 247, 0.28)' }}
                                    transition="all 0.2s"
                                    onClick={() => navigate(`/file/${file._id}?from=browse`, { state: { from: 'browse' } })}
                                >
                                    <Card.Body>
                                        <VStack align="stretch" spacing={3}>
                                            <Flex justify="space-between" align="start">
                                                <Box color="purple.300">
                                                    {getFileIcon(file.file_name)}
                                                </Box>
                                                <HStack spacing={2}>
                                                    <Badge colorPalette="green" fontSize="xs">Public</Badge>
                                                    <Box
                                                        color={file.password ? 'orange.300' : 'gray.500'}
                                                        title={file.password ? 'Password protected' : 'Not password protected'}
                                                    >
                                                        {file.password ? <LuLock size={14} /> : <LuLockOpen size={14} />}
                                                    </Box>
                                                </HStack>
                                            </Flex>

                                            <VStack align="start" spacing={1}>
                                                <Text
                                                    color="white"
                                                    fontSize="sm"
                                                    fontWeight="semibold"
                                                    noOfLines={1}
                                                    title={trimFileName(file.file_name, 30).trimmed ? file.file_name : undefined}
                                                >
                                                    {trimFileName(file.file_name, 30).name}
                                                </Text>
                                                <Text color="gray.400" fontSize="xs" noOfLines={1}>
                                                    by {file.owner?.username || 'Unknown'}
                                                </Text>
                                            </VStack>

                                            <Separator borderColor="gray.700" />

                                            <VStack align="stretch" spacing={1} color="gray.300" fontSize="xs">
                                                <HStack justify="space-between">
                                                    <Text>Size</Text>
                                                    <Text>{formatBytes(file.file_size)}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <Text>Uploaded</Text>
                                                    <Text>{formatDate(file.uploaded_at)}</Text>
                                                </HStack>
                                                <HStack justify="space-between">
                                                    <HStack spacing={1}>
                                                        <LuTrendingUp size={12} />
                                                        <Text>Score</Text>
                                                    </HStack>
                                                    <Text>{file.score || 0}</Text>
                                                </HStack>
                                            </VStack>
                                        </VStack>
                                    </Card.Body>
                                </Card.Root>
                            ))}
                        </Grid>
                    ) : (
                        <Card.Root bg="gray.800" borderColor="gray.700">
                            <Card.Body>
                                <VStack py={8} spacing={2}>
                                    <Heading size="md" color="white">No files found</Heading>
                                    <Text color="gray.400" textAlign="center">Try changing your search query or sort options.</Text>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    )}

                    <Flex justify="center" pt={2}>
                        <HStack spacing={3}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor="gray.600"
                                color="gray.200"
                                _hover={{ bg: 'gray.700' }}
                                disabled={!pagination.hasPrevPage || loading}
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            >
                                <LuArrowLeft />
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor="gray.600"
                                color="gray.200"
                                _hover={{ bg: 'gray.700' }}
                                disabled={!pagination.hasNextPage || loading}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Next
                                <LuArrowRight />
                            </Button>
                        </HStack>
                    </Flex>
                </VStack>
            </Container>

            <Footer />
        </Box>
    )
}

export default BrowsePage