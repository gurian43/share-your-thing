import { Box, HStack, Link, Text } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'

const Footer = () => {
	const year = new Date().getFullYear()

	return (
		<Box
			bg="gray.800"
			color="gray.300"
			h="32px"
			w="full"
			mt="auto"
			display="flex"
			alignItems="center"
			px={{ base: 4, md: 8 }}
		>
			<HStack w="full" justifyContent="space-between" spacing={6} flexWrap="wrap">
				<Text fontSize="sm">© {year} Share Your Thing</Text>
				<HStack spacing={16}>
					<Link
						as={RouterLink}
						to="/faq"
						color="gray.200"
						_hover={{ color: 'purple.200' }}
					>
						FAQ
					</Link>
					<Link
						as={RouterLink}
						to="/privacy"
						color="gray.200"
						_hover={{ color: 'purple.200' }}
					>
						Privacy Policy
					</Link>
				</HStack>
			</HStack>
		</Box>
	)
}

export default Footer