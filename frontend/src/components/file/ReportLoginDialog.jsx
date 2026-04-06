import { Button, Dialog, HStack, Text, VStack } from '@chakra-ui/react'

const ReportLoginDialog = ({ isOpen, onCancel, onLogin }) => {
    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onCancel() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">Sign in required</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack spacing={3} align="stretch">
                        <Text color="gray.300">
                            You need to be signed in to report a file.
                        </Text>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack spacing={3} justify="flex-end">
                        <Button variant="outline" color="white" borderColor="gray.600" _hover={{ bg: 'gray.700', color: 'white' }} onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button bg="purple.600" color="white" _hover={{ bg: 'purple.500' }} onClick={onLogin}>
                            Go to Login
                        </Button>
                    </HStack>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default ReportLoginDialog