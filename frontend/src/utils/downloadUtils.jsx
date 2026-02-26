import { createSHA256 } from 'hash-wasm'

const DB_NAME = 'download-cache'
const DB_VERSION = 1
const CHUNK_STORE = 'chunks'

const openDownloadDb = () => new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not available'))
        return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(CHUNK_STORE)) {
            const store = db.createObjectStore(CHUNK_STORE, { keyPath: 'key' })
            store.createIndex('fileId', 'fileId', { unique: false })
        }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
})

const waitForTx = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
})

const storeChunk = async (db, fileId, index, blob) => {
    const tx = db.transaction(CHUNK_STORE, 'readwrite')
    tx.objectStore(CHUNK_STORE).put({
        key: `${fileId}:${index}`,
        fileId,
        index,
        blob,
    })
    await waitForTx(tx)
}

const getChunksForFile = async (db, fileId) => {
    const tx = db.transaction(CHUNK_STORE, 'readonly')
    const store = tx.objectStore(CHUNK_STORE)
    const index = store.index('fileId')
    const request = index.getAll(IDBKeyRange.only(fileId))
    const chunks = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
    })
    await waitForTx(tx)
    return chunks.sort((a, b) => a.index - b.index)
}

const clearChunksForFile = async (db, fileId) => {
    const tx = db.transaction(CHUNK_STORE, 'readwrite')
    const store = tx.objectStore(CHUNK_STORE)
    const index = store.index('fileId')
    const keysRequest = index.getAllKeys(IDBKeyRange.only(fileId))
    const keys = await new Promise((resolve, reject) => {
        keysRequest.onsuccess = () => resolve(keysRequest.result || [])
        keysRequest.onerror = () => reject(keysRequest.error)
    })

    keys.forEach((key) => store.delete(key))
    await waitForTx(tx)
}

const triggerBrowserDownload = (blob, fileName) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
}

export const createDownloadTask = ({
    fileId,
    fileName,
    checksum,
    password,
    fileSize,
    onProgress,
}) => {
    const abortController = new AbortController()
    let paused = false
    let pauseResolver = null
    let started = false
    let finished = false
    let db = null
    let memoryChunks = []

    const waitForResume = () => new Promise((resolve) => {
        pauseResolver = resolve
    })

    const pause = () => {
        if (finished) return
        paused = true
    }

    const resume = () => {
        if (!paused) return
        paused = false
        if (pauseResolver) {
            pauseResolver()
            pauseResolver = null
        }
    }

    const cancel = () => {
        abortController.abort()
    }

    const start = async () => {
        if (started) return
        started = true

        const hasher = await createSHA256()
        hasher.init()

        let response = null
        let reader = null
        let chunkIndex = 0
        let downloadedBytes = 0

        try {
            try {
                db = await openDownloadDb()
                await clearChunksForFile(db, fileId)
            } catch {
                db = null
            }

            response = await fetch(`/api/file/${fileId}/download`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password || null }),
                signal: abortController.signal,
            })

            if (!response.ok) {
                let message = 'Download failed'
                try {
                    const data = await response.json()
                    message = data?.message || message
                } catch {
                    // ignore JSON parsing errors
                }
                const error = new Error(message)
                error.status = response.status
                throw error
            }

            if (!response.body) {
                throw new Error('Streaming not supported in this browser')
            }

            reader = response.body.getReader()

            let startTime = Date.now()
            let lastUpdateTime = startTime
            let lastBytes = 0
            let speed = 0

            while (true) {
                if (paused) {
                    await waitForResume()
                    // Reset speed calculation after resume
                    startTime = Date.now()
                    lastUpdateTime = startTime
                    lastBytes = downloadedBytes
                    speed = 0
                }

                const { value, done } = await reader.read()
                if (done) break
                if (!value) continue

                hasher.update(value)
                const blob = new Blob([value])

                if (db) {
                    await storeChunk(db, fileId, chunkIndex, blob)
                } else {
                    memoryChunks.push({ index: chunkIndex, blob })
                }

                downloadedBytes += value.byteLength
                
                // Calculate speed
                const now = Date.now()
                const timeDiff = now - lastUpdateTime
                if (timeDiff >= 500) {
                    const bytesDiff = downloadedBytes - lastBytes
                    speed = (bytesDiff / timeDiff) * 1000
                    lastUpdateTime = now
                    lastBytes = downloadedBytes
                }

                if (onProgress) {
                    const percent = fileSize ? (downloadedBytes / fileSize) * 100 : null
                    onProgress({ 
                        downloadedBytes, 
                        totalBytes: fileSize || null, 
                        percent,
                        speed 
                    })
                }

                chunkIndex += 1
            }

            // verify checksum
            const digest = hasher.digest('hex')
            if (checksum && checksum !== digest) {
                throw new Error('Checksum mismatch. Download corrupted.')
            }

            // merge and download
            const chunks = db ? await getChunksForFile(db, fileId) : memoryChunks
            const mergedBlob = new Blob(chunks.map((chunk) => chunk.blob), {
                type: response.headers.get('content-type') || 'application/octet-stream',
            })

            triggerBrowserDownload(mergedBlob, fileName)
        } finally {
            finished = true
            if (db) {
                await clearChunksForFile(db, fileId)
            } else {
                memoryChunks = []
            }
        }
    }

    return {
        start,
        pause,
        resume,
        cancel,
    }
}