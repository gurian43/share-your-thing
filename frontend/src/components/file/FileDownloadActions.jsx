import { Button, HStack } from '@chakra-ui/react'
import { LuDownload } from 'react-icons/lu'
import { Tooltip } from '../ui/Tooltip'

const FileDownloadActions = ({ onDownload, file }) => {
    return (
        <HStack spacing={4} justify="center" pt={4}>
            <Tooltip content={file.active ? "Download the file" : "This file is no longer available for download"}>
                <Button
                    size="lg"
                    bg="purple.600"
                    color="white"
                    onClick={onDownload}
                    disabled={!file.active}
                    _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                >
                    <LuDownload />
                    Download File
                </Button>     
            </Tooltip>
        </HStack>
    )
}

export default FileDownloadActions