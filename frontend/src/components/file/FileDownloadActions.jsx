import { Button, HStack, VStack, Text, Progress } from '@chakra-ui/react'
import { LuDownload, LuPause, LuPlay, LuX } from 'react-icons/lu'
import { Tooltip } from '../ui/tooltip'

import { formatBytes } from '../../utils/fileUtils'


const FileDownloadActions = ({ onDownload, onPause, onResume, onCancel, file, downloadState, downloadProgress }) => {
    const isDownloading = downloadState === 'downloading'
    const isPaused = downloadState === 'paused'
    const hasProgress = downloadProgress && (isDownloading || isPaused)

    return (
        <VStack spacing={4} align="stretch" pt={4}>
            {hasProgress && (
                <VStack spacing={2} bg="gray.800" p={4} borderRadius="md" borderWidth="1px" borderColor="gray.700">
                    <HStack justify="space-between" w="full">
                        <Text color="gray.300" fontSize="sm">
                            {downloadProgress.downloadedBytes && downloadProgress.totalBytes
                                ? `${formatBytes(downloadProgress.downloadedBytes)} / ${formatBytes(downloadProgress.totalBytes)}`
                                : formatBytes(downloadProgress.downloadedBytes || 0)}
                            {downloadProgress.speed ? ` (${formatBytes(downloadProgress.speed)}/s)` : ' (0B/s)'}
                        </Text>
                        <Text color="purple.300" fontWeight="bold" fontSize="sm">
                            {downloadProgress.percent ? `${Math.round(downloadProgress.percent)}%` : '0%'}
                        </Text>
                    </HStack>

                    <Progress.Root
                        value={downloadProgress.percent || 0}
                        max={100}
                        colorPalette="purple"
                        size="sm"
                        w="full"
                    >
                        <Progress.Track>
                            <Progress.Range />
                        </Progress.Track>
                    </Progress.Root>
                </VStack>
            )}
            <HStack spacing={4} justify="center">
            <Tooltip content={file.active ? "Download the file" : "This file is no longer available for download"}>
                <Button
                    size="lg"
                    bg="purple.600"
                    color="white"
                    onClick={onDownload}
                    disabled={!file.active || isDownloading || isPaused}
                    loading={isDownloading}
                    loadingText="Downloading"
                    _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                >
                    <LuDownload />
                    Download File
                </Button>     
            </Tooltip>
            {isDownloading && (
                <Button
                    size="lg"
                    variant="outline"
                    color="gray.200"
                    onClick={onPause}
                    _hover={{ bg: 'gray.700' }}
                >
                    <LuPause />
                    Pause
                </Button>
            )}
            {isPaused && (
                <Button
                    size="lg"
                    variant="outline"
                    color="gray.200"
                    onClick={onResume}
                    _hover={{ bg: 'gray.700' }}
                >
                    <LuPlay />
                    Resume
                </Button>
            )}
            {(isDownloading || isPaused) && (
                <Button
                    size="lg"
                    variant="solid"
                    colorPalette="red"
                    onClick={onCancel}
                    _hover={{ bg: 'red.500' }}
                >
                    <LuX />
                    Cancel
                </Button>
            )}
            </HStack>
        </VStack>
    )
}

export default FileDownloadActions