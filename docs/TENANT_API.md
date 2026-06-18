# Tenant API Guide

This guide documents HTTP endpoints for tenant (student) profile image management exposed by the gateway.

## 1) Base Configuration

- **Base URL (local):** `http://localhost:4000/api`
- **Auth header:** `Bearer token` (student JWT)

## 2) Recommended Postman Environment Variables

- `baseUrl` = `http://localhost:4000/api`
- `studentToken` = `<JWT token for a student (role: tenant)>`

---

## 3) Tenant Endpoints

### POST `/tenants/upload-image`
Upload a profile image for the authenticated student (tenant).

- **URL:** `{{baseUrl}}/tenants/upload-image`
- **Headers:** `Authorization: Bearer {{studentToken}}`, `Content-Type: multipart/form-data`
- **Form-Data:**
  - key: `image` (type: File)
- **Auth:** JwtAuthGuard + StudentGuard (student role required)

**cURL**
```bash
curl --location --request POST '{{baseUrl}}/tenants/upload-image' \
--header 'Authorization: Bearer {{studentToken}}' \
--form 'image=@"/path/to/photo.jpg"'
```

**Example Response**
```json
{
  "imageUrl": "http://localhost:4000/uploads/tenant/1700000000000-123456789.jpg",
  "fileName": "1700000000000-123456789.jpg"
}
```

**Notes:**
- Only `image/*` MIME types are accepted
- Maximum file size: **2 MB**
- Images are stored under `uploads/tenant/`
- Use the returned `imageUrl` when updating your reels profile (`PATCH /reels/profile/me`) as `profilePhotoUrl`

**Status Codes:**

| Status | Meaning |
|--------|---------|
| `201 Created` | Image uploaded successfully |
| `400 Bad Request` | No file provided, or file is not an image |
| `401 Unauthorized` | Missing or invalid JWT |
| `403 Forbidden` | User is not a student (tenant role required) |
