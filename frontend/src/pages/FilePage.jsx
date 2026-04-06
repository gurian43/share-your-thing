import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Box, Container, VStack, Button, Text, Grid } from '@chakra-ui/react'
import { LuArrowLeft } from 'react-icons/lu'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { toaster } from '../components/ui/toaster'
import FileSummary from '../components/file/FileSummary'
import FileInfoPanel from '../components/file/FileInfoPanel'
import FileDescriptionCard from '../components/file/FileDescriptionCard'
import FileDownloadActions from '../components/file/FileDownloadActions'
import DownloadPasswordDialog from '../components/file/DownloadPasswordDialog'
import FileReportDialog from '../components/file/FileReportDialog'
import ReportLoginDialog from '../components/file/ReportLoginDialog'
import { createDownloadTask } from '../utils/downloadUtils'

const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

const FilePage = () => {
    const { user } = useAuth()
    const { fileId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [timeRemaining, setTimeRemaining] = useState('')
    const [downloadState, setDownloadState] = useState('idle')
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
    const [downloadPassword, setDownloadPassword] = useState('')
    const [downloadProgress, setDownloadProgress] = useState(null)
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [reportLoginDialogOpen, setReportLoginDialogOpen] = useState(false)
    const [reportSubmitting, setReportSubmitting] = useState(false)
    const downloadTaskRef = useRef(null)
    const autoDownloadTriggeredRef = useRef(false)

    useEffect(() => {
        document.title = 'File - Share Your Thing'
        setLoading(true)
        const getFile = async (id) => {
            const res = await fetch(`/api/file/${id}`, {
                method: 'GET',
                credentials: 'include',
            })
            if (res.ok) {
                const data = await res.json()
                document.title = `${data.file.file_name}`
                return data.file
            }
            return null
        }

        getFile(fileId).then((fileData) => {
            setFile(fileData)
            setLoading(false)
        })
    }, [fileId])

    useEffect(() => {
        if (!file || autoDownloadTriggeredRef.current) return
        if (!location.state?.autoDownload) return

        autoDownloadTriggeredRef.current = true
        handleDownload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, location.state])

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

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const startDownload = async (password) => {
        if (!file || !file.active || downloadState === 'downloading') return false

        setDownloadProgress(null)
        const task = createDownloadTask({
            fileId,
            fileName: file.file_name,
            checksum: file.checksum,
            password,
            fileSize: file.file_size,
            onProgress: (progress) => {
                setDownloadProgress(progress)
            },
        })

        downloadTaskRef.current = task
        setDownloadState('downloading')

        let success = false
        try {
            await task.start()

            setFile(prevFile => ({
                ...prevFile,
                download_count: prevFile.download_count + 1
            }))

            if (file.max_downloads) {
                setFile(prevFile => ({
                    ...prevFile,
                    active: prevFile.download_count + 1 < file.max_downloads
                }))
            }

            toaster.create({
                title: 'Download ready!',
                type: 'success',
                duration: 3000,
            })
            success = true
        } catch (err) {
            if (err?.name !== 'AbortError') {
                toaster.create({
                    title: err?.message || 'Download failed',
                    type: 'error',
                    duration: 4000,
                })
            }
        } finally {
            downloadTaskRef.current = null
            setDownloadState('idle')
            setDownloadProgress(null)
        }

        return success
    }

    const handleDownload = () => {
        if (!file || !file.active) return

        if (file.password) {
            setPasswordDialogOpen(true)
            return
        }

        startDownload()
    }

    const handlePasswordDownload = async () => {
        const password = downloadPassword
        setPasswordDialogOpen(false)
        setDownloadPassword('')
        await startDownload(password)
    }

    const handlePause = () => {
        if (downloadState !== 'downloading') return
        downloadTaskRef.current?.pause()
        setDownloadState('paused')
    }

    const handleResume = () => {
        if (downloadState !== 'paused') return
        downloadTaskRef.current?.resume()
        setDownloadState('downloading')
    }

    const handleCancel = () => {
        if (downloadState !== 'downloading' && downloadState !== 'paused') return
        downloadTaskRef.current?.cancel()
        downloadTaskRef.current = null
        setDownloadState('idle')
        setDownloadProgress(null)
        toaster.create({
            title: 'Download cancelled',
            type: 'info',
            duration: 2000,
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

    const handleReport = () => {
        if (!user) {
            setReportLoginDialogOpen(true)
            return
        }
        setReportDialogOpen(true)
    }

    const handleReportLogin = () => {
        setReportLoginDialogOpen(false)
        navigate('/login')
    }

    const submitReport = async (reason, description) => {
        if (!file) return

        setReportSubmitting(true)
        try {
            const res = await fetch(`/api/file/${file._id}/report`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason, description }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit report')
            }

            setReportDialogOpen(false)
            toaster.create({
                title: 'Report submitted',
                type: 'success',
                duration: 3000,
            })
        } catch (err) {
            toaster.create({
                title: err?.message || 'Failed to submit report',
                type: 'error',
                duration: 4000,
            })
        } finally {
            setReportSubmitting(false)
        }
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
                    {user && (
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
                    )}

                    <FileSummary file={file} onShare={handleShare} onReport={handleReport} />

                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                        <FileInfoPanel
                            file={file}
                            timeRemaining={timeRemaining}
                            formatFileSize={formatBytes}
                            formatDate={formatDate}
                        />
                        <FileDescriptionCard description={file.description} />
                    </Grid>

                    <FileDownloadActions
                        file={file}
                        onDownload={handleDownload}
                        onPause={handlePause}
                        onResume={handleResume}
                        onCancel={handleCancel}
                        downloadState={downloadState}
                        downloadProgress={downloadProgress}
                    />
                </VStack>
            </Container>

            <DownloadPasswordDialog
                isOpen={passwordDialogOpen}
                password={downloadPassword}
                onPasswordChange={setDownloadPassword}
                onCancel={() => {
                    setPasswordDialogOpen(false)
                    setDownloadPassword('')
                }}
                onConfirm={handlePasswordDownload}
                isSubmitting={downloadState === 'downloading'}
            />

            <FileReportDialog
                isOpen={reportDialogOpen}
                fileName={file.file_name}
                onCancel={() => setReportDialogOpen(false)}
                onConfirm={submitReport}
                isSubmitting={reportSubmitting}
            />

            <ReportLoginDialog
                isOpen={reportLoginDialogOpen}
                onCancel={() => setReportLoginDialogOpen(false)}
                onLogin={handleReportLogin}
            />

            <Footer />
        </Box>
    )
}

export default FilePage