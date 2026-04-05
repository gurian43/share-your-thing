import { Box, Button, Card, Flex, HStack, IconButton, Input } from '@chakra-ui/react'
import { LuLayoutGrid, LuList, LuSearch, LuUpload } from 'react-icons/lu'

const DashboardControls = ({ viewMode, onViewChange, searchQuery, onSearch, onUpload }) => {
    return (
        <Card.Root bg="gray.800" borderColor="gray.700">
            <Card.Body>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                    <Button
                        bg="purple.600"
                        color="white"
                        _hover={{ bg: 'purple.500' }}
                        onClick={onUpload}
                    >
                        <LuUpload />
                        Upload File
                    </Button>

                    <HStack spacing={3}>
                        <Box position="relative" maxW={{ base: '100%', md: '300px' }} w="full">
                            <Input
                                placeholder="Search files..."
                                value={searchQuery}
                                onChange={(e) => onSearch(e.target.value)}
                                bg="gray.700"
                                borderColor="gray.600"
                                color="white"
                                _placeholder={{ color: 'gray.400' }}
                                pl={10}
                            />
                            <Box position="absolute" left={3} top="50%" transform="translateY(-50%)">
                                <LuSearch color="white" />
                            </Box>
                        </Box>

                        <HStack spacing={1} bg="gray.700" borderRadius="md" p={1}>
                            <IconButton
                                size="sm"
                                variant={viewMode === 'grid' ? 'solid' : 'ghost'}
                                colorPalette={viewMode === 'grid' ? 'purple' : 'gray'}
                                onClick={() => onViewChange('grid')}
                            >
                                <LuLayoutGrid />
                            </IconButton>
                            <IconButton
                                size="sm"
                                variant={viewMode === 'list' ? 'solid' : 'ghost'}
                                colorPalette={viewMode === 'list' ? 'purple' : 'gray'}
                                onClick={() => onViewChange('list')}
                            >
                                <LuList />
                            </IconButton>
                        </HStack>
                    </HStack>
                </Flex>
            </Card.Body>
        </Card.Root>
    )
}

export default DashboardControls
