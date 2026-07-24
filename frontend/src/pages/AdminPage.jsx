import { useEffect, useMemo, useState } from 'react'
import { Badge, Box, Button, Checkbox, Container, Heading, HStack, Input, Separator, Spinner, Stack, Text, VStack } from '@chakra-ui/react'

import Header from '../components/Header'
import Footer from '../components/Footer'
import { toaster } from '../components/ui/toaster'
import { useAuth } from '../context/AuthContext'
import { formatBytes } from '../utils/fileUtils'

const reasonLabels = {
  inappropriate: 'Inappropriate',
  spam: 'Spam',
  other: 'Other',
}

const formatDate = (value) => {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString('cs-CZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const AdminPage = () => {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('open')
  const [manualFileId, setManualFileId] = useState('')
  const [manualDeleting, setManualDeleting] = useState(false)
  const [siteSettings, setSiteSettings] = useState({
    allowUserRegistrations: true,
    allowUserUploads: true,
    allowUserDownloads: true,
  })
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  const loadSettings = async () => {
    setSettingsLoading(true)

    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load site settings')
      }

      setSiteSettings({
        allowUserRegistrations: Boolean(data.settings?.allowUserRegistrations ?? true),
        allowUserUploads: Boolean(data.settings?.allowUserUploads ?? true),
        allowUserDownloads: Boolean(data.settings?.allowUserDownloads ?? true),
      })
    } catch (err) {
      toaster.create({
        title: err.message || 'Failed to load site settings',
        type: 'error',
        duration: 4000,
      })
    } finally {
      setSettingsLoading(false)
    }
  }

  const loadReports = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'GET',
        credentials: 'include',
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load reports')
      }

      setReports(Array.isArray(data.reports) ? data.reports : [])
    } catch (err) {
      setError(err.message || 'Failed to load reports')
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Admin Dashboard - Share Your Thing'
    loadReports()
    loadSettings()
  }, [])

  const visibleReports = useMemo(() => {
    if (filter === 'all') return reports
    return reports.filter((report) => (filter === 'open' ? !report.resolved : report.resolved))
  }, [filter, reports])

  const openCount = reports.filter((report) => !report.resolved).length
  const resolvedCount = reports.filter((report) => report.resolved).length

  const updateReport = async (reportId, resolved) => {
    const request = fetch(`/api/admin/reports/${reportId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ resolved }),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update report')
      }
      return data
    })

    toaster.promise(request, {
      loading: { title: resolved ? 'Resolving report...' : 'Reopening report...' },
      success: { title: resolved ? 'Report resolved' : 'Report reopened' },
      error: { title: 'Failed to update report' },
    })

    const data = await request
    setReports((prev) => prev.map((report) => (
      report.id === reportId ? { ...report, resolved: data.report?.resolved ?? resolved } : report
    )))
  }

  const deleteReport = async (reportId) => {
    const request = fetch(`/api/admin/reports/${reportId}`, {
      method: 'DELETE',
      credentials: 'include',
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete report')
      }
      return data
    })

    toaster.promise(request, {
      loading: { title: 'Deleting report...' },
      success: { title: 'Report deleted' },
      error: { title: 'Failed to delete report' },
    })

    await request
    setReports((prev) => prev.filter((report) => report.id !== reportId))
  }

  const updateSiteSetting = async (key, value) => {
    setSavingSettings(true)

    const request = fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [key]: value }),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update site settings')
      }
      return data
    })

    toaster.promise(request, {
      loading: { title: 'Saving site settings...' },
      success: { title: 'Site settings updated' },
      error: { title: 'Failed to update settings' },
    })

    try {
      const data = await request
      setSiteSettings((prev) => ({
        ...prev,
        [key]: Boolean(data.settings?.[key] ?? value),
      }))
    } finally {
      setSavingSettings(false)
    }
  }

  const deleteFile = async (fileId, fileName = '') => {
    if (!fileId) {
      toaster.create({
        title: 'Enter a file ID first.',
        type: 'warning',
        duration: 3000,
      })
      return
    }

    const confirmed = window.confirm(
      `Delete ${fileName || 'this file'} permanently? This removes the file and any related reports.`
    )

    if (!confirmed) return

    setManualDeleting(true)
    try {
      const response = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete file')
      }

      toaster.create({
        title: data.message || 'File deleted successfully',
        type: 'success',
        duration: 4000,
      })
      setManualFileId('')
      setReports((prev) => prev.filter((report) => report.file?.id !== fileId))
    } catch (err) {
      toaster.create({
        title: err.message || 'Failed to delete file',
        type: 'error',
        duration: 4000,
      })
    } finally {
      setManualDeleting(false)
    }
  }

  return (
    <Box minH="100vh" bg="gray.900" display="flex" flexDirection="column">
      <Header />
      <Container maxW="1200px" py={10} flex="1">
        <VStack align="stretch" spacing={8} color="gray.200">
          <Box>
            <Heading size="2xl" color="white">
              Admin Dashboard
            </Heading>
            {user?.username && (
              <Text mt={2} color="gray.500" fontSize="sm">
                Signed in as {user.username}
              </Text>
            )}
          </Box>

          <HStack spacing={4} flexWrap="wrap">
            <Badge colorPalette="red" px={3} py={1} borderRadius="full">
              Open reports: {openCount}
            </Badge>
            <Badge colorPalette="green" px={3} py={1} borderRadius="full">
              Resolved: {resolvedCount}
            </Badge>
            <Badge colorPalette="purple" px={3} py={1} borderRadius="full">
              Total: {reports.length}
            </Badge>
          </HStack>

          <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={5}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" color="white">
                  Site-wide access controls
                </Heading>
                <Text fontSize="sm" color="gray.400" mt={1}>
                  Turn user registrations, uploads, and downloads on or off across the whole site. Admin accounts remain exempt.
                </Text>
              </Box>

              {settingsLoading ? (
                <Box py={2}>
                  <Spinner size="sm" color="purple.400" />
                </Box>
              ) : (
                <Stack spacing={4}>
                  <HStack justify="space-between" align="center">
                    <VStack align="flex-start" spacing={1}>
                      <Text color="white" fontWeight="bold">
                        User registrations
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        Allow new users to create accounts.
                      </Text>
                    </VStack>
                    <Checkbox.Root
                      colorPalette="purple"
                      checked={siteSettings.allowUserRegistrations}
                      disabled={savingSettings}
                      onCheckedChange={(details) => updateSiteSetting('allowUserRegistrations', details.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Root>
                  </HStack>

                  <Separator borderColor="gray.700" />

                  <HStack justify="space-between" align="center">
                    <VStack align="flex-start" spacing={1}>
                      <Text color="white" fontWeight="bold">
                        User uploads
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        Allow non-admin users to upload files.
                      </Text>
                    </VStack>
                    <Checkbox.Root
                      colorPalette="purple"
                      checked={siteSettings.allowUserUploads}
                      disabled={savingSettings}
                      onCheckedChange={(details) => updateSiteSetting('allowUserUploads', details.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Root>
                  </HStack>

                  <Separator borderColor="gray.700" />

                  <HStack justify="space-between" align="center">
                    <VStack align="flex-start" spacing={1}>
                      <Text color="white" fontWeight="bold">
                        User downloads
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        Allow non-admin users to download files.
                      </Text>
                    </VStack>
                    <Checkbox.Root
                      colorPalette="purple"
                      checked={siteSettings.allowUserDownloads}
                      disabled={savingSettings}
                      onCheckedChange={(details) => updateSiteSetting('allowUserDownloads', details.checked)}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Root>
                  </HStack>
                </Stack>
              )}
            </VStack>
          </Box>

          <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={5}>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" color="white">
                  Manual file deletion
                </Heading>
                <Text fontSize="sm" color="gray.400" mt={1}>
                  Paste a file ID here to remove it from storage and delete any linked reports.
                </Text>
              </Box>
              <HStack align="stretch" spacing={3} flexWrap="wrap">
                <Input
                  flex="1"
                  minW={{ base: '100%', md: '420px' }}
                  placeholder="File ID"
                  value={manualFileId}
                  onChange={(e) => setManualFileId(e.target.value)}
                  bg="gray.700"
                  borderColor="gray.600"
                  color="white"
                />
                <Button
                  bg="red.600"
                  color="white"
                  _hover={{ bg: 'red.500' }}
                  loading={manualDeleting}
                  loadingText="Deleting"
                  onClick={() => deleteFile(manualFileId)}
                >
                  Delete file
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Box>
            <HStack spacing={3} mb={4} flexWrap="wrap">
              <Button
                variant={filter === 'open' ? 'solid' : 'outline'}
                colorPalette="red"
                onClick={() => setFilter('open')}
              >
                Open
              </Button>
              <Button
                variant={filter === 'resolved' ? 'solid' : 'outline'}
                colorPalette="green"
                onClick={() => setFilter('resolved')}
              >
                Resolved
              </Button>
              <Button
                variant={filter === 'all' ? 'solid' : 'outline'}
                colorPalette="purple"
                onClick={() => setFilter('all')}
              >
                All reports
              </Button>
              <Button variant="ghost" color="gray.300" onClick={loadReports}>
                Refresh
              </Button>
            </HStack>

            {loading ? (
              <Box py={16} textAlign="center">
                <Spinner size="xl" color="purple.400" />
              </Box>
            ) : error ? (
              <Box bg="gray.800" border="1px solid" borderColor="red.800" borderRadius="xl" p={5}>
                <Text color="red.300">{error}</Text>
              </Box>
            ) : visibleReports.length === 0 ? (
              <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={8}>
                <Text color="gray.400">No reports match the current filter.</Text>
              </Box>
            ) : (
              <Stack spacing={4}>
                {visibleReports.map((report) => (
                  <Box
                    key={report.id}
                    bg="gray.800"
                    border="1px solid"
                    borderColor="gray.700"
                    borderRadius="xl"
                    p={5}
                  >
                    <Stack spacing={4}>
                      <HStack justify="space-between" align="flex-start" flexWrap="wrap">
                        <VStack align="flex-start" spacing={1}>
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorPalette="red">
                              {reasonLabels[report.reason] || report.reason}
                            </Badge>
                            <Badge colorPalette={report.resolved ? 'green' : 'orange'}>
                              {report.resolved ? 'Resolved' : 'Open'}
                            </Badge>
                          </HStack>
                          <Heading size="sm" color="white">
                            {report.file?.name || 'Deleted file'}
                          </Heading>
                          <Text color="gray.400" fontSize="sm">
                            Reported {formatDate(report.createdAt)}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Report ID: {report.id}
                          </Text>
                        </VStack>
                        <HStack spacing={2} flexWrap="wrap">
                          <Button
                            variant="outline"
                            colorPalette={report.resolved ? 'orange' : 'green'}
                            onClick={() => updateReport(report.id, !report.resolved)}
                          >
                            {report.resolved ? 'Reopen' : 'Mark resolved'}
                          </Button>
                          <Button
                            variant="outline"
                            colorPalette="red"
                            onClick={() => deleteReport(report.id)}
                          >
                            Delete report
                          </Button>
                          {report.file?.id && (
                            <Button
                              bg="red.600"
                              color="white"
                              _hover={{ bg: 'red.500' }}
                              onClick={() => deleteFile(report.file.id, report.file.name)}
                            >
                              Delete file
                            </Button>
                          )}
                        </HStack>
                      </HStack>

                      <Separator borderColor="gray.700" />

                      <HStack spacing={8} align="flex-start" flexWrap="wrap">
                        <VStack align="flex-start" spacing={1} minW="220px">
                          <Text color="gray.500" fontSize="xs" textTransform="uppercase">
                            Reporter
                          </Text>
                          <Text color="white">
                            {report.reporter?.username || 'Unknown user'}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            {report.reporter?.email || 'No email available'}
                          </Text>
                        </VStack>
                        <VStack align="flex-start" spacing={1} minW="240px">
                          <Text color="gray.500" fontSize="xs" textTransform="uppercase">
                            File
                          </Text>
                          <Text color="white">
                            {report.file?.name || 'File removed'}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            {report.file
                              ? `${report.file.visibility} · ${formatBytes(report.file.size)} · ${report.file.active ? 'active' : 'inactive'}`
                              : 'The file record no longer exists.'}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            File ID: {report.file?.id || 'Unknown'}
                          </Text>
                        </VStack>
                        <VStack align="flex-start" spacing={1} minW="220px">
                          <Text color="gray.500" fontSize="xs" textTransform="uppercase">
                            Owner
                          </Text>
                          <Text color="white">
                            {report.file?.owner?.username || 'Unknown owner'}
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            {report.file?.owner?.email || 'No email available'}
                          </Text>
                        </VStack>
                      </HStack>

                      {report.description && (
                        <Box bg="gray.900" borderRadius="lg" p={4} border="1px solid" borderColor="gray.700">
                          <Text color="gray.300" whiteSpace="pre-wrap">
                            {report.description}
                          </Text>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </VStack>
      </Container>
      <Footer />
    </Box>
  )
}

export default AdminPage