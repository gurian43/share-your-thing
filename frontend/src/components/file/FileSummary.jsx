import { Badge, Box, Card, HStack, Heading, IconButton, VStack } from '@chakra-ui/react'
import { LuShare2, LuFile, LuFileText, LuFileImage, LuFileVideo, LuFileAudio, LuFileArchive, LuFileSpreadsheet } from 'react-icons/lu'

const FileSummary = ({ file, onShare }) => {
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