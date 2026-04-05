import { Button, Heading, Text, VStack } from '@chakra-ui/react'
import { useState } from 'react'
import { PasswordInput } from '../ui/password-input'
import { toaster } from '../ui/toaster'

const ChangePasswordSection = () => {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)

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
            setCurrentPassword('')
            setNewPassword('')
            setConfirmNewPassword('')
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
        <VStack align="flex-start" spacing={6}>
            <Heading color="white" size="xl">Change Password</Heading>
            <Text color="gray.400">Enter your current password and choose a new one.</Text>
            <VStack spacing={4} align="stretch" w="full" maxW="420px">
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
                <Button
                    variant="outline"
                    colorPalette="purple"
                    color="purple.200"
                    px={4}
                    py={2}
                    _hover={{ bg: 'gray.800', color: 'white' }}
                    loading={changingPassword}
                    loadingText="Updating"
                    onClick={handleChangePassword}
                >
                    Update Password
                </Button>
            </VStack>
        </VStack>
    )
}

export default ChangePasswordSection