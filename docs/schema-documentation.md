# Database Schema Documentation

## Collections Summary

| Collection | Purpose | Related Collections |
|------------|---------|-------------------|
| `users` | User accounts and profiles | `files`, `votes`, `reports` |
| `files` | File metadata and sharing settings | `users`, `votes`, `reports` |
| `votes` | User voting on files | `users`, `files` |
| `reports` | Content moderation reports | `users`, `files` |

---

## 1. Users Collection

### Schema: `user.model.js`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | ✅ | Auto | Unique user identifier |
| `active` | Boolean | ❌ | `false` | Account activation status |
| `username` | String | ✅ | - | Unique username |
| `email` | String | ✅ | - | Unique email address |
| `passwordHash` | String | ✅ | - | Hashed password |
| `role` | String | ❌ | `"user"` | User role: `user` \| `admin` |
| `profile` | Object | ❌ | `{}` | User profile information |
| `profile.avatar_url` | String | ❌ | `""` | Profile picture URL |
| `profile.bio` | String | ❌ | `""` | User biography |
| `createdAt` | Date | ✅ | Auto | Account creation timestamp |
| `updatedAt` | Date | ✅ | Auto | Last update timestamp |

---

## 2. Files Collection

### Schema: `file.model.js`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | ✅ | Auto | Unique file identifier |
| `owner_id` | ObjectId | ✅ | - | Reference to `users._id` |
| `file_name` | String | ✅ | - | Original filename |
| `file_path` | String | ✅ | - | Server file path |
| `file_size` | Number | ✅ | - | File size in bytes |
| `visibility` | String | ❌ | `"unlisted"` | Access level: `private` \| `unlisted` \| `public` |
| `password` | String | ❌ | `null` | Password hash for protected files |
| `description` | String | ❌ | `""` | File description |
| `checksum` | String | ✅ | - | SHA256 hash for integrity |
| `download_count` | Number | ❌ | `0` | Number of downloads |
| `max_downloads` | Number | ❌ | `null` | Download limit (null = unlimited) |
| `expires_at` | Date | ❌ | `null` | Expiration date (null = never) |
| `encrypted` | Boolean | ❌ | `false` | File encryption status |
| `uploaded_at` | Date | ❌ | `Date.now` | Upload timestamp |
| `createdAt` | Date | ✅ | Auto | Record creation timestamp |
| `updatedAt` | Date | ✅ | Auto | Last update timestamp |


### Relationships
- `owner_id` → `users._id` (Many-to-One)

---

## 3. Votes Collection

### Schema: `vote.model.js`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | ✅ | Auto | Unique vote identifier |
| `user_id` | ObjectId | ✅ | - | Reference to `users._id` |
| `file_id` | ObjectId | ✅ | - | Reference to `files._id` |
| `value` | Number | ✅ | - | Vote value: `-1` (downvote) \| `1` (upvote) |
| `createdAt` | Date | ✅ | Auto | Vote creation timestamp |
| `updatedAt` | Date | ✅ | Auto | Last update timestamp |


### Relationships
- `user_id` → `users._id` (Many-to-One)
- `file_id` → `files._id` (Many-to-One)

---

## 4. Reports Collection

### Schema: `report.model.js`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | ✅ | Auto | Unique report identifier |
| `reporter_id` | ObjectId | ✅ | - | Reference to `users._id` (reporter) |
| `file_id` | ObjectId | ✅ | - | Reference to `files._id` (reported file) |
| `reason` | String | ✅ | - | Report reason: `inappropriate` \| `spam` \| `other` |
| `description` | String | ❌ | `""` | Additional details |
| `resolved` | Boolean | ❌ | `false` | Resolution status |
| `createdAt` | Date | ✅ | Auto | Report creation timestamp |
| `updatedAt` | Date | ✅ | Auto | Last update timestamp |

### Relationships
- `reporter_id` → `users._id` (Many-to-One)
- `file_id` → `files._id` (Many-to-One)

---

## Relationships Diagram

```
┌─────────────────┐    owner_id    ┌─────────────────┐
│     Users       │◄──────────────┤     Files       │
│                 │                │                 │
│ • _id           │                │ • _id           │
│ • username      │                │ • owner_id      │
│ • email         │                │ • file_name     │
│ • passwordHash  │                │ • visibility    │
│ • role          │                │ • password      │
│ • profile       │                │ • download_count│
└─────────────────┘                └─────────────────┘
        ▲                                   ▲
        │                                   │
        │ user_id                    file_id │
        │                                   │
┌─────────────────┐                ┌─────────────────┐
│     Votes       │                │    Reports      │
│                 │                │                 │
│ • _id           │                │ • _id           │
│ • user_id       │                │ • reporter_id   │
│ • file_id       │                │ • file_id       │
│ • value         │                │ • reason        │
└─────────────────┘                │ • resolved      │
                                   └─────────────────┘
```