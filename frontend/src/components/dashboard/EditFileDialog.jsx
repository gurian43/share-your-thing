import { useEffect, useState } from 'react'
import { Button, HStack, Input, Textarea, VStack, Dialog, Text, Box } from '@chakra-ui/react'
import { toaster } from '../ui/toaster'

const EditFileDialog = ({ isOpen, file, onClose, onSaved }) => {
    
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [maxDownloads, setMaxDownloads] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [hasPassword, setHasPassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [removePassword, setRemovePassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!isOpen || !file) return
        let mounted = true

        // Preset UI immediately from the passed `file` prop so the dialog feels loaded
        setName(file.file_name || file.name || '')
        setDescription(file.description || '')
        setMaxDownloads(file.max_downloads ? String(file.max_downloads) : '')
        setExpiresAt(file.expires_at ? new Date(file.expires_at).toISOString().split('T')[0] : '')
        setHasPassword(Boolean(file.password))
        setNewPassword('')
        setConfirmPassword('')
        setRemovePassword(false)

        // Fetch fresh data in background and update fields if available
        ;(async () => {
            try {
                const res = await fetch(`/api/file/${file.id}`, { method: 'GET', credentials: 'include' })
                if (!res.ok) throw new Error('Failed to fetch file')
                const data = await res.json()
                if (!mounted) return
                const f = data.file || {}
                setName(f.file_name || (file.file_name || file.name) || '')
                setDescription(f.description || '')
                setMaxDownloads(f.max_downloads ? String(f.max_downloads) : '')
                setExpiresAt(f.expires_at ? new Date(f.expires_at).toISOString().split('T')[0] : '')
                setHasPassword(Boolean(f.password))
            } catch (err) {
                console.error(err)
                toaster.create({ title: 'Failed to load file', status: 'error' })
                onClose && onClose()
            } finally {
                // background refresh finished
            }
        })()

        return () => { mounted = false }
    }, [isOpen, file, onClose])

    const handleSave = async () => {
        setSubmitting(true)
        try {
            const body = {
                file_name: name,
                description,
                max_downloads: maxDownloads ? Number(maxDownloads) : null,
                expires_at: expiresAt || null,
            }

            const res = await fetch(`/api/file/${file.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || 'Failed to update file')

            // handle password change/remove
            if (removePassword) {
                const pRes = await fetch(`/api/file/${file.id}/password`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: null }),
                })
                const pData = await pRes.json()
                if (!pRes.ok) throw new Error(pData.message || 'Failed to remove password')
            } else if (newPassword) {
                if (newPassword !== confirmPassword) throw new Error('Passwords do not match')
                const pRes = await fetch(`/api/file/${file.id}/password`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: newPassword }),
                })
                const pData = await pRes.json()
                if (!pRes.ok) throw new Error(pData.message || 'Failed to set password')
            }

            toaster.create({ title: data.message || 'File updated', status: 'success' })
            onSaved && onSaved(data.file)
            onClose && onClose()
        } catch (err) {
            console.error(err)
            toaster.create({ title: err.message || 'Error', status: 'error' })
        } finally {
            setSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onClose() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="560px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">Edit {file.name}</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                    <VStack spacing={3} align="stretch">
                        <Box>
                            <Text color="gray.200" fontWeight="semibold">File name</Text>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter a descriptive file name" bg="gray.700" borderColor="gray.600" color="white" />
                            {name.trim().length === 0 ? (
                                <Text color="red.300" fontSize="sm">File name is required.</Text>
                            ) : name.length > 120 ? (
                                <Text color="red.300" fontSize="sm">File name must be 120 characters or less.</Text>
                            ) : (
                                <Text color="gray.400" fontSize="sm">Maximum 120 characters.</Text>
                            )}
                        </Box>

                        <Box>
                            <Text color="gray.200" fontWeight="semibold">Description</Text>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional: add context or usage notes" bg="gray.700" borderColor="gray.600" color="white" />
                        </Box>

                        <Box>
                            <Text color="gray.200" fontWeight="semibold">Max downloads</Text>
                            <Input value={maxDownloads} onChange={(e) => setMaxDownloads(e.target.value)} placeholder="Leave blank for unlimited" bg="gray.700" borderColor="gray.600" color="white" />
                        </Box>

                        <Box>
                            <Text color="gray.200" fontWeight="semibold">Expires at</Text>
                            <Input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" placeholder="Optional expiry date" bg="gray.700" borderColor="gray.600" color="white" />
                            <Text color="gray.400" fontSize="sm">Leave blank to never expire.</Text>
                        </Box>

                        <VStack align="stretch" spacing={2} mt={2}>
                            <HStack justify="space-between">
                                <Text color="gray.200" fontWeight="semibold">Password</Text>
                                <Text style={{ color: hasPassword ? '#32CD32' : undefined }}>{hasPassword ? 'Protected' : 'Not protected'}</Text>
                            </HStack>
                            {hasPassword && (
                                <Box>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} />
                                        <Text color="gray.200">Remove existing password</Text>
                                    </label>
                                </Box>
                            )}
                            <Box>
                                <Text color="gray.200" fontWeight="semibold">New password</Text>
                                <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (leave blank to keep)" bg="gray.700" borderColor="gray.600" color="white" />
                                {newPassword && newPassword.length > 32 ? (
                                    <Text color="red.300" fontSize="sm">Password must be 32 characters or fewer.</Text>
                                ) : (
                                    <Text color="gray.400" fontSize="sm">Use a short password (max 32 chars). Leave blank to keep current password.</Text>
                                )}
                            </Box>

                            <Box>
                                <Text color="gray.200" fontWeight="semibold">Confirm password</Text>
                                <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" bg="gray.700" borderColor="gray.600" color="white" />
                                {newPassword && confirmPassword && newPassword !== confirmPassword ? (
                                    <Text color="red.300" fontSize="sm">Passwords do not match.</Text>
                                ) : null}
                            </Box>
                        </VStack>
                    </VStack>
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack spacing={3} justify="flex-end">
                        <Button variant="outline" color="white" borderColor="gray.600" onClick={onClose}>Cancel</Button>
                        <Button bg="purple.600" color="white" onClick={handleSave} loading={submitting} disabled={submitting}>Save</Button>
                    </HStack>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default EditFileDialog