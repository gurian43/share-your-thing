import {
    LuFile,
    LuFileText,
    LuFileImage,
    LuFileVideo,
    LuFileAudio,
    LuFileArchive,
    LuFileSpreadsheet,
} from 'react-icons/lu'

export const formatBytes = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export const getFileExtension = (fileName) => {
    if (!fileName) return ''
    const parts = fileName.split('.')
    return parts.length > 1 ? parts.pop().toLowerCase() : fileName.toLowerCase()
}

export const getFileType = (fileName) => {
    const ext = getFileExtension(fileName)
    return ext || 'unknown'
}

export const getFileIcon = (fileName, size = 24) => {
    const ext = getFileExtension(fileName)
    const iconProps = { size }
    switch (ext) {
        case 'pdf':
        case 'doc':
        case 'docx':
        case 'txt':
        case 'rtf':
            return <LuFileText {...iconProps} />
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'webp':
        case 'svg':
            return <LuFileImage {...iconProps} />
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'mkv':
        case 'webm':
            return <LuFileVideo {...iconProps} />
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
            return <LuFileAudio {...iconProps} />
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
        case 'gz':
            return <LuFileArchive {...iconProps} />
        case 'xlsx':
        case 'xls':
        case 'csv':
            return <LuFileSpreadsheet {...iconProps} />
        default:
            return <LuFile {...iconProps} />
    }
}
