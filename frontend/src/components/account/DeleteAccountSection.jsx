import { Alert, Button, Heading, VStack } from '@chakra-ui/react'

const DeleteAccountSection = ({ onOpenDeleteDialog }) => {
    return (
        <VStack align="flex-start" spacing={6}>
            <Heading color="white" size="xl">Delete Account</Heading>
            <Alert.Root colorPalette="red" status="warning" variant="solid">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>Action is irreversible</Alert.Title>
                    <Alert.Description>
                        Deleting your account will permanently remove all your data from our servers, including files. This action cannot be undone.
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
            <Button
                variant="outline"
                colorPalette="red"
                color="red.200"
                px={4}
                py={2}
                _hover={{ bg: 'gray.800', color: 'white' }}
                onClick={onOpenDeleteDialog}
            >
                Delete My Account
            </Button>
        </VStack>
    )
}

export default DeleteAccountSection