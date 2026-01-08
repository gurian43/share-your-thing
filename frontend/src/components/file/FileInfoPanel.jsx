import { Card, HStack, Heading, Separator, Text, VStack } from '@chakra-ui/react'
import { LuCalendar, LuDownload, LuHardDrive, LuUser } from 'react-icons/lu'

const InfoRow = ({ icon, label, value, valueColor = 'white' }) => (
    <HStack justify="space-between">
        <HStack>
            {icon}
            <Text color="gray.400">{label}</Text>
        </HStack>
        <Text color={valueColor} fontWeight="bold">{value}</Text>
    </HStack>
)

const FileInfoPanel = ({ file, timeRemaining, formatFileSize, formatDate }) => {
    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body>
                <VStack align="stretch" spacing={4}>
                    <Heading size="md" color="purple.300">
                        File Information
                    </Heading>
                    <Separator />
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
                    <InfoRow
                        icon={<LuUser size={20} color="gray" />}
                        label="Owner"
                        value={file.owner?.username || 'Unknown'}
                    />
                    <InfoRow
                        icon={<LuDownload size={20} color="gray" />}
                        label="Downloads"
                        value={`${file.download_count}${file.max_downloads ? ` / ${file.max_downloads}` : ''}`}
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
