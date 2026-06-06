import { useEffect, useState } from 'react'
import { Button, Dialog, HStack, Text, Textarea, VStack } from '@chakra-ui/react'
import { LuFlag } from 'react-icons/lu'

const reportReasons = [
	{ value: 'inappropriate', label: 'Inappropriate content' },
	{ value: 'spam', label: 'Spam or misleading' },
	{ value: 'other', label: 'Other' },
]

const FileReportDialog = ({ isOpen, onCancel, fileName, onConfirm, isSubmitting }) => {
	const [reason, setReason] = useState('inappropriate')
	const [description, setDescription] = useState('')

	useEffect(() => {
		if (!isOpen) {
			setReason('inappropriate')
			setDescription('')
		}
	}, [isOpen])

	const handleConfirm = () => {
		onConfirm(reason, description)
	}

	const canSubmit = reason !== 'other' || description.trim().length > 0

	return (
		<Dialog.Root open={isOpen} onOpenChange={(e) => { if (!e.open) onCancel() }} zIndex={9999}>
			<Dialog.Backdrop />
			<Dialog.Content position="fixed" top="40%" left="50%" transform="translate(-50%, -50%)" maxW="520px" bg="gray.800">
				<Dialog.Header>
					<Dialog.Title color="white">Report {fileName}</Dialog.Title>
				</Dialog.Header>
				<form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}>
					<Dialog.Body>
					<VStack spacing={4} align="stretch">
						<VStack spacing={2} align="stretch">
							<Text color="gray.200" fontWeight="semibold" fontSize="sm">
								Reason
							</Text>
							<HStack spacing={2} flexWrap="wrap">
								{reportReasons.map((item) => (
									<Button
										key={item.value}
										variant={reason === item.value ? 'solid' : 'outline'}
										bg={reason === item.value ? 'red.600' : 'transparent'}
										color="white"
										borderColor="gray.600"
										_hover={{ bg: reason === item.value ? 'red.500' : 'gray.700' }}
										onClick={() => setReason(item.value)}
									>
										{item.label}
									</Button>
								))}
							</HStack>
						</VStack>

						<VStack spacing={2} align="stretch">
							<Text color="gray.200" fontWeight="semibold" fontSize="sm">
								Description
							</Text>
							<Textarea
								placeholder="Add any extra context"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								bg="gray.700"
								borderColor="gray.600"
								color="white"
								minH="120px"
							/>
						</VStack>
					</VStack>
				</Dialog.Body>
				<Dialog.Footer>
					<HStack spacing={3} justify="flex-end">
						<Button variant="outline" color="white" borderColor="gray.600" _hover={{ bg: 'gray.700', color: 'white' }} onClick={onCancel}>
							Cancel
						</Button>
						<Button
							type="submit"
							bg="red.600"
							color="white"
							loading={isSubmitting}
							loadingText="Submitting"
							disabled={!canSubmit}
							_hover={{ bg: 'red.500' }}
						>
							<LuFlag />
							Submit Report
						</Button>
					</HStack>
				</Dialog.Footer>
				</form>
				<Dialog.CloseTrigger />
			</Dialog.Content>
		</Dialog.Root>
	)
}

export default FileReportDialog