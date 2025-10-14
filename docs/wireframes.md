# Share Your Thing - Wireframes

# THIS IS NOT FINAL

## 1. Homepage / Landing Page

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARE YOUR THING                         │
│                                                             │
│  [Logo]              [Login] [Register] [About] [FAQ]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         🗂️ Share Files Easily & Securely                   │
│                                                             │
│    Upload, share, and manage your files with privacy       │
│              controls and download limits                   │
│                                                             │
│                  [Upload File] [Browse Files]              │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   🔒 Private    │ │  👁️ Unlisted   │ │   🌐 Public    ││
│  │   Files         │ │   Files         │ │   Files         ││
│  │   Secure &      │ │   Share with    │ │   Everyone      ││
│  │   Protected     │ │   Link only     │ │   can access    ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│  Recent Uploads:                                            │
│  • document.pdf (5 downloads)                              │
│  • image.jpg (12 downloads)                                │
│  • archive.zip (3 downloads)                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│           © 2025 Share Your Thing | Privacy | Terms        │
└─────────────────────────────────────────────────────────────┘
```

## 2. Upload Page

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]                Upload File                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              📎 Drop files here                         ││
│  │                    or                                   ││
│  │              [Choose Files]                             ││
│  │                                                         ││
│  │           Supported: PDF, Images, Documents             ││
│  │              Max size: 100MB                            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  File Settings:                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Filename: [________________]                            ││
│  │                                                         ││
│  │ Description:                                            ││
│  │ [_____________________________________________]         ││
│  │ [_____________________________________________]         ││
│  │                                                         ││
│  │ Visibility: (•) Private  ( ) Unlisted  ( ) Public      ││
│  │                                                         ││
│  │ Password Protection: [ ] Enable                         ││
│  │ Password: [________________]                            ││
│  │                                                         ││
│  │ Download Limit: [____] (leave empty for unlimited)     ││
│  │                                                         ││
│  │ Expiration: [____] days (leave empty for no expiry)    ││
│  │                                                         ││
│  │ Encryption: [✓] Encrypt file                           ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│                    [Cancel] [Upload File]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 3. File Management / Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  [Home] [Upload] [Dashboard] [Profile] [Logout]            │
├─────────────────────────────────────────────────────────────┤
│                     My Files                               │
│                                                             │
│  [Upload New File]    Search: [___________] [🔍]           │
│                                                             │
│  Filter: [All ▼] [Private ▼] [This Month ▼]               │
│                                                             │
│ ┌───────────────────────────────────────────────────────────┐│
│ │📄 document.pdf              │ Private │ 2.5MB │ 5/50 ⬇️ ││
│ │   School project document   │ Oct 10  │       │ [Edit][⚙️]││
│ ├─────────────────────────────┼─────────┼───────┼──────────┤│
│ │🖼️ vacation.jpg              │ Public  │ 1.2MB │ 23 ⬇️   ││
│ │   Beach vacation photo      │ Oct 8   │       │ [Edit][⚙️]││
│ ├─────────────────────────────┼─────────┼───────┼──────────┤│
│ │📦 backup.zip               │ Unlisted│ 45MB  │ 2 ⬇️    ││
│ │   System backup files       │ Oct 5   │       │ [Edit][⚙️]││
│ ├─────────────────────────────┼─────────┼───────┼──────────┤│
│ │🎵 song.mp3                 │ Private │ 4.1MB │ 0 ⬇️    ││
│ │   My favorite song          │ Oct 3   │       │ [Edit][⚙️]││
│ └─────────────────────────────┴─────────┴───────┴──────────┘│
│                                                             │
│  Total Files: 24 | Total Storage: 156MB/1GB               │
│                                                             │
│                    [1] [2] [3] [Next]                      │
└─────────────────────────────────────────────────────────────┘
```

## 4. File View / Download Page

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back to Files]           File Details                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📄 document.pdf                                           │
│                                                             │
│  Description: School project document about renewable      │
│  energy sources and their environmental impact.            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ File Information:                                       ││
│  │ • Size: 2.5 MB                                         ││
│  │ • Uploaded: October 10, 2025                           ││
│  │ • Downloads: 5 / 50                                    ││
│  │ • Visibility: Private                                  ││
│  │ • Expires: Never                                       ││
│  │ • Encrypted: Yes                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  Password Protection:                                       │
│  Password: [________________] [Verify]                     │
│                                                             │
│                    [📥 Download File]                      │
│                                                             │
│  Share this file:                                          │
│  Link: https://share-your-thing.com/f/abc123              │
│  [📋 Copy Link] [📧 Email] [📱 QR Code]                   │
│                                                             │
│  Owner Actions:                                             │
│  [✏️ Edit Details] [🔒 Change Password] [🗑️ Delete]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 5. Login Page

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARE YOUR THING                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        Login                                │
│                                                             │
│              ┌─────────────────────────────┐                │
│              │                             │                │
│              │ Email:                      │                │
│              │ [_________________________] │                │
│              │                             │                │
│              │ Password:                   │                │
│              │ [_________________________] │                │
│              │                             │                │
│              │ [ ] Remember me             │                │
│              │                             │                │
│              │        [Sign In]            │                │
│              │                             │                │
│              │     Forgot password?        │                │
│              │                             │                │
│              └─────────────────────────────┘                │
│                                                             │
│              Don't have an account?                         │
│                   [Sign up here]                           │
│                                                             │
│                                                             │
│                 [← Back to Home]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 6. FAQ Page (Current File)

```
┌─────────────────────────────────────────────────────────────┐
│  [Home] [Upload] [About] [FAQ] [Contact]                   │
├─────────────────────────────────────────────────────────────┤
│                Frequently Asked Questions                   │
│                                                             │
│  ▼ What file types are supported?                          │
│     We support most common file types including PDF,       │
│     images (JPG, PNG, GIF), documents (DOC, DOCX),        │
│     archives (ZIP, RAR), and media files.                  │
│                                                             │
│  ▼ What's the maximum file size?                           │
│     Free users can upload files up to 100MB.              │
│     Premium users have a 1GB limit per file.              │
│                                                             │
│  ▼ How long are files stored?                              │
│     Files are stored indefinitely unless you set an       │
│     expiration date or delete them manually.               │
│                                                             │
│  ▼ Is my data secure?                                      │
│     Yes! All files are encrypted and we never access       │
│     your private files. Password-protected files use       │
│     additional encryption layers.                          │
│                                                             │
│  ▼ Can I limit downloads?                                  │
│     Yes, you can set a maximum number of downloads         │
│     for any file. The file becomes inaccessible once       │
│     the limit is reached.                                  │
│                                                             │
│  ▼ What are the different visibility levels?              │
│     • Private: Only you can access                         │
│     • Unlisted: Anyone with the link can access            │
│     • Public: Listed in public directory                   │
│                                                             │
│  Still have questions? [Contact Support]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 7. Mobile Responsive Design (Smartphone)

```
┌─────────────────┐
│ ☰ SHARE THING   │
├─────────────────┤
│                 │
│ 🗂️ Share Files  │
│                 │
│ Upload, share   │
│ and manage your │
│ files securely  │
│                 │
│   [Upload File] │
│   [Browse Files]│
│                 │
│ Recent:         │
│ • document.pdf  │
│   5 downloads   │
│ • image.jpg     │
│   12 downloads  │
│                 │
│ [Login/Register]│
│                 │
├─────────────────┤
│ © 2025 SYT      │
└─────────────────┘
```

## Design Notes:

### Color Scheme Suggestions:
- Primary: #2563eb (Blue)
- Secondary: #64748b (Slate)
- Success: #059669 (Green)
- Warning: #d97706 (Orange)
- Danger: #dc2626 (Red)

### Key Features Highlighted:
1. **File Visibility Controls** - Private, Unlisted, Public
2. **Security Features** - Password protection, encryption
3. **Download Management** - Limits, tracking
4. **Expiration Settings** - Time-based file removal
5. **User Dashboard** - File management interface
6. **Mobile Responsive** - Works on all devices

### Next Steps:
1. Choose a UI framework (React + Tailwind CSS recommended)
2. Create component library based on these wireframes
3. Implement responsive breakpoints
4. Add loading states and error handling
5. Include accessibility features (ARIA labels, keyboard navigation)