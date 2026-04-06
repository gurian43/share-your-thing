import { Button, Dialog, Input, VStack } from '@chakra-ui/react'

const ShareDialog = ({ isOpen, file, onClose }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onClose() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">Share File: {file?.name}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack spacing={4} align="stretch">
                        <Input placeholder="Share with email or username" bg="gray.700" borderColor="gray.600" color="white" />
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <Button variant="outline" color="white" borderColor="gray.600" _hover={{ bg: 'gray.700', color: 'white' }} onClick={onClose}>Cancel</Button>
                    <Button bg="purple.600" color="white" onClick={onClose}>Share</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default ShareDialog