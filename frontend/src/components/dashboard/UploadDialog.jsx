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
    Select,
    Separator,
    Text,
    Textarea,
    VStack,
} from '@chakra-ui/react'
import { toaster } from '../ui/toaster'
import { LuFile, LuUpload } from 'react-icons/lu'

const UploadDialog = ({ isOpen, onClose, onUploaded }) => {
    const [step, setStep] = useState(1)
    const [file, setFile] = useState(null)
    const [description, setDescription] = useState('')
    const [visibility, setVisibility] = useState('unlisted')
    const [password, setPassword] = useState('')
    const [maxDownloads, setMaxDownloads] = useState(0)
    const [expiresAt, setExpiresAt] = useState('')
    const [submitting, setSubmitting] = useState(false)

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
        const formData = new FormData()
        formData.append('file', file)
        formData.append('description', description)
        formData.append('visibility', visibility)
        if (password) formData.append('password', password)
        if (maxDownloads && maxDownloads > 0) formData.append('max_downloads', maxDownloads)
        if (expiresAt) formData.append('expires_at', expiresAt)

        const promise = fetch('/api/file/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData,
        })

        setSubmitting(true)
        toaster.promise(promise, {
            loading: { title: 'Uploading file...' },
            success: { title: 'File uploaded successfully!' },
            error: { title: 'Failed to upload file.' },
        })

        const res = await promise.finally(() => setSubmitting(false))
        if (res.ok) {
            const data = await res.json()
            onUploaded?.(data.file)
            closeAndReset()
        }
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) closeAndReset() }} zIndex={9999}>
            <Dialog.Backdrop />
            <Dialog.Content position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" maxW="600px" bg="gray.800">
                <Dialog.Header>
                    <Dialog.Title color="white">{step === 1 ? 'Upload File' : 'File Settings'}</Dialog.Title>
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
                                        placeholder="Set a password"
                                        bg="gray.700"
                                        borderColor="gray.600"
                                        color="white"
                                    />
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
                                    <Text fontSize="sm">Uploading: {fileInfo.name}</Text>
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
                                <Button variant="ghost" onClick={handleBack} disabled={submitting}>Back</Button>
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
