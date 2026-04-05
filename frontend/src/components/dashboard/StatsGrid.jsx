import { Grid, Card, Text, HStack, Box } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { LuInfinity } from 'react-icons/lu'

const pulse = keyframes`
  0%, 100% { opacity: 0.45; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-1px); }
`

const LoadingBar = () => (
    <Box mt={2} h="26px" w="70%" borderRadius="md" overflow="hidden" bg="gray.700">
        <Box
            h="100%"
            w="100%"
            bg="linear-gradient(90deg, rgba(55, 65, 81, 0.35) 0%, rgba(168, 85, 247, 0.55) 50%, rgba(55, 65, 81, 0.35) 100%)"
            animation={`${pulse} 1.25s ease-in-out infinite`}
        />
    </Box>
)

const statsCardItems = [
    { key: 'totalStorage', label: 'Total Storage', color: 'white' },
    { key: 'usedStorage', label: 'Used Storage', color: 'purple.300' },
    { key: 'filesCount', label: 'Total Files', color: 'white' },
    { key: 'sharedCount', label: 'Shared Files', color: 'white' },
]

const StatsGrid = ({ stats, loading }) => {
    return (
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
            {statsCardItems.map((item) => (
                <Card.Root key={item.key} bg="gray.800" borderColor="gray.700">
                    <Card.Body>
                        <Text color="gray.400" fontSize="sm">{item.label}</Text>
                        {loading ? (
                            <LoadingBar />
                        ) : item.key === 'totalStorage' && stats.isAdmin ? (
                            <HStack spacing={2} mt={2}>
                                <LuInfinity size={28} color="white" />
                                <Text color="white" fontSize="2xl" fontWeight="bold">Unlimited</Text>
                            </HStack>
                        ) : (
                            <Text color={item.color} fontSize="2xl" fontWeight="bold">{stats[item.key]}</Text>
                        )}
                    </Card.Body>
                </Card.Root>
            ))}
        </Grid>
    )
}

export default StatsGrid
