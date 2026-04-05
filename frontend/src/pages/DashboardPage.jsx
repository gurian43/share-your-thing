import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Container, VStack } from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import StatsGrid from '../components/dashboard/StatsGrid'
import DashboardControls from '../components/dashboard/DashboardControls'
import FileSkeletonGrid from '../components/dashboard/FileSkeletonGrid'
import FileEmptyState from '../components/dashboard/FileEmptyState'
import FileGrid from '../components/dashboard/FileGrid'
import FileList from '../components/dashboard/FileList'
import UploadDialog from '../components/dashboard/UploadDialog'
import ShareDialog from '../components/dashboard/ShareDialog'
import DeleteDialog from '../components/dashboard/DeleteDialog'
import { toaster } from '../components/ui/toaster'
import { formatBytes, getFileType } from '../utils/fileUtils'

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
    const minimumLoadingMs = 400

    const loadDashboard = async () => {
        const startedAt = Date.now()
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

                const formattedFiles = filesData.files.map((file) => ({
                    id: file._id,
                    name: file.file_name,
                    size: file.file_size,
                    type: getFileType(file.file_name),
                    uploadedAt: new Date(file.uploaded_at).toISOString().split('T')[0],
                    shared: file.visibility !== 'private',
                    visibility: file.visibility,
                    shared_with_count: file.shared_with_count || 0,
                    active: file.active,
                }))

                const totalStorageBytes = userData.user.max_storage
                const usedStorageBytes = userData.user.current_storage
                const sharedFilesCount = formattedFiles.filter(
                    (f) => f.shared_with_count > 0 || f.visibility === 'public' || f.visibility === 'unlisted'
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
        } catch {
            setFiles([])
            setStats({
                totalStorage: '- GB',
                usedStorage: '- B',
                filesCount: 0,
                sharedCount: 0,
                isAdmin: false,
            })
        } finally {
            const elapsed = Date.now() - startedAt
            if (elapsed < minimumLoadingMs) {
                await new Promise((resolve) => setTimeout(resolve, minimumLoadingMs - elapsed))
            }
            setLoading(false)
        }
    }

    useEffect(() => {
        document.title = 'Dashboard - Share Your Thing'
        loadDashboard()
    }, [])

    const handleSearch = (query) => {
        setSearchQuery(query)
        setFilteredFiles(files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase())))
    }

    const handleUpload = () => setUploadDialogOpen(true)

    const handleDelete = (file) => {
        setDeleteDialogFile(file)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteDialogFile) return
        setDeleteDialogOpen(false)

        const res = fetch(`/api/file/${deleteDialogFile.id}`, {
            method: 'DELETE',
            credentials: 'include',
        })

        toaster.promise(res, {
            success: {
                title: 'File deleted successfully!',
            },
            error: {
                title: 'Failed to delete file.',
            },
            loading: {
                title: 'Deleting file...',
            },
        })
        res.then(async (response) => {
            if (response.ok) {
                setFiles((prevFiles) => prevFiles.filter((f) => f.id !== deleteDialogFile.id))
                setFilteredFiles((prevFiles) => prevFiles.filter((f) => f.id !== deleteDialogFile.id))
                setStats((prevStats) => {
                    const newUsedBytes = prevStats.usedStorageBytes - deleteDialogFile.size
                    return {
                        totalStorage: prevStats.totalStorage,
                        usedStorage: formatBytes(newUsedBytes),
                        totalStorageBytes: prevStats.totalStorageBytes,
                        usedStorageBytes: newUsedBytes,
                        filesCount: prevStats.filesCount - 1,
                        sharedCount:
                            deleteDialogFile.shared_with_count > 0 ||
                            deleteDialogFile.visibility === 'public' ||
                            deleteDialogFile.visibility === 'unlisted'
                                ? prevStats.sharedCount - 1
                                : prevStats.sharedCount,
                        isAdmin: prevStats.isAdmin,
                    }
                })
                setDeleteDialogFile(null)
            }
        })
    }

    const handleShare = (file) => {
        setShareDialogFile(file)
        setShareDialogOpen(true)
    }

    const handleOpenFile = (file) => navigate(`/file/${file.id}`)

    const handleDownload = (file) => {
        navigate(`/file/${file.id}`, { state: { autoDownload: true } })
    }

    const hasResults = filteredFiles.length > 0
    const emptyMessage = searchQuery
        ? 'No files match your search yet.'
        : 'Upload your first file to get started. You have 5 GB of storage available.'

    return (
        <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column" overflowX="hidden">
            <Header />

            <Container maxW="1400px" py={6} px={{ base: 4, md: 6 }}>
                <VStack spacing={6} align="stretch">
                    <StatsGrid stats={stats} loading={loading} />

                    <DashboardControls
                        viewMode={viewMode}
                        onViewChange={setViewMode}
                        searchQuery={searchQuery}
                        onSearch={handleSearch}
                        onUpload={handleUpload}
                    />

                    {loading ? (
                        <FileSkeletonGrid />
                    ) : hasResults ? (
                        viewMode === 'grid' ? (
                            <FileGrid
                                files={filteredFiles}
                                onOpenFile={handleOpenFile}
                                onShare={handleShare}
                                onDelete={handleDelete}
                                onDownload={handleDownload}
                            />
                        ) : (
                            <FileList
                                files={filteredFiles}
                                onOpenFile={handleOpenFile}
                                onShare={handleShare}
                                onDelete={handleDelete}
                                onDownload={handleDownload}
                            />
                        )
                    ) : (
                        <FileEmptyState message={emptyMessage} />
                    )}
                </VStack>
            </Container>

            <UploadDialog
                isOpen={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
                onUploaded={() => loadDashboard()}
            />
            <ShareDialog isOpen={shareDialogOpen} file={shareDialogFile} onClose={() => setShareDialogOpen(false)} />
            <DeleteDialog
                isOpen={deleteDialogOpen}
                file={deleteDialogFile}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
            />

            <Footer />
        </Box>
    )
}

export default DashboardPage