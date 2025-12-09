import React, { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  VStack,
  Input,
  Button,
  Text,
  Link as ChakraLink,
  Flex,
  Spacer,
} from '@chakra-ui/react'

import { toaster } from '../components/ui/toaster'

import { useNavigate } from 'react-router-dom'

const RegisterPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toaster({
        title: 'Error',
        description: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)
    try {
      // TODO: Add your API call here
      toaster({
        title: 'Success',
        description: 'Account created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      navigate('/login')
    } catch (error) {
      toaster({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box bg="gray.800" py={4} px={8} boxShadow="md" borderBottom="2px" borderColor="purple.500">
        <Flex align="center" maxW="1200px" mx="auto">
          <Heading size="lg" color="purple.300" cursor="pointer" onClick={() => navigate('/')}>
            Share Your Thing
          </Heading>
          <Spacer />
        </Flex>
      </Box>

      {/* Register Form */}
      <Container maxW="500px" centerContent py={20}>
        <VStack spacing={8} w="full">
          <Heading 
            as="h1" 
            size="2xl" 
            color="purple.300"
            textAlign="center"
          >
            Create Account
          </Heading>

          <Box w="full" bg="gray.800" p={8} borderRadius="lg" boxShadow="lg" borderTop="2px" borderColor="purple.500">
            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                <VStack w="full" align="start">
                  <Text color="gray.300" fontSize="sm" fontWeight="500">Username *</Text>
                  <Input
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    bg="gray.700"
                    color="white"
                    borderColor="purple.500"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.3)' }}
                    value={formData.username}
                    onChange={handleChange}
                  />
                </VStack>

                <VStack w="full" align="start">
                  <Text color="gray.300" fontSize="sm" fontWeight="500">Email *</Text>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    bg="gray.700"
                    color="white"
                    borderColor="purple.500"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.3)' }}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </VStack>

                <VStack w="full" align="start">
                  <Text color="gray.300" fontSize="sm" fontWeight="500">Password *</Text>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    bg="gray.700"
                    color="white"
                    borderColor="purple.500"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.3)' }}
                    value={formData.password}
                    onChange={handleChange}
                  />
                </VStack>

                <VStack w="full" align="start">
                  <Text color="gray.300" fontSize="sm" fontWeight="500">Confirm Password *</Text>
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    bg="gray.700"
                    color="white"
                    borderColor="purple.500"
                    _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.3)' }}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </VStack>

                <Button
                  w="full"
                  bg="purple.600"
                  color="white"
                  size="lg"
                  type="submit"
                  isLoading={loading}
                  _hover={{
                    bg: 'purple.500',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  Sign Up
                </Button>
              </VStack>
            </form>

            <Text color="gray.400" textAlign="center" mt={6}>
              Already have an account?{' '}
              <ChakraLink 
                color="purple.400" 
                onClick={() => navigate('/login')}
                cursor="pointer"
                _hover={{ color: 'purple.300' }}
              >
                Sign In
              </ChakraLink>
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default RegisterPage
