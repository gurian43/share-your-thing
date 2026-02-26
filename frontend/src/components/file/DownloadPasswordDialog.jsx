import { Button, Dialog, HStack, Text, VStack } from '@chakra-ui/react'
import { PasswordInput } from '../ui/password-input'

const DownloadPasswordDialog = ({ isOpen, password, onPasswordChange, onCancel, onConfirm, isSubmitting }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onCancel() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">Password Required</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack spacing={4} align="stretch">
                        <Text color="gray.300">
                            This file is protected. Enter the password to download.
                        </Text>
                        <PasswordInput
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                        />
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack spacing={3} justify="flex-end">
                        <Button variant="outline" color="white" _hover={{ color: 'black' }} onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            bg="purple.600"
                            color="white"
                            onClick={onConfirm}
                            loading={isSubmitting}
                            loadingText="Downloading"
                            disabled={!password}
                            _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                        >
                            Download
                        </Button>
                    </HStack>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default DownloadPasswordDialog