# Reels API Documentation

## Base URL
```
/reels
```

## Authentication
All endpoints (except health check) require JWT authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Table of Contents
1. [Tenant (Student) APIs](#tenant-student-apis)
2. [Reels APIs](#reels-apis)
3. [Admin Features](#admin-features)

---

# Tenant (Student) APIs

## Profile Management

### Get My Profile
Retrieve the authenticated student's profile information.

**Endpoint:** `GET /reels/profile/me`

**Authentication:** Required (StudentGuard)

**Response:**
```json
{
  "userId": "student-123",
  "displayName": "John Doe",
  "profilePhotoUrl": "https://example.com/photo.jpg",
  "bio": "Moving to London this fall!",
  "followersCount": 150,
  "followingCount": 75,
  "status": "ACTIVELY_MOVING",
  "isFollowedByViewer": false,
  "uploadedReels": [
    {
      "id": "reel-123",
      "videoUrl": "https://example.com/video.mp4",
      "durationSeconds": 30,
      "wasTrimmed": false,
      "caption": "Check out my new place!",
      "tags": ["apartment", "london"],
      "likesCount": 45,
      "commentsCount": 12,
      "sharesCount": 3,
      "popularityScore": 8.5,
      "isFlagged": false,
      "createdAt": "2026-03-20T10:30:00Z",
      "updatedAt": "2026-03-20T10:30:00Z",
      "creator": {
        "userId": "student-123",
        "displayName": "John Doe",
        "profilePhotoUrl": "https://example.com/photo.jpg",
        "status": "ACTIVELY_MOVING"
      },
      "isLikedByViewer": true,
      "isSharedByViewer": false
    }
  ],
  "sharedReels": []
}
```

**Status Codes:**
- `200 OK` - Profile retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student

---

### Update My Profile
Update the authenticated student's profile information.

**Endpoint:** `PATCH /reels/profile/me`

**Authentication:** Required (StudentGuard)

**Request Body:**
```json
{
  "displayName": "Jane Doe",
  "profilePhotoUrl": "https://example.com/new-photo.jpg",
  "bio": "Moving to Paris next year!"
}
```

**Response:**
```json
{
  "userId": "student-123",
  "displayName": "Jane Doe",
  "profilePhotoUrl": "https://example.com/new-photo.jpg",
  "bio": "Moving to Paris next year!",
  "followersCount": 150,
  "followingCount": 75,
  "status": "ACTIVELY_MOVING",
  "isFollowedByViewer": false,
  "uploadedReels": [],
  "sharedReels": []
}
```

**Status Codes:**
- `200 OK` - Profile updated successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student

---

### Search Profiles
Search for student profiles by display name or keyword.

**Endpoint:** `GET /reels/profiles/search`

**Authentication:** Required (JwtAuthGuard)

**Query Parameters:**
- `q` (string, required) - Search keyword (matches against display name)
- `limit` (number, optional) - Number of results to return (default: 20)

**Response:**
```json
[
  {
    "userId": "student-456",
    "displayName": "Alice Smith",
    "profilePhotoUrl": "https://example.com/alice-photo.jpg",
    "status": "ACTIVELY_MOVING"
  }
]
```

**Status Codes:**
- `200 OK` - Profiles returned successfully
- `400 Bad Request` - `q` parameter is missing or empty
- `401 Unauthorized` - Invalid or missing JWT token

---

### Get Student Profile by ID
Retrieve another student's profile with their public information.

**Endpoint:** `GET /reels/profile/:studentId`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `studentId` (string, required) - The ID of the student whose profile to retrieve

**Query Parameters:** None

**Response:**
```json
{
  "userId": "student-456",
  "displayName": "Alice Smith",
  "profilePhotoUrl": "https://example.com/alice-photo.jpg",
  "bio": "Moving to Berlin!",
  "followersCount": 200,
  "followingCount": 100,
  "status": "ACTIVELY_MOVING",
  "isFollowedByViewer": true,
  "uploadedReels": [
    {
      "id": "reel-456",
      "videoUrl": "https://example.com/alice-video.mp4",
      "durationSeconds": 45,
      "wasTrimmed": true,
      "caption": "Apartment tour!",
      "tags": ["berlin", "apartment"],
      "likesCount": 120,
      "commentsCount": 25,
      "sharesCount": 10,
      "popularityScore": 9.2,
      "isFlagged": false,
      "createdAt": "2026-03-19T14:20:00Z",
      "updatedAt": "2026-03-19T14:20:00Z",
      "creator": {
        "userId": "student-456",
        "displayName": "Alice Smith",
        "profilePhotoUrl": "https://example.com/alice-photo.jpg",
        "status": "ACTIVELY_MOVING"
      },
      "isLikedByViewer": false,
      "isSharedByViewer": false
    }
  ],
  "sharedReels": []
}
```

**Status Codes:**
- `200 OK` - Profile retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Student not found

---

## Following Management

### Follow Student
Follow a student to see their reels in your feed.

**Endpoint:** `POST /reels/profile/:studentId/follow`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `studentId` (string, required) - The ID of the student to follow

**Request Body:** Empty

**Response:**
```json
{
  "userId": "student-123",
  "followingCount": 76
}
```

**Status Codes:**
- `201 Created` - Successfully followed the student
- `400 Bad Request` - Cannot follow yourself or already following
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Student not found

---

### Unfollow Student
Stop following a student.

**Endpoint:** `DELETE /reels/profile/:studentId/follow`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `studentId` (string, required) - The ID of the student to unfollow

**Request Body:** Empty

**Response:**
```json
{
  "userId": "student-123",
  "followingCount": 75
}
```

**Status Codes:**
- `200 OK` - Successfully unfollowed the student
- `400 Bad Request` - Not following this student
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Student not found

---

### Get Followers
Retrieve the list of students who follow the specified student, including their profile details. Only the student themselves or an admin can access this endpoint.

**Endpoint:** `GET /reels/profile/:studentId/followers`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `studentId` (string, required) - The ID of the student whose followers to retrieve

**Response:**
```json
[
  {
    "userId": "student-456",
    "displayName": "Alice Smith",
    "profilePhotoUrl": "https://example.com/alice-photo.jpg",
    "status": "ACTIVE",
    "followedAt": "2026-03-21T10:00:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Followers retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - Requester is not the student or an admin
- `404 Not Found` - Student not found

---

### Get Following
Retrieve the list of students that the specified student is following, including their profile details. Only the student themselves or an admin can access this endpoint.

**Endpoint:** `GET /reels/profile/:studentId/following`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `studentId` (string, required) - The ID of the student whose following list to retrieve

**Response:**
```json
[
  {
    "userId": "student-789",
    "displayName": "Bob Jones",
    "profilePhotoUrl": "https://example.com/bob-photo.jpg",
    "status": "ACTIVE",
    "followedAt": "2026-03-20T14:30:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Following list retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - Requester is not the student or an admin
- `404 Not Found` - Student not found

---

# Reels APIs

## Video Upload

### Upload Video
Upload a video file to be used when creating a reel. Maximum file size: 100 MB (configurable via `REELS_VIDEO_MAX_UPLOAD_BYTES`).

**Endpoint:** `POST /reels/upload-video`

**Authentication:** Required (StudentGuard)

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `video` (file, required) - Video file (must be video/* MIME type)

**Response:**
```json
{
  "videoUrl": "https://cdn.example.com/uploads/video-12345.mp4",
  "durationSeconds": 30
}
```

**Status Codes:**
- `201 Created` - Video uploaded successfully
- `400 Bad Request` - Invalid file type or exceeds size limit
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `413 Payload Too Large` - File exceeds maximum upload size

---

## Reel Management

### Create Reel
Create a new reel with a video URL and optional captions/tags.

**Endpoint:** `POST /reels`

**Authentication:** Required (StudentGuard)

**Request Body:**
```json
{
  "videoUrl": "https://cdn.example.com/uploads/video-12345.mp4",
  "durationSeconds": 30,
  "caption": "Check out my apartment!",
  "tags": ["apartment", "london", "furnished"]
}
```

**Response:**
```json
{
  "id": "reel-789",
  "videoUrl": "https://cdn.example.com/uploads/video-12345.mp4",
  "durationSeconds": 30,
  "wasTrimmed": false,
  "caption": "Check out my apartment!",
  "tags": ["apartment", "london", "furnished"],
  "likesCount": 0,
  "commentsCount": 0,
  "sharesCount": 0,
  "popularityScore": 0,
  "isFlagged": false,
  "createdAt": "2026-03-21T08:15:00Z",
  "updatedAt": "2026-03-21T08:15:00Z",
  "creator": {
    "userId": "student-123",
    "displayName": "John Doe",
    "profilePhotoUrl": "https://example.com/photo.jpg",
    "status": "ACTIVELY_MOVING"
  },
  "isLikedByViewer": false,
  "isSharedByViewer": false
}
```

**Status Codes:**
- `201 Created` - Reel created successfully
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student

---

### Get Reel by ID
Retrieve a specific reel by its ID.

**Endpoint:** `GET /reels/:reelId`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to retrieve

**Response:**
```json
{
  "id": "reel-789",
  "videoUrl": "https://cdn.example.com/uploads/video-12345.mp4",
  "durationSeconds": 30,
  "wasTrimmed": false,
  "caption": "Check out my apartment!",
  "tags": ["apartment", "london", "furnished"],
  "likesCount": 45,
  "commentsCount": 8,
  "sharesCount": 2,
  "popularityScore": 7.8,
  "isFlagged": false,
  "createdAt": "2026-03-21T08:15:00Z",
  "updatedAt": "2026-03-21T08:15:00Z",
  "creator": {
    "userId": "student-123",
    "displayName": "John Doe",
    "profilePhotoUrl": "https://example.com/photo.jpg",
    "status": "ACTIVELY_MOVING"
  },
  "isLikedByViewer": false,
  "isSharedByViewer": false
}
```

**Status Codes:**
- `200 OK` - Reel retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Reel not found

---

### Get Reel Feed
Retrieve a personalized feed of reels from followed students or all students.

**Endpoint:** `GET /reels/feed`

**Authentication:** Required (JwtAuthGuard)

**Query Parameters:**
- `tab` (string, optional) - `"all"` (default) or `"followers"` - Which reels to show
- `orderBy` (string, optional) - `"chronological"` (default) or `"popularity"` - How to sort reels
- `limit` (number, optional) - Default: 20, max: 100 - Number of reels to return
- `cursorCreatedAt` (string, optional) - ISO 8601 timestamp for pagination

**Response:**
```json
{
  "items": [
    {
      "id": "reel-789",
      "videoUrl": "https://cdn.example.com/uploads/video-12345.mp4",
      "durationSeconds": 30,
      "wasTrimmed": false,
      "caption": "Check out my apartment!",
      "tags": ["apartment", "london", "furnished"],
      "likesCount": 45,
      "commentsCount": 8,
      "sharesCount": 2,
      "popularityScore": 7.8,
      "isFlagged": false,
      "createdAt": "2026-03-21T08:15:00Z",
      "updatedAt": "2026-03-21T08:15:00Z",
      "creator": {
        "userId": "student-123",
        "displayName": "John Doe",
        "profilePhotoUrl": "https://example.com/photo.jpg",
        "status": "ACTIVELY_MOVING"
      },
      "isLikedByViewer": false,
      "isSharedByViewer": false
    }
  ],
  "nextCursorCreatedAt": "2026-03-21T07:45:00Z"
}
```

**Status Codes:**
- `200 OK` - Feed retrieved successfully
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Invalid or missing JWT token

---

### Get Public Feed
Retrieve a feed of reels without authentication. Returns publicly visible reels ordered by chronological or popularity.

**Endpoint:** `GET /reels/public-feed`

**Authentication:** None required

**Query Parameters:**
- `orderBy` (string, optional) - `"chronological"` (default) or `"popularity"`
- `limit` (number, optional) - Default: 20, max: 100
- `cursorCreatedAt` (string, optional) - ISO 8601 timestamp for cursor-based pagination

**Response:** Same shape as `GET /reels/feed`.

**Status Codes:**
- `200 OK` - Feed retrieved successfully
- `400 Bad Request` - Invalid query parameters

---

### Delete My Reel
Delete a reel created by the authenticated student. Only the reel creator can delete their own reel.

**Endpoint:** `DELETE /reels/:reelId`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to delete

**Request Body:** Empty

**Response:**
```json
{
  "success": true,
  "message": "Reel deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Reel deleted successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not the reel creator or not a student
- `404 Not Found` - Reel not found

---

## Reel Interactions

### Like Reel
Like a reel. Only students can like reels.

**Endpoint:** `POST /reels/:reelId/like`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to like

**Request Body:** Empty

**Response:**
```json
{
  "likesCount": 46,
  "isLikedByViewer": true
}
```

**Status Codes:**
- `201 Created` - Reel liked successfully
- `400 Bad Request` - Already liked this reel
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Reel not found

---

### Unlike Reel
Remove your like from a reel.

**Endpoint:** `DELETE /reels/:reelId/like`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to unlike

**Request Body:** Empty

**Response:**
```json
{
  "likesCount": 45,
  "isLikedByViewer": false
}
```

**Status Codes:**
- `200 OK` - Reel unliked successfully
- `400 Bad Request` - You haven't liked this reel
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Reel not found

---

### Comment on Reel
Add a comment to a reel. Only students can comment.

**Endpoint:** `POST /reels/:reelId/comments`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to comment on

**Request Body:**
```json
{
  "comment": "This apartment looks amazing!"
}
```

**Response:**
```json
{
  "id": "comment-123",
  "reelId": "reel-789",
  "userId": "student-456",
  "displayName": "Alice Smith",
  "profilePhotoUrl": "https://example.com/alice-photo.jpg",
  "comment": "This apartment looks amazing!",
  "createdAt": "2026-03-21T09:30:00Z"
}
```

**Status Codes:**
- `201 Created` - Comment added successfully
- `400 Bad Request` - Invalid or empty comment
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Reel not found

---

### Share Reel
Share a reel to your profile. Shared reels appear on your profile.

**Endpoint:** `POST /reels/:reelId/share`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to share

**Request Body:** Empty

**Response:**
```json
{
  "sharesCount": 3,
  "isSharedByViewer": true
}
```

**Status Codes:**
- `201 Created` - Reel shared successfully
- `400 Bad Request` - Already shared this reel
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Reel not found

---

### Unshare Reel
Remove a shared reel from your profile.

**Endpoint:** `DELETE /reels/:reelId/share`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to unshare

**Request Body:** Empty

**Response:**
```json
{
  "sharesCount": 2,
  "isSharedByViewer": false
}
```

**Status Codes:**
- `200 OK` - Reel unshared successfully
- `400 Bad Request` - You haven't shared this reel
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Reel not found

---

### Report Reel
Report a reel for inappropriate content.

**Endpoint:** `POST /reels/:reelId/report`

**Authentication:** Required (StudentGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to report

**Request Body:**
```json
{
  "reason": "inappropriate_content",
  "details": "This video contains inappropriate material"
}
```

**Response:**
```json
{
  "reportId": "report-123",
  "reelId": "reel-789",
  "userId": "student-456",
  "reason": "inappropriate_content",
  "details": "This video contains inappropriate material",
  "status": "pending_review",
  "createdAt": "2026-03-21T09:45:00Z"
}
```

**Status Codes:**
- `201 Created` - Reel reported successfully
- `400 Bad Request` - Invalid reason or already reported
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not a student
- `404 Not Found` - Reel not found

---

### Get Reel Comments
Retrieve all comments on a reel, including the details of the student who posted each comment.

**Endpoint:** `GET /reels/:reelId/comments`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel

**Response:**
```json
[
  {
    "id": "comment-123",
    "comment": "This apartment looks amazing!",
    "createdAt": "2026-03-21T09:30:00Z",
    "updatedAt": "2026-03-21T09:30:00Z",
    "student": {
      "userId": "student-456",
      "displayName": "Alice Smith",
      "profilePhotoUrl": "https://example.com/alice-photo.jpg",
      "status": "ACTIVE"
    }
  }
]
```

**Status Codes:**
- `200 OK` - Comments retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Reel not found

---

### Delete Comment
Delete a comment on a reel. Admins can delete any comment; students can only delete their own.

**Endpoint:** `DELETE /reels/:reelId/comments/:commentId`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel
- `commentId` (string, required) - The ID of the comment to delete

**Request Body:** Empty

**Response:**
```json
{
  "success": true,
  "commentId": "comment-123"
}
```

**Status Codes:**
- `200 OK` - Comment deleted successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not the comment author and is not an admin
- `404 Not Found` - Comment not found

---

### Get Reel Likes
Retrieve all users who liked a reel, including their profile details.

**Endpoint:** `GET /reels/:reelId/likes`

**Authentication:** Required (JwtAuthGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel

**Response:**
```json
[
  {
    "id": "like-789",
    "createdAt": "2026-03-21T10:00:00Z",
    "student": {
      "userId": "student-456",
      "displayName": "Alice Smith",
      "profilePhotoUrl": "https://example.com/alice-photo.jpg",
      "status": "ACTIVE"
    }
  }
]
```

**Status Codes:**
- `200 OK` - Likes retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - Reel not found

---

# Admin Features

## Student Management

### Update Student Status
Update a student's account status (e.g., ACTIVELY_MOVING, COMPLETED_MOVE, INACTIVE).

**Endpoint:** `PATCH /reels/admin/profile/:studentId/status`

**Authentication:** Required (AdminGuard)

**Path Parameters:**
- `studentId` (string, required) - The ID of the student whose status to update

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Valid Status Values:**
  - ACTIVE
  - BANNED

**Response:**
```json
{
  "userId": "student-123",
  "displayName": "John Doe",
  "profilePhotoUrl": "https://example.com/photo.jpg",
  "bio": "Moving to London this fall!",
  "followersCount": 150,
  "followingCount": 75,
  "status": "COMPLETED_MOVE",
  "isFollowedByViewer": false,
  "uploadedReels": [],
  "sharedReels": []
}
```

**Status Codes:**
- `200 OK` - Student status updated successfully
- `400 Bad Request` - Invalid status value
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin
- `404 Not Found` - Student not found

---

### List Student Profiles (Admin)
Retrieve a list of all student profiles. Optionally filter by status.

**Endpoint:** `GET /reels/admin/profiles`

**Authentication:** Required (AdminGuard)

**Query Parameters:**
- `status` (string, optional) - Filter by profile status: `ACTIVE` or `BANNED`
- `limit` (number, optional) - Default: 20, max: 50 - Number of profiles to return

**Response:**
```json
[
  {
    "id": "uuid-123",
    "userId": "student-123",
    "displayName": "John Doe",
    "profilePhotoUrl": "https://example.com/photo.jpg",
    "bio": "Moving to London this fall!",
    "followersCount": 150,
    "followingCount": 75,
    "status": "ACTIVE",
    "createdAt": "2026-03-01T10:00:00Z",
    "updatedAt": "2026-03-20T10:30:00Z"
  }
]
```

**Status Codes:**
- `200 OK` - Profiles retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin

---



## Reel Moderation

### List Reels (Admin)
Retrieve a list of reels for moderation purposes. Can filter to show only flagged reels.

**Endpoint:** `GET /reels/admin/all`

**Authentication:** Required (AdminGuard)

**Query Parameters:**
- `flaggedOnly` (boolean, optional) - Default: false - Show only flagged reels
- `limit` (number, optional) - Default: 20, max: 100 - Number of reels to return

**Response:**
```json
{
  "items": [
    {
      "id": "reel-789",
      "videoUrl": "https://cdn.example.com/uploads/video-12345.mp4",
      "durationSeconds": 30,
      "wasTrimmed": false,
      "caption": "Check out my apartment!",
      "tags": ["apartment", "london", "furnished"],
      "likesCount": 45,
      "commentsCount": 8,
      "sharesCount": 2,
      "popularityScore": 7.8,
      "isFlagged": true,
      "createdAt": "2026-03-21T08:15:00Z",
      "updatedAt": "2026-03-21T08:15:00Z",
      "creator": {
        "userId": "student-123",
        "displayName": "John Doe",
        "profilePhotoUrl": "https://example.com/photo.jpg",
        "status": "ACTIVELY_MOVING"
      },
      "isLikedByViewer": false,
      "isSharedByViewer": false
    }
  ],
  "totalCount": 5,
  "hasMore": false
}
```

**Status Codes:**
- `200 OK` - Reels list retrieved successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin

---

### Flag Reel
Flag a reel as inappropriate or for review. Flagged reels are marked for manual review.

**Endpoint:** `PATCH /reels/admin/:reelId/flag`

**Authentication:** Required (AdminGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to flag

**Request Body:**
```json
{
  "isFlagged": true
}
```

**Response:**
```json
{
  "id": "reel-789",
  "isFlagged": true,
  "flaggedAt": "2026-03-21T10:00:00Z",
  "flaggedBy": "admin-001"
}
```

**Status Codes:**
- `200 OK` - Reel flagged successfully
- `400 Bad Request` - Invalid flag value
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin
- `404 Not Found` - Reel not found

---

### Delete Reel (Admin)
Delete a reel as an admin. This is useful for removing inappropriate content.

**Endpoint:** `DELETE /reels/admin/:reelId`

**Authentication:** Required (AdminGuard)

**Path Parameters:**
- `reelId` (string, required) - The ID of the reel to delete

**Request Body:** Empty

**Response:**
```json
{
  "success": true,
  "message": "Reel deleted successfully by admin",
  "deletedReelId": "reel-789"
}
```

**Status Codes:**
- `200 OK` - Reel deleted successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin
- `404 Not Found` - Reel not found

---

### List All Reel Reports (Admin)
Retrieve all reel reports submitted by students, ordered by most recent first. Each report includes the reporter's student profile details.

**Endpoint:** `GET /reels/admin/reports`

**Authentication:** Required (AdminGuard)

**Response:**
```json
[
  {
    "id": "report-uuid",
    "reelId": "reel-789",
    "reason": "Inappropriate content",
    "details": "This reel contains offensive material.",
    "status": "PENDING",
    "createdAt": "2024-01-15T10:30:00Z",
    "student": {
      "userId": "student-123",
      "displayName": "John Doe",
      "profilePhotoUrl": "https://example.com/photo.jpg",
      "status": "ACTIVE"
    }
  }
]
```

**Status Codes:**
- `200 OK` - Reports returned successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin

---

### Update Report Status (Admin)
Update the status of a reel report (e.g., mark it as reviewed).

**Endpoint:** `PATCH /reels/admin/reports/:reportId/status`

**Authentication:** Required (AdminGuard)

**Path Parameters:**
- `reportId` (string, required) - The ID of the report to update

**Request Body:**
```json
{
  "status": "REVIEWED"
}
```

**Valid Status Values:**
- `PENDING` - Report is awaiting review
- `REVIEWED` - Report has been reviewed by an admin

**Response:**
```json
{
  "id": "report-uuid",
  "reelId": "reel-789",
  "reason": "Inappropriate content",
  "details": "This reel contains offensive material.",
  "status": "REVIEWED",
  "createdAt": "2024-01-15T10:30:00Z",
  "student": {
    "userId": "student-123",
    "displayName": "John Doe",
    "profilePhotoUrl": "https://example.com/photo.jpg",
    "status": "ACTIVE"
  }
}
```

**Status Codes:**
- `200 OK` - Report status updated successfully
- `400 Bad Request` - Invalid status value
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin
- `404 Not Found` - Report not found

---

### Delete Report (Admin)
Permanently delete a reel report.

**Endpoint:** `DELETE /reels/admin/reports/:reportId`

**Authentication:** Required (AdminGuard)

**Path Parameters:**
- `reportId` (string, required) - The ID of the report to delete

**Request Body:** Empty

**Response:**
```json
{
  "success": true,
  "reportId": "report-uuid"
}
```

**Status Codes:**
- `200 OK` - Report deleted successfully
- `401 Unauthorized` - Invalid or missing JWT token
- `403 Forbidden` - User is not an admin
- `404 Not Found` - Report not found

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request parameters",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden - Insufficient permissions",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Data Types and Enums

### StudentProfileStatus
Student account status:
- `ACTIVELY_MOVING` - Student is actively looking to move
- `COMPLETED_MOVE` - Student has completed their move
- `INACTIVE` - Student account is inactive

### ReelFeedTab
Feed tab type:
- `all` - Show reels from all followed students and popular reels
- `followers` - Show reels only from followed students

### ReelFeedOrderBy
Feed ordering:
- `chronological` - Sort by creation date (newest first)
- `popularity` - Sort by popularity score (highest first)

### Pagination
For endpoints supporting pagination:
- Use `limit` to specify the number of items per page
- Use `cursorCreatedAt` for cursor-based pagination (copy from `nextCursorCreatedAt` in previous response)
- `nextCursorCreatedAt` will be `null` when there are no more items

---

## Rate Limiting

Currently, the Reels API does not have rate limiting enabled. This may be added in future versions.

---

## Versioning

The Reels API is currently v1 and is subject to change. Future versions will maintain backward compatibility where possible.

