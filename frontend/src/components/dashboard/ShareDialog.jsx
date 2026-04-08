import { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Dialog,
    HStack,
    RadioGroup,
    TagsInput,
    Text,
    VStack,
} from '@chakra-ui/react'
import { toaster } from '../ui/toaster'

const visibilityOptions = [
    { label: 'Public', value: 'public' },
    { label: 'Unlisted', value: 'unlisted' },
    { label: 'Private', value: 'private' },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ShareDialog = ({ isOpen, file, onClose, onSaved }) => {
    const [visibility, setVisibility] = useState('unlisted')
    const [emails, setEmails] = useState([])
    const [emailInputValue, setEmailInputValue] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (!isOpen || !file) return
        setVisibility(file.visibility || 'unlisted')
        setEmails(Array.isArray(file.shared_with_emails) ? file.shared_with_emails : [])
    }, [isOpen, file])

    const fileLink = useMemo(() => {
        if (!file?.id) return ''
        return `${window.location.origin}/file/${file.id}`
    }, [file])

    const closeDialog = () => {
        if (!saving) {
            onClose?.()
        }
    }

    const commitEmailInput = () => {
        const nextEmail = String(emailInputValue || '').trim()
        if (!nextEmail) return

        setEmails((prev) => {
            const exists = prev.some((email) => String(email).toLowerCase() === nextEmail.toLowerCase())
            return exists ? prev : [...prev, nextEmail]
        })
        setEmailInputValue('')
    }

    const handleCopyLink = async () => {
        if (!fileLink) return
        try {
            await navigator.clipboard.writeText(fileLink)
            toaster.create({ title: 'Link copied to clipboard', type: 'success', duration: 2500 })
        } catch {
            toaster.create({ title: 'Could not copy link', type: 'error', duration: 3000 })
        }
    }

    const handleSave = async () => {
        if (!file?.id || saving) return

        const normalizedEmails = [...new Set(
            emails
                .map((email) => String(email || '').trim().toLowerCase())
                .filter(Boolean)
        )]

        const invalidEmail = normalizedEmails.find((email) => !emailPattern.test(email))
        if (visibility === 'private' && invalidEmail) {
            toaster.create({
                title: `Invalid email: ${invalidEmail}`,
                type: 'error',
                duration: 3500,
            })
            return
        }

        setSaving(true)
        const saveRequest = (async () => {
            const response = await fetch(`/api/file/${file.id}/share`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visibility,
                    sharedWithEmails: visibility === 'private' ? normalizedEmails : [],
                }),
            })

            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to save share settings')
            }

            return data
        })()

        toaster.promise(saveRequest, {
            loading: { title: 'Saving share settings...' },
            error: (err) => ({
                title: 'Failed to save share settings',
                description: err?.message || 'Unknown error',
            }),
        })

        try {
            const data = await saveRequest
            const updated = data?.file
            const savedCount = updated?.shared_with_count ?? 0

            toaster.create({
                title: 'Share settings saved',
                description: visibility === 'private'
                    ? `${savedCount} ${savedCount === 1 ? 'address' : 'addresses'} saved`
                    : undefined,
                type: 'success',
                duration: 3000,
            })

            onSaved?.({
                id: file.id,
                visibility: updated?.visibility || visibility,
                shared_with_count: updated?.shared_with_count ?? 0,
                shared_with_emails: updated?.shared_with_emails || [],
            })
        } catch {
            // Error toast is handled by toaster.promise above.
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) closeDialog() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="500px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">Share File: {file?.name}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack spacing={4} align="stretch">
                        <VStack align="stretch" gap={2}>
                            <Text color="gray.300" fontSize="sm" fontWeight="medium">Visibility</Text>
                            <RadioGroup.Root
                                value={visibility}
                                onValueChange={(details) => setVisibility(details.value)}
                                colorPalette="purple"
                            >
                                <HStack gap={4} wrap="wrap">
                                    {visibilityOptions.map((option) => (
                                        <RadioGroup.Item key={option.value} value={option.value}>
                                            <RadioGroup.ItemHiddenInput />
                                            <RadioGroup.ItemIndicator />
                                            <RadioGroup.ItemText color="white">{option.label}</RadioGroup.ItemText>
                                        </RadioGroup.Item>
                                    ))}
                                </HStack>
                            </RadioGroup.Root>
                        </VStack>

                        {visibility === 'private' && (
                            <VStack align="stretch" gap={2}>
                                <Text color="gray.300" fontSize="sm" fontWeight="medium">
                                    Share With:
                                </Text>
                                <TagsInput.Root
                                    value={emails}
                                    onValueChange={(details) => setEmails(details.value)}
                                    inputValue={emailInputValue}
                                    onInputValueChange={(details) => setEmailInputValue(details.inputValue)}
                                    delimiter="Enter"
                                    colorPalette="gray"
                                    size="sm"
                                >
                                    <TagsInput.Label color="gray.400" srOnly>
                                        Share emails
                                    </TagsInput.Label>
                                    <TagsInput.Control bg="gray.700" borderColor="gray.600" minH="44px">
                                        <TagsInput.Items />
                                        <TagsInput.Input
                                            placeholder="Type email and press Enter or Space"
                                            color="white"
                                            onKeyDown={(event) => {
                                                if (event.key === ' ') {
                                                    event.preventDefault()
                                                    commitEmailInput()
                                                }
                                            }}
                                        />
                                    </TagsInput.Control>
                                </TagsInput.Root>
                                <Text color="gray.500" fontSize="xs">
                                    Press Enter or Space to add an address.
                                </Text>
                            </VStack>
                        )}
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack gap={2} w="full" justify="flex-end">
                        <Button
                            variant="outline"
                            color="white"
                            borderColor="gray.600"
                            _hover={{ bg: 'gray.600', color: 'white', boxShadow: 'none' }}
                            onClick={closeDialog}
                            disabled={saving}
                        >
                            Close
                        </Button>
                        <Button
                            variant="outline"
                            color="white"
                            borderColor="gray.600"
                            _hover={{ bg: 'gray.600', color: 'white', boxShadow: 'none' }}
                            onClick={handleCopyLink}
                        >
                            Copy Link
                        </Button>
                        <Button
                            bg="purple.600"
                            color="white"
                            _hover={{ bg: 'purple.500', boxShadow: 'none' }}
                            onClick={handleSave}
                            loading={saving}
                        >
                            Save
                        </Button>
                    </HStack>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default ShareDialog