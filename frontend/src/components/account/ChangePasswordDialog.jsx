import { Button, Dialog, HStack, Text, VStack } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { PasswordInput } from '../ui/password-input'
import { toaster } from '../ui/toaster'

const ChangePasswordDialog = ({ isOpen, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setCurrentPassword('')
            setNewPassword('')
            setConfirmNewPassword('')
            setChangingPassword(false)
        }
    }, [isOpen])

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toaster.create({
                title: 'Fill in all password fields.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        if (newPassword !== confirmNewPassword) {
            toaster.create({
                title: 'New password and confirmation must match.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        if (newPassword.length < 8 || !/\d/.test(newPassword)) {
            toaster.create({
                title: 'Password must be at least 8 characters and include a number.',
                type: 'warning',
                duration: 3000,
                isClosable: true,
            })
            return
        }

        setChangingPassword(true)

        try {
            const response = await fetch('/api/user/password/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ currentPassword, newPassword }),
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                toaster.create({
                    title: data.message || 'Failed to change password.',
                    type: 'error',
                    duration: 4000,
                    isClosable: true,
                })
                return
            }

            toaster.create({
                title: data.message || 'Password changed successfully.',
                type: 'success',
                duration: 4000,
                isClosable: true,
            })
            onClose()
        } catch {
            toaster.create({
                title: 'Failed to change password.',
                type: 'error',
                duration: 4000,
                isClosable: true,
            })
        } finally {
            setChangingPassword(false)
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">Change Password</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack spacing={4} align="stretch">
                        <Text color="gray.300">
                            Enter your current password and choose a new one.
                        </Text>
                        <PasswordInput
                            placeholder="Current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            _placeholder={{ color: 'gray.400' }}
                        />
                        <PasswordInput
                            placeholder="New password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            _placeholder={{ color: 'gray.400' }}
                        />
                        <PasswordInput
                            placeholder="Confirm new password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            bg="gray.700"
                            borderColor="gray.600"
                            color="white"
                            _placeholder={{ color: 'gray.400' }}
                        />
                        <Text color="gray.400" fontSize="sm">
                            Password must be at least 8 characters and include a number.
                        </Text>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack spacing={3} justify="flex-end">
                        <Button variant="outline" color="white" _hover={{ color: 'black' }} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            bg="purple.600"
                            color="white"
                            onClick={handleChangePassword}
                            loading={changingPassword}
                            loadingText="Updating"
                            _hover={{ bg: 'purple.500', boxShadow: '0 0 20px rgba(168, 85, 247, 0.6)' }}
                        >
                            Update Password
                        </Button>
                    </HStack>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default ChangePasswordDialog