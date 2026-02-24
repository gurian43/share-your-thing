import { useMemo, useState } from 'react'
import {
    Box,
    Button,
    createListCollection,
    Dialog,
    Field,
    FileUpload,
    HStack,
    Icon,
    Input,
    NumberInput,
    Progress,
    Select,
    Separator,
    Steps,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'
import { toaster } from '../ui/toaster'
import { LuFile, LuUpload } from 'react-icons/lu'
import { createSHA256 } from 'hash-wasm'

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

const UploadDialog = ({ isOpen, onClose, onUploaded }) => {
    const [step, setStep] = useState(1)
    const [file, setFile] = useState(null)
    const [description, setDescription] = useState('')
    const [visibility, setVisibility] = useState('unlisted')
    const [password, setPassword] = useState('')
    const [maxDownloads, setMaxDownloads] = useState(0)
    const [expiresAt, setExpiresAt] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadedChunks, setUploadedChunks] = useState(0)
    const [totalChunks, setTotalChunks] = useState(0)
    const [uploadStage, setUploadStage] = useState('idle') // idle, uploading, merging, encrypting

    const visibilityOptions = createListCollection({
        items: [
            { label: 'Private', value: 'private' },
            { label: 'Unlisted', value: 'unlisted' },
            { label: 'Public', value: 'public' },
        ]
    })

    const fileInfo = useMemo(() => {
        if (!file) return null
        return {
            name: file.name,
            size: file.size,
            type: file.type || 'file',
        }
    }, [file])

    const reset = () => {
        setStep(1)
        setFile(null)
        setDescription('')
        setVisibility('unlisted')
        setPassword('')
        setMaxDownloads('')
        setExpiresAt('')
        setSubmitting(false)
        setUploadProgress(0)
        setUploadedChunks(0)
        setTotalChunks(0)
        setUploadStage('idle')
    }

    const closeAndReset = () => {
        reset()
        onClose?.()
    }

    const handleNext = () => {
        if (!file) return
        setStep(2)
    }

    const handleBack = () => setStep(1)

    const handleSubmit = async () => {
        if (!file) return

        if (password && password.length > 32) {
            toaster.create({
                title: 'Password must be 32 characters or less',
                type: 'error',
                duration: 4000,
            })
            return
        }
        
        setSubmitting(true)

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
            setUploadStage('uploading')

            // check existing upload in local
            const uploadKey = `upload_${file.name}_${file.size}`
            const existingUpload = localStorage.getItem(uploadKey)
            let uploadId
            let startChunk = 0
            let uploadedChunks = []

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
                        
                        if (startChunk > 0) {
                            setUploadProgress((startChunk / chunks) * 100)
                            setUploadedChunks(startChunk)
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
                    fileName: file.name,
                    fileSize: file.size,
                    timestamp: Date.now()
                }))
            }

            // start checksum
            const hasher = await createSHA256();
            hasher.init();

            // upload chunks
            for (let i = 0; i < chunks; i++) {
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const chunkBuffer = await chunk.arrayBuffer();
                hasher.update(new Uint8Array(chunkBuffer));

                const uploaded = i + 1;
                const pct = (uploaded / chunks) * 100;
                setUploadedChunks(uploaded);
                setUploadProgress(pct);

                // Skip already uploaded chunks
                if (uploadedChunks.includes(i)) {
                    continue;
                }

                const chunkFormData = new FormData();
                chunkFormData.append('chunk', chunk);
                chunkFormData.append('chunkIndex', i);
                chunkFormData.append('totalChunks', chunks);
                chunkFormData.append('uploadId', uploadId);
                chunkFormData.append('fileName', file.name);

                toaster.update(toastId, {
                    title: 'Uploading...',
                    description: `${Math.round(pct)}% complete (${uploaded}/${chunks} chunks)`,
                    type: 'loading',
                    duration: 60000,
                })

                const chunkRes = await fetch('/api/file/upload/chunk', {
                    method: 'POST',
                    credentials: 'include',
                    body: chunkFormData,
                })

                if (!chunkRes.ok) {
                    throw new Error(`Failed to upload chunk ${i + 1}`)
                }
            }

            // Complete checksum
            const checksum = hasher.digest('hex');

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
                    fileName: file.name,
                    fileSize: file.size,
                    totalChunks: chunks,
                    checksum,
                    description,
                    visibility,
                    password: password || null,
                    max_downloads: maxDownloads && maxDownloads > 0 ? maxDownloads : null,
                    expires_at: expiresAt || null,
                }),
            })

            if (!mergeRes.ok) {
                throw new Error('Failed to finalize upload');
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
                description: `${file.name} uploaded and encrypted successfully`,
                type: 'success',
                duration: 4000,
            })

            closeAndReset()
        } catch (err) {
            console.error('Upload error:', err)
            setUploadStage('idle')
            toaster.update(toastId, {
                title: 'Upload failed',
                description: err?.message || 'An error occurred during upload',
                type: 'error',
                duration: 5000,
            })
        } finally {
            setSubmitting(false);
        }
    }

    const stepItems = [
        { title: 'Select File' },
        { title: 'Configure & Upload' },
    ];
    const stepIndex = Math.max(0, Math.min(1, step - 1));

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) closeAndReset() }} zIndex={9999}>
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
                                    {index < stepItems.length - 1 && <Steps.Separator />}
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
                                onFileChange={({ acceptedFiles }) => {
                                    const f = acceptedFiles?.[0]
                                    setFile(f || null)
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
                                            {Math.round(fileInfo.size / 1024)} KB
                                        </Text>
                                    </Box>
                                </HStack>
                            )}
                        </VStack>
                    ) : (
                        <VStack spacing={4} align="stretch">
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
                                    <Select.Root
                                        collection={visibilityOptions}
                                        value={[visibility]}
                                        onValueChange={(details) => setVisibility(details.value[0])}
                                        positioning={{ strategy: 'fixed', hideWhenDetached: true }}
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Label color="gray.200">Visibility</Select.Label>
                                        <Select.Control>
                                            <Select.Trigger
                                                bg="gray.700"
                                                borderColor="gray.600"
                                                color="white"
                                                cursor={"pointer"}
                                            >
                                                <Select.ValueText />
                                                <Select.IndicatorGroup>
                                                    <Select.Indicator color={"white"} />
                                                </Select.IndicatorGroup>
                                            </Select.Trigger>
                                        </Select.Control>
                                        <Select.Positioner>
                                            <Select.Content bg="gray.700" borderColor="gray.600">
                                                {visibilityOptions.items.map((visibility) => (
                                                <Select.Item cursor={"pointer"} color={"white"} item={visibility} key={visibility.value}>
                                                    {visibility.label}
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Select.Root>
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
                            <Button variant="outline" color="white" _hover={{ color: 'black' }} onClick={closeAndReset} disabled={submitting}>
                                Cancel
                            </Button>
                            {step === 2 && (
                                <Button variant="ghost" color="white" _hover={{ color: 'black' }} onClick={handleBack} disabled={submitting}>Back</Button>
                            )}
                        </HStack>
                        {step === 1 ? (
                            <Button bg="purple.600" color="white" onClick={handleNext} disabled={!file}>Next</Button>
                        ) : (
                            <Button bg="purple.600" color="white" onClick={handleSubmit} disabled={submitting}>
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