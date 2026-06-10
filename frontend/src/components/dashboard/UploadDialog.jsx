import { useMemo, useRef, useState } from 'react'
import {
    Box,
    Button,
    Dialog,
    Field,
    FileUpload,
    HStack,
    Icon,
    Input,
    NumberInput,
    Progress,
    RadioGroup,
    Separator,
    Steps,
    TagsInput,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'
import { toaster } from '../ui/toaster'
import { formatBytes } from '../../utils/fileUtils'
import { LuFile, LuUpload } from 'react-icons/lu'
import { createSHA256 } from 'hash-wasm'
import { useAuth } from '../../context/AuthContext'

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB
const UPLOAD_CONCURRENCY = 4
const FILE_NAME_MAX_LENGTH = 120
const FILE_NAME_ALLOWED_CHARS = /^[a-zA-Z0-9 ._\-()[\]&',+]+$/

const validateCustomFileName = (value) => {
    const name = String(value || '').trim()
    if (!name) return 'Please enter a file name'
    if (name.length > FILE_NAME_MAX_LENGTH) return `File name must be ${FILE_NAME_MAX_LENGTH} characters or less`
    if (!FILE_NAME_ALLOWED_CHARS.test(name)) {
        return "Allowed characters: letters, numbers, spaces, . _ - ( ) [ ] & ' , +"
    }
    return null
}

const UploadDialog = ({ isOpen, onClose, onUploaded }) => {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [file, setFile] = useState(null)
    const [customFileName, setCustomFileName] = useState('')
    const [description, setDescription] = useState('')
    const [visibility, setVisibility] = useState('unlisted')
    const [sharedEmails, setSharedEmails] = useState([])
    const [shareEmailInput, setShareEmailInput] = useState('')
    const [password, setPassword] = useState('')
    const [maxDownloads, setMaxDownloads] = useState(0)
    const [expiresAt, setExpiresAt] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedChunks, setUploadedChunks] = useState(0)
    const [totalChunks, setTotalChunks] = useState(0)
    const [uploadStage, setUploadStage] = useState('idle') // idle, uploading, merging, encrypting
    const [uploadSpeed, setUploadSpeed] = useState(0)
    const [warnLabel, setWarnLabel] = useState('')
    const cancelRequestedRef = useRef(false)
    const abortersRef = useRef(new Set())

    const visibilityOptions = [
        { label: 'Public', value: 'public' },
        { label: 'Unlisted', value: 'unlisted' },
        { label: 'Private', value: 'private' },
    ]

    const fileInfo = useMemo(() => {
        if (!file) return null
        return {
            name: file.name,
            size: file.size,
            type: file.type || 'file',
        }
    }, [file])

    const nameValidationError = useMemo(() => validateCustomFileName(customFileName), [customFileName])

    const reset = () => {
        setStep(1)
        setFile(null)
        setCustomFileName('')
        setDescription('')
        setVisibility('unlisted')
        setSharedEmails([])
        setShareEmailInput('')
        setPassword('')
        setMaxDownloads('')
        setExpiresAt('')
        setSubmitting(false)
        setUploadProgress(0)
        setUploadedChunks(0)
        setTotalChunks(0)
        setUploadStage('idle')
        setUploadSpeed(0)
        abortersRef.current.forEach((controller) => controller.abort())
        abortersRef.current.clear()
    }

    const closeAndReset = () => {
        reset()
        onClose?.()
    }

    const handleDialogOpenChange = (e) => {
        if (e.open) return

        if (submitting && !cancelRequestedRef.current) {
            setWarnLabel('Please cancel the ongoing upload before closing the dialog.');
            return;
        }

        closeAndReset()
    }

    const handleNext = () => {
        if (!file) return
        setStep(2)
    }

    const handleBack = () => setStep(1)

    const commitShareEmailInput = () => {
        const nextEmail = String(shareEmailInput || '').trim()
        if (!nextEmail) return

        setSharedEmails((prev) => {
            const exists = prev.some((email) => String(email).toLowerCase() === nextEmail.toLowerCase())
            return exists ? prev : [...prev, nextEmail]
        })
        setShareEmailInput('')
    }

    const handleSubmit = async () => {
        if (!file) return

        const desiredFileName = String(customFileName || '').trim()
        const uploadKey = `upload_${file.name}_${file.size}_${desiredFileName}`
        const fileNameError = validateCustomFileName(desiredFileName)
        if (fileNameError) {
            toaster.create({
                title: fileNameError,
                type: 'error',
                duration: 3000,
            })
            return
        }

        if (user && user.role !== 'admin' && !user.admin) {
            const availableStorageBytes = Math.max((Number(user.max_storage) || 0) - (Number(user.current_storage) || 0), 0)

            if (availableStorageBytes > 0 && file.size > availableStorageBytes) {
                toaster.create({
                    title: 'File is too large to upload',
                    description: `Available: ${formatBytes(availableStorageBytes)}`,
                    type: 'error',
                    duration: 4000,
                })
                return
            }
        }

        if (password && password.length > 32) {
            toaster.create({
                title: 'Password must be 32 characters or less',
                type: 'error',
                duration: 4000,
            })
            return
        }

        const normalizedEmails = [...new Set(
            sharedEmails
                .map((email) => String(email || '').trim().toLowerCase())
                .filter(Boolean)
        )]

        const invalidEmail = normalizedEmails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        if (visibility === 'private' && invalidEmail) {
            toaster.create({
                title: `Invalid email: ${invalidEmail}`,
                type: 'error',
                duration: 3500,
            })
            return
        }
        
        setSubmitting(true)
        cancelRequestedRef.current = false

        const uploadLockKey = `upload_lock_${file.name}_${file.size}_${desiredFileName}`
        const existingLockTs = Number(localStorage.getItem(uploadLockKey) || 0)
        const LOCK_TTL_MS = 5 * 60 * 1000

        if (existingLockTs && Date.now() - existingLockTs < LOCK_TTL_MS) {
            toaster.create({
                title: 'This file is already uploading',
                description: 'Wait for the current upload to finish or cancel it first.',
                type: 'info',
                duration: 3500,
            })
            setSubmitting(false)
            return
        }

        localStorage.setItem(uploadLockKey, String(Date.now()))

        const toastId = toaster.create({
            title: 'Uploading file...',
            description: 'Starting upload',
            type: 'loading',
            duration: 60000,
        })

        try {
            // total chunks
            const chunks = Math.ceil(file.size / CHUNK_SIZE)
            setTotalChunks(chunks)
            setUploadedChunks(0)
            setUploadProgress(0)
            setUploadSpeed(0)
            setUploadStage('uploading')

            // check existing upload in local
            const existingUpload = localStorage.getItem(uploadKey)
            let uploadId
            let startChunk = 0
            let uploadedChunks = []
            let completedBytesCount = 0
            let lastSpeedSampleAt = Date.now()
            let lastSpeedSampleBytes = 0

            const getChunkBytes = (chunkIndex) => {
                const start = chunkIndex * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, file.size)
                return end - start
            }

            const updateUploadSpeed = () => {
                const now = Date.now()
                const elapsedMs = now - lastSpeedSampleAt
                if (elapsedMs < 400) return

                const bytesDelta = completedBytesCount - lastSpeedSampleBytes
                const bytesPerSecond = elapsedMs > 0 ? (bytesDelta / elapsedMs) * 1000 : 0

                lastSpeedSampleAt = now
                lastSpeedSampleBytes = completedBytesCount
                setUploadSpeed(bytesPerSecond)
            }

            const cancelUploadOnServer = async () => {
                if (!uploadId) return

                try {
                    await fetch('/api/file/upload/cancel', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ uploadId }),
                    })
                } catch (err) {
                    console.error('Error cancelling upload on server:', err)
                }
            }

            const requestCancel = () => {
                if (cancelRequestedRef.current) return

                cancelRequestedRef.current = true
                setSubmitting(false)
                abortersRef.current.forEach((controller) => controller.abort())
                localStorage.removeItem(uploadKey)
                void cancelUploadOnServer()

                toaster.update(toastId, {
                    title: 'Cancelling upload...',
                    description: 'Stopping transfer and removing already uploaded chunks',
                    type: 'loading',
                    duration: 60000,
                })
            }

            if (existingUpload) {
                const uploadState = JSON.parse(existingUpload)
                const ageHours = (Date.now() - uploadState.timestamp) / (1000 * 60 * 60)
                
                // resume if <24h old
                if (ageHours < 24) {
                    uploadId = uploadState.uploadId
                    
                    // check uploaded chunks
                    const statusRes = await fetch(`/api/file/upload/status?uploadId=${uploadId}`, {
                        credentials: 'include',
                    })
                    
                    if (statusRes.ok) {
                        const statusData = await statusRes.json()
                        uploadedChunks = statusData.uploadedChunks || []
                        startChunk = uploadedChunks.length
                        completedBytesCount = uploadedChunks.reduce((sum, chunkIndex) => sum + getChunkBytes(chunkIndex), 0)
                        lastSpeedSampleBytes = completedBytesCount
                        lastSpeedSampleAt = Date.now()
                        
                        if (startChunk > 0) {
                            setUploadProgress((startChunk / chunks) * 100)
                            setUploadedChunks(startChunk)
                            setUploadSpeed(0)
                            toaster.update(toastId, {
                                title: 'Resuming Upload',
                                description: `Continuing from ${Math.round((startChunk/chunks)*100)}% (${startChunk}/${chunks} chunks done)`,
                                type: 'info',
                                duration: 3000,
                            })
                        }
                    }
                }
            }

            // generate new id
            if (!uploadId) {
                uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                
                // save upload to local
                localStorage.setItem(uploadKey, JSON.stringify({
                    uploadId,
                    fileName: desiredFileName,
                    fileSize: file.size,
                    timestamp: Date.now()
                }))
            }

            const uploadedChunkSet = new Set(uploadedChunks)
            const pendingChunkIndexes = []
            for (let i = 0; i < chunks; i++) {
                if (!uploadedChunkSet.has(i)) {
                    pendingChunkIndexes.push(i)
                }
            }

            let completedChunkCount = uploadedChunkSet.size
            setUploadedChunks(completedChunkCount)
            setUploadProgress((completedChunkCount / chunks) * 100)
            updateUploadSpeed()

            const updateProgress = () => {
                const pct = (completedChunkCount / chunks) * 100
                setUploadedChunks(completedChunkCount)
                setUploadProgress(pct)
                updateUploadSpeed()

                toaster.update(toastId, {
                    title: 'Uploading...',
                    description: `${Math.round(pct)}% complete (${completedChunkCount}/${chunks} chunks)`,
                    type: 'loading',
                    duration: 60000,
                    action: {
                        label: 'Cancel',
                        onClick: requestCancel,
                    },
                })
            }

            updateProgress()

            const parseChunkError = async (response, chunkIndex) => {
                const responseText = await response.text().catch(() => '')
                let parsedMessage = ''

                try {
                    const responseJson = JSON.parse(responseText)
                    parsedMessage = responseJson?.message || ''
                } catch {
                    parsedMessage = responseText || ''
                }

                throw new Error(
                    parsedMessage
                        ? `Chunk ${chunkIndex + 1} failed (${response.status}): ${parsedMessage}`
                        : `Chunk ${chunkIndex + 1} failed (${response.status})`
                )
            }

            const uploadChunkByIndex = async (chunkIndex) => {
                if (cancelRequestedRef.current) {
                    throw new Error('UPLOAD_CANCELLED')
                }

                const start = chunkIndex * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, file.size)
                const chunk = file.slice(start, end)

                const chunkFormData = new FormData()
                chunkFormData.append('chunk', chunk)
                chunkFormData.append('chunkIndex', chunkIndex)
                chunkFormData.append('totalChunks', chunks)
                chunkFormData.append('uploadId', uploadId)
                chunkFormData.append('fileName', desiredFileName)
                chunkFormData.append('fileSize', file.size)

                const controller = new AbortController()
                abortersRef.current.add(controller)

                try {
                    const chunkRes = await fetch('/api/file/upload/chunk', {
                        method: 'POST',
                        credentials: 'include',
                        body: chunkFormData,
                        signal: controller.signal,
                    })

                    if (!chunkRes.ok) {
                        await parseChunkError(chunkRes, chunkIndex)
                    }

                    completedChunkCount += 1
                    completedBytesCount += chunk.size
                    updateProgress()
                } finally {
                    abortersRef.current.delete(controller)
                }
            }

            let chunkCursor = 0
            const workerCount = Math.min(UPLOAD_CONCURRENCY, Math.max(1, pendingChunkIndexes.length))

            const worker = async () => {
                while (chunkCursor < pendingChunkIndexes.length) {
                    const currentCursor = chunkCursor
                    chunkCursor += 1
                    await uploadChunkByIndex(pendingChunkIndexes[currentCursor])
                }
            }

            await Promise.all(Array.from({ length: workerCount }, worker))

            const hasher = await createSHA256()
            hasher.init()
            for (let i = 0; i < chunks; i++) {
                if (cancelRequestedRef.current) {
                    throw new Error('UPLOAD_CANCELLED')
                }

                const start = i * CHUNK_SIZE
                const end = Math.min(start + CHUNK_SIZE, file.size)
                const chunkBuffer = await file.slice(start, end).arrayBuffer()
                hasher.update(new Uint8Array(chunkBuffer))
            }

            const checksum = hasher.digest('hex')

            setUploadStage('merging')
            toaster.update(toastId, {
                title: 'Processing...',
                description: 'Merging uploaded chunks',
                type: 'loading',
                duration: 60000,
            })

            setUploadStage('encrypting')

            // Merge chunks
            const mergeRes = await fetch('/api/file/upload/finalize', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uploadId,
                    fileName: desiredFileName,
                    originalFileName: file.name,
                    fileSize: file.size,
                    totalChunks: chunks,
                    checksum,
                    description,
                    visibility,
                    sharedWithEmails: visibility === 'private' ? normalizedEmails : [],
                    password: password || null,
                    max_downloads: maxDownloads && maxDownloads > 0 ? maxDownloads : null,
                    expires_at: expiresAt || null,
                }),
            })

            if (!mergeRes.ok) {
                const mergeErr = await mergeRes.json().catch(() => ({}))
                throw new Error(mergeErr?.message || 'Failed to finalize upload')
            }

            toaster.update(toastId, {
                title: 'Encrypting...',
                description: 'Securing your file with AES-256 encryption',
                type: 'loading',
                duration: 60000,
            })

            const mergeData = await mergeRes.json();
            onUploaded?.(mergeData.file);

            // Clear upload state from local
            localStorage.removeItem(uploadKey);

            setUploadStage('idle')
            toaster.update(toastId, {
                title: 'Upload Complete!',
                description: `${desiredFileName} uploaded and encrypted successfully`,
                type: 'success',
                duration: 4000,
            })

            closeAndReset()
        } catch (err) {
            const wasCancelled =
                cancelRequestedRef.current ||
                err?.name === 'AbortError' ||
                err?.message === 'UPLOAD_CANCELLED'

            if (wasCancelled) {
                localStorage.removeItem(uploadKey)
                toaster.update(toastId, {
                    title: 'Upload cancelled',
                    description: 'Uploaded chunks were cleared',
                    type: 'info',
                    duration: 4000,
                })
                setUploadStage('idle')
                setUploadSpeed(0)
                return
            }

            console.error('Upload error:', err)
            setUploadStage('idle')
            setUploadSpeed(0)
            toaster.update(toastId, {
                title: 'Upload failed',
                description: err?.message || 'An error occurred during upload',
                type: 'error',
                duration: 5000,
            })
        } finally {
            abortersRef.current.forEach((controller) => controller.abort())
            abortersRef.current.clear()
            cancelRequestedRef.current = false
            localStorage.removeItem(uploadLockKey)
            setSubmitting(false);
        }
    }

    const stepItems = [
        { title: 'Select File' },
        { title: 'Configure & Upload' },
    ];
    const stepIndex = Math.max(0, Math.min(1, step - 1));

    return (
        <Dialog.Root open={isOpen} onOpenChange={handleDialogOpenChange} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="600px" bg="gray.800">
                <Dialog.Header display="flex" flexDirection="column" alignItems="center">
                    <Dialog.Title color="white">Upload File</Dialog.Title>
                    <Steps.Root colorPalette="purple" step={stepIndex} count={stepItems.length} size="sm" w="full" mt={3}>
                        <Steps.List>
                            {stepItems.map((item, index) => (
                                <Steps.Item key={item.title} index={index}>
                                    <Steps.Trigger cursor="default">
                                        <Steps.Indicator>
                                            <Steps.Number color="white" />
                                        </Steps.Indicator>
                                        <Steps.Title color="white" fontSize="sm">{item.title}</Steps.Title>
                                    </Steps.Trigger>
                                    {index < stepItems.length - 1 && <Steps.Separator bg="whiteAlpha.700" />}
                                </Steps.Item>
                            ))}
                        </Steps.List>
                    </Steps.Root>
                </Dialog.Header>
                <Dialog.Body>
                    {step === 1 ? (
                        <VStack spacing={4} align="stretch">
                            <FileUpload.Root
                                alignItems={"stretch"}
                                maxFiles={1}
                                accept={{ '*/*': [] }}
                                onFileChange={async ({ acceptedFiles }) => {
                                    const f = acceptedFiles?.[0]
                                    if (!f) {
                                        setFile(null)
                                        setCustomFileName('')
                                        return
                                    }

                                    setFile(f)
                                    setCustomFileName(f.name)
                                }}
                            >
                                <FileUpload.HiddenInput />
                                <FileUpload.Dropzone
                                    borderWidth="2px"
                                    borderStyle="dashed"
                                    borderColor="gray.600"
                                    bg="gray.700"
                                    p={8}
                                    borderRadius="md"
                                    cursor="pointer"
                                    transition="all 0.15s ease-in-out"
                                    _hover={{ borderColor: 'purple.400', bg: 'gray.600' }}
                                    _focusVisible={{ outline: '2px solid', outlineColor: 'purple.400' }}
                                >
                                    <Icon size="md" color="fg.muted">
                                        <LuUpload color='white' />
                                    </Icon>
                                    <FileUpload.DropzoneContent>
                                        <Box color="white">Drag and drop your file here</Box>
                                    </FileUpload.DropzoneContent>
                                </FileUpload.Dropzone>
                            </FileUpload.Root>

                            {fileInfo && (
                                <HStack
                                    bg="gray.700"
                                    border="1px solid"
                                    borderColor="gray.600"
                                    borderRadius="md"
                                    p={3}
                                    spacing={3}
                                    align="center"
                                    w="100%"
                                >
                                    <Icon size="md" color="white">
                                        <LuFile color='white' />
                                    </Icon>
                                    <Box flex="1" minW={0}>
                                        <Text color="white" fontSize="sm" noOfLines={1}>
                                            {fileInfo.name}
                                        </Text>
                                        <Text color="gray.400" fontSize="xs">
                                            {formatBytes(fileInfo.size)}
                                        </Text>
                                    </Box>
                                </HStack>
                            )}
                        </VStack>
                    ) : (
                        <VStack spacing={4} align="stretch">
                            <Field.Root invalid={Boolean(nameValidationError)}>
                                <Field.Label color="gray.200">File Name</Field.Label>
                                <Input
                                    value={customFileName}
                                    onChange={(e) => setCustomFileName(e.target.value)}
                                    placeholder="Enter file name"
                                    maxLength={FILE_NAME_MAX_LENGTH}
                                    bg="gray.700"
                                    borderColor="gray.600"
                                    color="white"
                                />
                                <Field.HelperText color="gray.400">
                                    Max {FILE_NAME_MAX_LENGTH} chars. Allowed: letters, numbers, spaces, . _ - ( ) [ ] & ' , +
                                </Field.HelperText>
                                {nameValidationError && <Field.ErrorText>{nameValidationError}</Field.ErrorText>}
                            </Field.Root>

                            <Field.Root>
                                <Field.Label color="gray.200">Description</Field.Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your file (optional)"
                                    bg="gray.700"
                                    borderColor="gray.600"
                                    color="white"
                                />
                            </Field.Root>
                            <HStack spacing={4} align="stretch">
                                <Field.Root flex={1}>
                                    <Field.Label color="gray.200">Visibility</Field.Label>
                                    <RadioGroup.Root
                                        value={visibility}
                                        onValueChange={(details) => setVisibility(details.value)}
                                        colorPalette="purple"
                                    >
                                        <HStack gap={4} wrap="wrap" minH="40px" align="center">
                                            {visibilityOptions.map((option) => (
                                                <RadioGroup.Item key={option.value} value={option.value}>
                                                    <RadioGroup.ItemHiddenInput />
                                                    <RadioGroup.ItemIndicator />
                                                    <RadioGroup.ItemText color="white">{option.label}</RadioGroup.ItemText>
                                                </RadioGroup.Item>
                                            ))}
                                        </HStack>
                                    </RadioGroup.Root>
                                </Field.Root>
                                <Field.Root flex={1}>
                                    <Field.Label color="gray.200">Password (optional)</Field.Label>
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        maxLength={32}
                                        placeholder="Set a password"
                                        bg="gray.700"
                                        borderColor="gray.600"
                                        color="white"
                                    />
                                    <Field.HelperText color="gray.400">Max 32 characters</Field.HelperText>
                                </Field.Root>
                            </HStack>
                            {visibility === 'private' && (
                                <Field.Root>
                                    <Field.Label color="gray.200">Share With</Field.Label>
                                    <TagsInput.Root
                                        value={sharedEmails}
                                        onValueChange={(details) => setSharedEmails(details.value)}
                                        inputValue={shareEmailInput}
                                        onInputValueChange={(details) => setShareEmailInput(details.inputValue)}
                                        delimiter="Enter"
                                        colorPalette="gray"
                                        size="sm"
                                    >
                                        <TagsInput.Control bg="gray.700" borderColor="gray.600" minH="44px">
                                            <TagsInput.Items />
                                            <TagsInput.Input
                                                placeholder="Type email and press Enter or Space"
                                                color="white"
                                                onKeyDown={(event) => {
                                                    if (event.key === ' ') {
                                                        event.preventDefault()
                                                        commitShareEmailInput()
                                                    }
                                                }}
                                            />
                                        </TagsInput.Control>
                                    </TagsInput.Root>
                                    <Field.HelperText color="gray.400">Press Enter or Space to add an address.</Field.HelperText>
                                </Field.Root>
                            )}
                            <HStack spacing={4} align="stretch">
                                <Field.Root>
                                    <Field.Label color="gray.200">Max downloads</Field.Label>
                                    <NumberInput.Root
                                        min={0}
                                        value={maxDownloads}
                                        onValueChange={({ valueAsNumber }) =>
                                            setMaxDownloads(Number.isNaN(valueAsNumber) ? '' : valueAsNumber)
                                        }
                                    >
                                        <NumberInput.Control>
                                                <NumberInput.IncrementTrigger bg={"gray.600"} color={"white"} _hover={{bg:"gray.500"}} />
                                                <NumberInput.DecrementTrigger bg={"gray.600"} color={"white"} _hover={{bg:"gray.500"}} />
                                        </NumberInput.Control>
                                        <NumberInput.Input bg="gray.700" borderColor="gray.600" color="white" />
                                    </NumberInput.Root>
                                    <Field.HelperText color="gray.400">Use 0 for unlimited downloads</Field.HelperText>
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label color="gray.200">Expires at (optional)</Field.Label>
                                    <Input
                                        type="datetime-local"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                        bg="gray.700"
                                        borderColor="gray.600"
                                        color="white"
                                    />
                                </Field.Root>
                            </HStack>
                            <Separator borderColor="gray.600" />
                            {fileInfo && (
                                <Box color="gray.300">
                                    <Text fontSize="sm" fontWeight="500" mb={2}>{fileInfo.name}</Text>
                                    {submitting && (
                                        <Box>
                                            <HStack justify="space-between" mb={2}>
                                                <Text fontSize="sm" color="gray.300">
                                                    {uploadStage === 'uploading' && `Uploading... ${Math.round(uploadProgress)}%`}
                                                    {uploadStage === 'merging' && 'Merging chunks...'}
                                                    {uploadStage === 'encrypting' && 'Encrypting...'}
                                                    {uploadStage === 'finalizing' && 'Finalizing...'}
                                                </Text>
                                                {uploadStage === 'uploading' && (
                                                    <Text fontSize="xs" color="gray.400">
                                                        {uploadSpeed > 0 ? `${formatBytes(uploadSpeed)}/s` : '0B/s'}
                                                    </Text>
                                                )}
                                                {uploadStage === 'uploading' && (
                                                    <Text fontSize="xs" color="gray.400">
                                                        {uploadedChunks}/{totalChunks} chunks
                                                    </Text>
                                                )}
                                            </HStack>
                                            <Progress.Root
                                                value={uploadStage === 'uploading' ? uploadProgress : 100}
                                                max={100}
                                                size="sm"
                                                colorPalette="purple"
                                                css={{ '& > div > div': { transition: 'width 0.15s ease-in-out' } }}
                                            >
                                                <Progress.Track>
                                                    <Progress.Range />
                                                </Progress.Track>
                                            </Progress.Root>
                                            {warnLabel && (
                                                <Text fontSize="sm" color="yellow.500" mt={2}>
                                                    {warnLabel}
                                                </Text>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </VStack>
                    )}
                </Dialog.Body>
                <Dialog.Footer>
                    <HStack justify="space-between" w="100%">
                        <HStack>
                            <Button variant="outline" color="white" borderColor="gray.600" _hover={{ bg: 'gray.700', color: 'white' }} onClick={closeAndReset} disabled={submitting}>
                                Cancel
                            </Button>
                            {step === 2 && (
                                <Button variant="ghost" color="white" _hover={{ bg: 'gray.700', color: 'white' }} onClick={handleBack} disabled={submitting}>Back</Button>
                            )}
                        </HStack>
                        {step === 1 ? (
                            <Button bg="purple.600" color="white" _hover={{ bg: 'purple.500' }} onClick={handleNext} disabled={!file}>Next</Button>
                        ) : (
                            <Button bg="purple.600" color="white" _hover={{ bg: 'purple.500' }} onClick={handleSubmit} disabled={submitting || Boolean(nameValidationError)}>
                                {submitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        )}
                    </HStack>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
            </Dialog.Content>
        </Dialog.Root>
    )
}

export default UploadDialog