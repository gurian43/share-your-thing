import { useEffect } from 'react'
import {
  Accordion,
  Box,
  Container,
  Heading,
  Span,
  Text,
  VStack,
} from '@chakra-ui/react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const FaqPage = () => {
  useEffect(() => {
    document.title = 'FAQ - Share Your Thing'
  }, [])

  const faqItems = [
    {
      question: 'Do I need an account to upload files?',
      answer:
        'Yes. Uploading and managing files requires a registered account so your files can be linked to you and shown in your dashboard.',
    },
    {
      question: 'How can I share a file?',
      answer:
        'Open your dashboard, choose a file, and generate a share link. You can then send that link to anyone who should download the file.',
    },
    {
      question: 'Can I protect downloads with a password?',
      answer:
        'Yes. For selected files, you can enable password protection so only people with both the link and password can access the download.',
    },
    {
      question: 'How long are files stored?',
      answer:
        'Files can be automatically removed after their configured expiration time. Old or inactive files may also be cleaned up by maintenance scripts.',
    },
    {
      question: 'What file types are allowed?',
      answer:
        'Most common file formats are supported. Extremely large files or disallowed types may be rejected by server-side validation rules.',
    },
    {
      question: 'What should I do if a link does not work?',
      answer:
        'The file might be deleted, expired, or the URL might be incomplete. Ask the uploader to generate a new link and check that the full URL is copied.',
    },
  ]

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
      <Header />
      <Container maxW="900px" py={12} flex="1">
        <VStack align="flex-start" spacing={8} color="gray.200">
          <VStack align="flex-start" spacing={2}>
            <Heading size="lg">Frequently Asked Questions</Heading>
            <Text fontSize="sm" color="gray.400">
              Quick answers about using Share Your Thing.
            </Text>
          </VStack>

          <Accordion.Root collapsible w="full" spaceY={3}>
            {faqItems.map((item, index) => (
              <Accordion.Item
                key={item.question}
                value={`item-${index}`}
                bg="gray.800"
                borderWidth="1px"
                borderColor="gray.700"
                borderRadius="md"
                px={5}
              >
                <Accordion.ItemTrigger py={4} cursor="pointer">
                  <Span flex="1" textAlign="left" fontWeight="semibold" color="white">
                    {item.question}
                  </Span>
                  <Accordion.ItemIndicator color="gray.300" />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody pb={5}>
                    <Text fontSize="sm" color="gray.300" lineHeight="tall">
                      {item.answer}
                    </Text>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </VStack>
      </Container>
      <Footer />
    </Box>
  )
}

export default FaqPage