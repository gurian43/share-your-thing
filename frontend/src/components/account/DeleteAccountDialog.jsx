import { Button, Dialog, Heading, HStack, Input, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { toaster } from '../ui/toaster'

const DeleteAccountDialog = ({ isOpen, onClose, onConfirmDelete }) => {
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    useEffect(() => {
        if (!isOpen) {
            setDeleteConfirmText('')
        }
    }, [isOpen])

    const handleConfirm = async () => {
        if (deleteConfirmText !== 'DELETE') {
            toaster.create({
                title: 'You must type "DELETE" to confirm account deletion.',
                type: 'error',
                duration: 3000,
            })
            return
        }

        onClose()
        await onConfirmDelete()
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Body>
                    <VStack spacing={6} align="center" justify="center" py={8}>
                        <Heading size="lg" color="white" textAlign="center">
                            Are you really sure you want to delete your account?
                        </Heading>
                        <Text color="gray.400" textAlign="center">
                            This action cannot be undone. All your files and data will be permanently deleted.
                        </Text>
                        <Text color="white" fontWeight="bold" textAlign="center">
                            Please type "DELETE" to confirm.
                        </Text>
                        <Input
                            placeholder="Type DELETE to confirm"
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            _placeholder={{ color: 'gray.400' }}
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                        />
                        <HStack spacing={4}>
                            <Button variant="ghost" color="gray.300" _hover={{ bg: 'gray.700', color: 'white' }} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button variant="ghost" color="red.300" _hover={{ bg: 'gray.700', color: 'red.200' }} onClick={handleConfirm}>
                                Delete Account
                            </Button>
                        </HStack>
                    </VStack>
                </Dialog.Body>
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default DeleteAccountDialog