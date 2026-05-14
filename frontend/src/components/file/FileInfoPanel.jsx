import { useNavigate } from 'react-router-dom'
import { Avatar, Card, HStack, Heading, Separator, Text, VStack } from '@chakra-ui/react'
import { LuCalendar, LuDownload, LuHardDrive, LuUser, LuFile } from 'react-icons/lu'

const InfoRow = ({ icon, label, value, valueColor = 'white' }) => (
    <HStack justify="space-between">
        <HStack>
            {icon}
            <Text color="gray.400">{label}</Text>
        </HStack>
        <Text color={valueColor} fontWeight="bold">{value}</Text>
    </HStack>
)

const FileInfoPanel = ({ file, timeRemaining, formatFileSize, formatDate, profileReturnTo = null }) => {
    const navigate = useNavigate()

    const goToOwnerProfile = () => {
        const ownerId = file.owner?._id
        if (ownerId) {
            navigate(`/profile/${ownerId}`, { state: profileReturnTo ? { returnTo: profileReturnTo } : undefined })
        }
    }

    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body>
                <VStack align="stretch" spacing={4}>
                    <Heading size="md" color="purple.300">
                        File Information
                    </Heading>
                    <Separator />
                    <InfoRow
                        icon={<LuFile size={20} color="gray" />}
                        label="Original Name"
                        value={file.original_file_name || file.file_name}
                    />
                    <InfoRow
                        icon={<LuHardDrive size={20} color="gray" />}
                        label="Size"
                        value={formatFileSize(file.file_size)}
                    />
                    <InfoRow
                        icon={<LuCalendar size={20} color="gray" />}
                        label="Uploaded"
                        value={formatDate(file.uploaded_at)}
                    />
                    <HStack justify="space-between">
                        <HStack>
                            <LuUser size={20} color="gray" />
                            <Text color="gray.400">Owner</Text>
                        </HStack>
                        <HStack spacing={2}>
                            <Avatar.Root size="xs" colorPalette="purple">
                                <Avatar.Fallback name={file.owner?.username || 'Unknown'} />
                                {file.owner?.profile?.avatar_url && (
                                    <Avatar.Image src={file.owner.profile.avatar_url} alt={file.owner?.username || 'Unknown'} />
                                )}
                            </Avatar.Root>
                            <Text
                                color="purple.200"
                                fontWeight="bold"
                                cursor={file.owner?._id ? 'pointer' : 'default'}
                                _hover={file.owner?._id ? { color: 'purple.100', textDecoration: 'underline' } : undefined}
                                onClick={goToOwnerProfile}
                            >
                                {file.owner?.username || 'Unknown'}
                            </Text>
                        </HStack>
                    </HStack>
                    <InfoRow
                        icon={<LuDownload size={20} color="gray" />}
                        label="Downloads"
                        value={`${file.download_count}${file.max_downloads ? ` / ${file.max_downloads}` : ''}`}
                        valueColor={
                            file.max_downloads && file.download_count >= file.max_downloads
                                ? 'red.600'
                                : file.max_downloads && (file.max_downloads - file.download_count) / file.max_downloads < 0.2
                                ? 'yellow.400'
                                : 'white'
                        }
                    />
                    {file.expires_at && (
                        <InfoRow
                            icon={<LuCalendar size={20} color="gray" />}
                            label="Expires In"
                            value={timeRemaining || 'Calculating...'}
                            valueColor={timeRemaining === 'Expired' ? 'red.600' : 'red.400'}
                        />
                    )}
                </VStack>
            </Card.Body>
        </Card.Root>
    )
}

export default FileInfoPanel