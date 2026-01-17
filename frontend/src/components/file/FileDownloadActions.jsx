import { Button, HStack } from '@chakra-ui/react'
import { LuDownload } from 'react-icons/lu'

const FileDownloadActions = ({ onDownload }) => {
    return (
        <HStack spacing={4} justify="center" pt={4}>
            <Button
                size="lg"
                bg="purple.600"
                color="white"
                onClick={onDownload}
                _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
            >
                <LuDownload />
                Download File
            </Button>
        </HStack>
    )
}

export default FileDownloadActions
