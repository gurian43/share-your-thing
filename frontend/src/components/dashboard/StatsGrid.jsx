import { Grid, Card, Text, HStack, Skeleton } from '@chakra-ui/react'
import { LuInfinity } from 'react-icons/lu'

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
                            <Skeleton height="26px" width="70%" mt={2} />
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
