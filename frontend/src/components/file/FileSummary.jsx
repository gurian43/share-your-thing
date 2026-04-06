import { Badge, Box, Card, HStack, Heading, IconButton, VStack } from '@chakra-ui/react'
import { LuThumbsDown, LuThumbsUp, LuShare2, LuFlag, LuFile, LuFileText, LuFileImage, LuFileVideo, LuFileAudio, LuFileArchive, LuFileSpreadsheet } from 'react-icons/lu'

const FileSummary = ({ file, onShare, onReport, onUpvote, onDownvote, userVote = 0, isVoteSubmitting = false, isOwnFile = false }) => {
    const score = Number(file?.score || 0)
    const scorePalette = score > 0 ? 'green' : score < 0 ? 'red' : 'gray'

    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body>
                <HStack spacing={4} align="start" flexWrap="wrap">
                    <Box color="purple.300" p={4} bg="gray.700" borderRadius="lg">
                        {getFileIcon(file.file_name, 48)}
                    </Box>
                    <VStack align="start" flex={1} spacing={2}>
                        <Heading size="xl" color="white">
                            {file.file_name}
                        </Heading>
                        <HStack spacing={2} flexWrap="wrap">
                            <Badge colorPalette="purple" textTransform="uppercase">
                                {getFileExtension(file.file_name)}
                            </Badge>
                            <Badge colorPalette={getVisibilityColor(file.visibility)} textTransform="capitalize">
                                {file.visibility}
                            </Badge>
                            <Badge colorPalette={scorePalette}>
                                Score: {score > 0 ? `+${score}` : score}
                            </Badge>
                            {file.password && (
                                <Badge colorPalette="orange">
                                    Password Protected
                                </Badge>
                            )}
                        </HStack>
                    </VStack>
                    <HStack spacing={2} flexWrap="wrap">
                        {!isOwnFile && (
                            <>
                                <IconButton
                                    variant="outline"
                                    colorPalette={userVote === 1 ? 'green' : 'gray'}
                                    onClick={onUpvote}
                                    disabled={isVoteSubmitting}
                                    _hover={{ bg: userVote === 1 ? 'green.600' : 'gray.700' }}
                                    aria-label="Upvote"
                                >
                                    <LuThumbsUp size={20} color='white' />
                                </IconButton>
                                <IconButton
                                    variant="outline"
                                    colorPalette={userVote === -1 ? 'red' : 'gray'}
                                    onClick={onDownvote}
                                    disabled={isVoteSubmitting}
                                    _hover={{ bg: userVote === -1 ? 'red.600' : 'gray.700' }}
                                    aria-label="Downvote"
                                >
                                    <LuThumbsDown size={20} color='white' />
                                </IconButton>
                            </>
                        )}
                        {onReport && (
                            <IconButton
                                variant="outline"
                                colorPalette="red"
                                onClick={onReport}
                                _hover={{ bg: 'red.600' }}
                            >
                                <LuFlag size={20} color='white' />
                            </IconButton>
                        )}
                        <IconButton
                            variant="outline"
                            colorPalette="purple"
                            onClick={onShare}
                            _hover={{ bg: 'purple.600' }}
                        >
                            <LuShare2 size={20} color='white' />
                        </IconButton>
                    </HStack>
                </HStack>
            </Card.Body>
        </Card.Root>
    )
}

const getFileExtension = (fileName) => {
    if (!fileName) return ''
    const parts = fileName.split('.')
    return parts.length > 1 ? parts.pop().toLowerCase() : fileName.toLowerCase()
}

const getFileIcon = (fileName, size = 24) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    const iconProps = { size }
    switch (ext) {
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

const getVisibilityColor = (visibility) => {
    switch (visibility) {
        case 'public': return 'green'
        case 'unlisted': return 'yellow'
        case 'private': return 'red'
        default: return 'gray'
    }
}

export default FileSummary