# Marketplace Guideline with API DOC

This guide documents all marketplace feature for dashboard.

Students can sell their products by listing items.
others can see them. Students can message with them.
Admins can remove them if they want.

route:
dashboard/marketplace

## 1) API Configuration
Use necessary endpoints.

- **Base URL (local):** NEXT_PUBLIC_GATEWAY_URL
- **Content-Type:** `application/json` (except photo upload)
- **Auth header used in this project:** `bearer token`


Features:

## 2) Shared / Authenticated Endpoints

These endpoints require a valid JWT but are not restricted by role.

### GET `/marketplace/categories`
Returns all categories (parents + subcategories).

- **URL:** `{{baseUrl}}/marketplace/categories`
- **Headers:** `Authorization: Bearer {{studentToken}}`

**Example Response**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "parentId": null
  },
  {
    "id": 7,
    "name": "Phones",
    "parentId": 1
  }
]
```

### GET `/marketplace/listings`
Browse active listings with optional filters.

- **URL:** `{{baseUrl}}/marketplace/listings`
- **Headers:** `Authorization: Bearer {{studentToken}}`
- **Query Parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `keyword` | string | ILIKE search on title and description |
| `categoryId` | number | Filter by category or subcategory ID |
| `priceMin` | number | Minimum price (inclusive) |
| `priceMax` | number | Maximum price (inclusive) |
| `skip` | number | Pagination offset (default: 0) |
| `take` | number | Page size (default: 20) |

**cURL**
```bash
curl --location '{{baseUrl}}/marketplace/listings?keyword=laptop&categoryId=8&priceMin=10&priceMax=500&skip=0&take=20' \
--header 'Authorization: Bearer {{studentToken}}'
```

**Example Response**
```json
{
  "items": [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000001",
      "studentId": 42,
      "title": "Dell Laptop - Great Condition",
      "description": "Used for 1 year, no scratches.",
      "price": 350.00,
      "location": "Colombo 07",
      "category": {
        "id": 8,
        "name": "Laptops & Computers",
        "parentId": 1
      },
      "listingType": "SINGLE",
      "totalStock": null,
      "soldItems": 0,
      "contactNumber": "+94771234567",
      "status": "ACTIVE",
      "photos": [
        {
          "id": "photo-uuid-1",
          "photoUrl": "http://localhost:4000/uploads/marketplace/1744000000000-abc.jpg",
          "displayOrder": 0
        }
      ],
      "createdAt": "2026-04-12T08:00:00.000Z",
      "updatedAt": "2026-04-12T08:00:00.000Z",
      "sellerProfile": {
        "displayName": "Kasun Perera",
        "profilePhotoUrl": "http://localhost:4000/uploads/reels/1744000000000-profile.jpg"
      }
    }
  ],
  "total": 1,
  "skip": 0,
  "take": 20
}
```

### GET `/marketplace/listings/:listingId`
Get a single listing by ID. When called by its owner, seller profile is enriched from the reels service.

- **URL:** `{{baseUrl}}/marketplace/listings/{{listingId}}`
- **Headers:** `Authorization: Bearer {{studentToken}}`

**Example Response**
```json
{
  "id": "a1b2c3d4-0000-0000-0000-000000000001",
  "studentId": 42,
  "title": "Dell Laptop - Great Condition",
  "description": "Used for 1 year, no scratches.",
  "price": 350.00,
  "location": "Colombo 07",
  "category": {
    "id": 8,
    "name": "Laptops & Computers",
    "parentId": 1
  },
  "listingType": "SINGLE",
  "totalStock": null,
  "soldItems": 0,
  "contactNumber": "+94771234567",
  "status": "ACTIVE",
  "photos": [
    {
      "id": "photo-uuid-1",
      "photoUrl": "http://localhost:4000/uploads/marketplace/1744000000000-abc.jpg",
      "displayOrder": 0
    }
  ],
  "createdAt": "2026-04-12T08:00:00.000Z",
  "updatedAt": "2026-04-12T08:00:00.000Z",
  "sellerProfile": {
    "displayName": "Kasun Perera",
    "profilePhotoUrl": "http://localhost:4000/uploads/reels/1744000000000-profile.jpg"
  }
}
```

---

## 4) Student APIs

All endpoints below require a JWT belonging to a student (`role: tenant`).

### 4.1 Upload Photos
Upload up to **5 photos in a single request** using `multipart/form-data`. Returns an array of photo URLs to include when creating or updating a listing.

**POST `/marketplace/uploads/photos`**
- **URL:** `{{baseUrl}}/marketplace/uploads/photos`
- **Headers:** `Authorization: Bearer {{studentToken}}`, `Content-Type: multipart/form-data`
- **Form field:** `photos` (one or more image files, max 2 MB each, max 5 files)

**cURL**
```bash
curl --location --request POST '{{baseUrl}}/marketplace/uploads/photos' \
--header 'Authorization: Bearer {{studentToken}}' \
--form 'photos=@"/path/to/image1.jpg"' \
--form 'photos=@"/path/to/image2.jpg"'
```

**Example Response**
```json
[
  {
    "photoUrl": "http://localhost:4000/uploads/marketplace/1744000000000-abc123.jpg",
    "fileName": "1744000000000-abc123.jpg"
  },
  {
    "photoUrl": "http://localhost:4000/uploads/marketplace/1744000000001-def456.jpg",
    "fileName": "1744000000001-def456.jpg"
  }
]
```

---

### 4.2 Create a Listing
**POST `/marketplace/listings`**
- **URL:** `{{baseUrl}}/marketplace/listings`
- **Headers:** `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- **Body (JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Item title (max 200 chars) |
| `description` | string | ✅ | Full item description |
| `price` | number | ✅ | Price (up to 2 decimal places) |
| `location` | string | ✅ | Pickup / location text |
| `categoryId` | number | ✅ | ID of a category or subcategory |
| `listingType` | `SINGLE` \| `STOCK` | ✅ | Single item or stock listing |
| `totalStock` | number | required if `STOCK` | Total units available |
| `contactNumber` | string | ✅ | Seller contact number |
| `photoUrls` | string[] | optional | Array of URLs from the photo upload endpoint |

**cURL**
```bash
curl --location --request POST '{{baseUrl}}/marketplace/listings' \
--header 'Authorization: Bearer {{studentToken}}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "title": "Dell Laptop - Great Condition",
  "description": "Used for 1 year, no scratches.",
  "price": 350.00,
  "location": "Colombo 07",
  "categoryId": 8,
  "listingType": "SINGLE",
  "contactNumber": "+94771234567",
  "photoUrls": ["http://localhost:4000/uploads/marketplace/1744000000000-abc.jpg"]
}'
```

**Example Response** — returns the created `ListingView` (see GET `/marketplace/listings/:listingId`).

---

### 4.3 Get My Listings
**GET `/marketplace/listings/mine`**
- **URL:** `{{baseUrl}}/marketplace/listings/mine`
- **Headers:** `Authorization: Bearer {{studentToken}}`

**Example Response** — array of `ListingView`, each including `sellerProfile: { displayName, profilePhotoUrl }`.

---

### 4.4 Update a Listing
**PATCH `/marketplace/listings/:listingId`**
- **URL:** `{{baseUrl}}/marketplace/listings/{{listingId}}`
- **Headers:** `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- **Body (JSON, all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "price": 300.00,
  "location": "Colombo 03",
  "categoryId": 9,
  "totalStock": 5,
  "contactNumber": "+94779876543",
  "photoUrls": ["http://localhost:4000/uploads/marketplace/new-photo.jpg"]
}
```

> Providing `photoUrls` **replaces** all existing photos for the listing.

---

### 4.5 Update Listing Status
**PATCH `/marketplace/listings/:listingId/status`**
- **URL:** `{{baseUrl}}/marketplace/listings/{{listingId}}/status`
- **Headers:** `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- **Body:**
```json
{
  "status": "SOLD"
}
```

| Value | Description |
|---|---|
| `ACTIVE` | Listing is available |
| `SOLD` | Item has been sold |
| `REMOVED` | Seller removed the listing |

---

### 4.6 Delete a Listing
**DELETE `/marketplace/listings/:listingId`**
- **URL:** `{{baseUrl}}/marketplace/listings/{{listingId}}`
- **Headers:** `Authorization: Bearer {{studentToken}}`

**Example Response**
```json
{ "message": "Listing deleted" }
```

---

### 4.7 Start a Conversation
Initiate a conversation with the seller of a listing. Returns an existing conversation if one already exists for the same buyer + listing pair.

**POST `/marketplace/listings/:listingId/conversations`**
- **URL:** `{{baseUrl}}/marketplace/listings/{{listingId}}/conversations`
- **Headers:** `Authorization: Bearer {{studentToken}}`
- **Body:** none

**Example Response**
```json
{
  "id": "conv-uuid-1",
  "listingId": "a1b2c3d4-0000-0000-0000-000000000001",
  "buyerStudentId": 55,
  "sellerStudentId": 42,
  "createdAt": "2026-04-12T09:00:00.000Z"
}
```

---

### 4.8 List My Conversations
**GET `/marketplace/conversations`**
- **URL:** `{{baseUrl}}/marketplace/conversations`
- **Headers:** `Authorization: Bearer {{studentToken}}`

**Example Response**
```json
[
  {
    "id": "conv-uuid-1",
    "listingId": "a1b2c3d4-0000-0000-0000-000000000001",
    "buyerStudentId": 55,
    "sellerStudentId": 42,
    "createdAt": "2026-04-12T09:00:00.000Z",
    "lastMessage": {
      "id": "msg-uuid-5",
      "conversationId": "conv-uuid-1",
      "senderStudentId": 55,
      "content": "Is this still available?",
      "readAt": null,
      "createdAt": "2026-04-12T09:05:00.000Z"
    }
  }
]
```

---

### 4.9 List Messages in a Conversation
**GET `/marketplace/conversations/:conversationId/messages`**
- **URL:** `{{baseUrl}}/marketplace/conversations/{{conversationId}}/messages`
- **Headers:** `Authorization: Bearer {{studentToken}}`

**Example Response**
```json
[
  {
    "id": "msg-uuid-1",
    "conversationId": "conv-uuid-1",
    "senderStudentId": 55,
    "content": "Is this still available?",
    "readAt": null,
    "createdAt": "2026-04-12T09:05:00.000Z"
  },
  {
    "id": "msg-uuid-2",
    "conversationId": "conv-uuid-1",
    "senderStudentId": 42,
    "content": "Yes, come pick it up tomorrow.",
    "readAt": "2026-04-12T09:10:00.000Z",
    "createdAt": "2026-04-12T09:08:00.000Z"
  }
]
```

---

### 4.10 Send a Message
**POST `/marketplace/conversations/:conversationId/messages`**
- **URL:** `{{baseUrl}}/marketplace/conversations/{{conversationId}}/messages`
- **Headers:** `Authorization: Bearer {{studentToken}}`, `Content-Type: application/json`
- **Body:**
```json
{
  "content": "Is this still available?"
}
```

**Example Response** — returns the created `MessageView`.

---

## 5) Admin APIs

All endpoints below require a JWT belonging to an admin (`role: admin`).

### 5.1 List All Listings
**GET `/marketplace/admin/listings`**
- **URL:** `{{baseUrl}}/marketplace/admin/listings`
- **Headers:** `Authorization: Bearer {{adminToken}}`

**Example Response** — array of `ListingView` (all statuses, all students).

---

### 5.2 Remove a Listing
Sets the listing status to `REMOVED`. Does not hard-delete.

**DELETE `/marketplace/admin/listings/:listingId`**
- **URL:** `{{baseUrl}}/marketplace/admin/listings/{{listingId}}`
- **Headers:** `Authorization: Bearer {{adminToken}}`

**Example Response**
```json
{ "message": "Listing removed" }
```

---

## 6) Error Responses

All endpoints return standard HTTP error responses:

```json
{
  "statusCode": 404,
  "message": "Listing not found",
  "error": "Not Found"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad Request — invalid input |
| `401` | Unauthorized — missing or invalid JWT |
| `403` | Forbidden — insufficient role or not the owner |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — e.g. duplicate conversation |
