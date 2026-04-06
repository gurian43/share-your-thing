import { Button, Dialog, Heading, HStack, Text, VStack } from '@chakra-ui/react'

const DeleteDialog = ({ isOpen, file, onCancel, onConfirm }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onCancel() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Body>
                    <VStack spacing={6} align="center" justify="center" py={8}>
                        <Heading size="lg" color="white" textAlign="center">
                            Are you really sure you want to delete <Text as="span" fontWeight="bold" color="red.400">{file?.name}</Text>?
                        </Heading>
                        <HStack spacing={4}>
                            <Button variant="outline" color="white" _hover={{ color: 'black' }} onClick={onCancel}>Cancel</Button>
                            <Button bg="red.600" color="white" onClick={onConfirm} _hover={{ bg: 'red.500' }}>Delete</Button>
                        </HStack>
                    </VStack>
                </Dialog.Body>
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default DeleteDialog