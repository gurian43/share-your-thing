import { Button, Heading, Span, Text, VStack } from '@chakra-ui/react'
import { LuRefreshCw } from 'react-icons/lu'

const AccountOverviewSection = ({ user, usedStorage, onRecalculateStorage }) => {
    return (
        <VStack align="flex-start" spacing={6}>
            <Heading color="white" size="xl">Account Overview</Heading>
            <Text color="gray.400">Email: {user.email}</Text>
            <Text color="gray.400">Account Type: {user.admin ? 'Administrator' : 'Standard User'}</Text>
            <Text color="gray.400">
                Storage Used: {usedStorage} MB / {user.admin ? 'Unlimited' : `${(user.max_storage / (1024 * 1024)).toFixed(2)} MB`}
            </Text>
            <Text color="gray.400">Status: <Span color="green.400">{user.active ? 'Active' : 'Inactive'}</Span></Text>
            <Button onClick={onRecalculateStorage} _hover={{ bg: 'gray.800' }}>
                Recalculate Storage Usage <LuRefreshCw />
            </Button>
        </VStack>
    )
}

export default AccountOverviewSection