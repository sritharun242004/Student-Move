# Merchant Service API Guide

This guide documents all merchant-related HTTP endpoints exposed by the gateway.

## 1) Base Configuration

- **Base URL (local):** `http://localhost:4000/api`
- **Content-Type:** `application/json`
- **Auth header used in this project:** `bearer token`

## 2) Recommended Postman Environment Variables

Create these variables in Postman:

- `baseUrl` = `http://localhost:4000/api`
- `merchantUserId` = `<merchant user id>`
- `studentUserId` = `<student user id>`
- `merchantId` = `<merchant profile id>`
- `offerId` = `<offer id>`
- `voucherCode` = `<voucher uniqueCode>`

Use `{{baseUrl}}` in all request URLs.

---

## 3) Shared / Public Endpoints

### GET `/`
- **URL:** `{{baseUrl}}/`
- **Headers:** none
- **Body:** none

**cURL**
```bash
curl --location '{{baseUrl}}/'
```

### GET `/merchants/:merchantId`
- **URL:** `{{baseUrl}}/merchants/{{merchantId}}`
- **Headers:** none

### GET `/offers/active`
- **URL:** `{{baseUrl}}/offers/active`
- **Headers:** none

---

## 4) Admin APIs

### 4.1 Update Merchant Approval
### PATCH `/merchants/:merchantId/approval`
- **URL:** `{{baseUrl}}/merchants/{{merchantId}}/approval`
- **Headers:** `BEARER TOKEN` (Admin), `Content-Type: application/json`
- **Body:**
```json
{
  "isApproved": true
}
```

### 4.2 Update Merchant Suspension
### PATCH `/merchants/:merchantId/suspension`
- **URL:** `{{baseUrl}}/merchants/{{merchantId}}/suspension`
- **Headers:** `BEARER TOKEN` (Admin), `Content-Type: application/json`
- **Body:**
```json
{
  "isSuspended": false
}
```
### 4.3 List All Merchants (with details + offer counts)
### GET `/admin/all`
- **URL:** `{{baseUrl}}/admin/merchants`
- **Headers:** `BEARER TOKEN` (Admin)

**Example Response**
```json
[
  {
    "id": "d7d1a45b-0b26-4f17-83cb-6d8b850303b1",
    "userId": "123",
    "businessName": "John Cafe",
    "description": "Campus coffee and snacks",
    "businessEmail": "merchant@example.com",
    "phone": "+94770000000",
    "address": "123 Main Street",
    "isApproved": true,
    "isSuspended": false,
    "createdAt": "2026-02-01T09:00:00.000Z",
    "updatedAt": "2026-02-20T10:30:00.000Z",
    "offerCounts": {
      "active": 3,
      "all": 7
    }
  }
]
```

### 4.3 Get Offers by Merchant ID
### GET `/merchants/admin/merchant/:merchantId/offers`
- **URL:** `{{baseUrl}}/merchants/admin/merchant/{{merchantId}}/offers`
- **Headers:** `BEARER TOKEN` (Admin)

**Example Response**
```json
{
  "merchant": {
    "id": "d7d1a45b-0b26-4f17-83cb-6d8b850303b1",
    "businessName": "John Cafe",
    "isApproved": true,
    "isSuspended": false
  },
  "summary": {
    "totalOffers": 7,
    "activeOffers": 3,
    "inactiveOffers": 2,
    "expiredOffers": 2
  },
  "offers": [
    {
      "id": "99dc3f0a-5fc1-42f7-95d9-6e8c19dbac08",
      "title": "10% off Coffee",
      "description": "Valid for all hot coffees",
      "discountType": "PERCENTAGE",
      "usageLimit": 100,
      "perStudentLimit": 1,
      "isActive": true,
      "expiryDate": "2026-12-31T23:59:59.000Z",
      "createdAt": "2026-02-10T08:00:00.000Z"
    }
  ]
}
```

### 4.4 Get Overall Platform Stats
### GET `/merchants/admin/stats`
- **URL:** `{{baseUrl}}/merchants/admin/stats`
- **Headers:** `BEARER TOKEN` (Admin)

**Example Response**
```json
{
  "totalOffers": 420,
  "activeOffers": 311,
  "inactiveOffers": 109,
  "expiredOffers": 57,
  "totalMerchants": 145,
  "approvedMerchants": 130,
  "suspendedMerchants": 6,
  "successfulRedeems": 980,
  "failedRedeems": 42,
  "totalVouchers": 1260,
  "redeemedVouchers": 980,
  "expiredVouchers": 190,
  "pendingVouchers": 90,
  "totalStudentsWithRedeems": 540,
  "lastUpdatedAt": "2026-02-25T10:15:00.000Z"
}
```

---

## 5) Merchant APIs

### 5.1 Register Merchant
### POST `/merchants/register`
- **URL:** `{{baseUrl}}/merchants/register`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "merchant@example.com",
  "password": "StrongPass123",
  "phone": "+94770000000",
  "businessName": "John Cafe",
  "description": "Campus coffee and snacks",
  "address": "123 Main Street"
}
```

### 5.2 Get My Merchant Profile
### GET `/merchants/profile/me`
- **URL:** `{{baseUrl}}/merchants/profile/me`
- **Headers:** `BEARER TOKEN`

### 5.3 Update My Merchant Profile
### PATCH `/merchants/profile/me`
- **URL:** `{{baseUrl}}/merchants/profile/me`
- **Headers:** `BEARER TOKEN`, `Content-Type: application/json`
- **Body (JSON, all optional):**
```json
{
  "businessName": "John Cafe - Updated",
  "description": "Updated description",
  "address": "456 New Street",
  "profileImageUrl": "http://localhost:4000/uploads/merchant/1700000000000-123456789.jpg"
}
```

### 5.4 Upload Merchant Profile Image
### POST `/merchants/upload-image`
- **URL:** `{{baseUrl}}/merchants/upload-image`
- **Headers:** `BEARER TOKEN`, `Content-Type: multipart/form-data`
- **Form-Data:**
  - key: `image` (type: File)

Response:
```json
{
  "imageUrl": "http://localhost:4000/uploads/merchant/1700000000000-123456789.jpg",
  "fileName": "1700000000000-123456789.jpg"
}
```

Notes:
- Only `image/*` files are allowed
- Max file size: `2MB`
- Use returned `imageUrl` in `PATCH /merchants/profile/me` as `profileImageUrl`

### 5.5 Set / Update Merchant Secret Code (4 to 6 digits)
### PATCH `/merchants/profile/me/secret-code`
- **URL:** `{{baseUrl}}/merchants/profile/me/secret-code`
- **Headers:** `BEARER TOKEN`, `Content-Type: application/json`

#### First-time set (no previous code required)
```json
{
  "secretCode": "1234"
}
```

#### Update existing code (previous code required)
```json
{
  "secretCode": "567890",
  "previousSecretCode": "1234"
}
```

Rules:
- `secretCode` must match `^\d{4,6}$`
- `previousSecretCode` required only when editing an already-set code

### 5.6 Get My Merchant Status
### GET `/merchants/status/me`
- **URL:** `{{baseUrl}}/merchants/status/me`
- **Headers:** `BEARER TOKEN` (Merchant)

**Example Response**
```json
{
  "isApproved": true,
  "isSuspended": true,
  "hasSecretCode": true
}
```

### 5.7 Get My Merchant Overview Stats
### GET `/merchants/stats/me`
- **URL:** `{{baseUrl}}/merchants/stats/me`
- **Headers:** `BEARER TOKEN` (Merchant)

**Example Response**
```json
{
  "totalOffers": 24,
  "activeOffers": 16,
  "inactiveOffers": 8,
  "expiredOffers": 5,
  "successfulRedeems": 132,
  "failedRedeems": 7,
  "totalVouchers": 180,
  "expiredVouchers": 21,
  "pendingVouchers": 27,
  "totalStudentsWithRedeems": 89,
  "lastUpdatedAt": "2026-03-02T10:15:00.000Z"
}
```

### 5.8 Upload Offer Image
### POST `/offers/upload-image`
- **URL:** `{{baseUrl}}/offers/upload-image`
- **Headers:** `BEARER TOKEN`, `Content-Type: multipart/form-data`
- **Form-Data:**
  - key: `image` (type: File)

Response:
```json
{
  "imageUrl": "http://localhost:4000/uploads/1700000000000-123456789.jpg",
  "fileName": "1700000000000-123456789.jpg"
}
```

Notes:
- Only `image/*` files are allowed
- Max file size: `2MB`
- Use returned `imageUrl` when creating/updating offers

### 5.9 Create Offer
### POST `/offers`
- **URL:** `{{baseUrl}}/offers`
- **Headers:** `BEARER TOKEN`, `Content-Type: application/json`
- **Body:**
```json
{
  "title": "10% off Coffee",
  "description": "Valid for all hot coffees",
  "discountType": "PERCENTAGE",
  "usageLimit": 100,
  "imageUrl": "http://localhost:4000/uploads/1771926821866-227153514.png",
  "perStudentLimit": 1,
  "expiryDate": "2026-12-31T23:59:59.000Z",
  "isActive": true
}
```

Notes:
- `discountType` allowed values: `PERCENTAGE`, `FIXED_AMOUNT`
- `usageLimit` optional

### 5.10 Update Offer
### PATCH `/offers/:offerId`
- **URL:** `{{baseUrl}}/offers/{{offerId}}`
- **Headers:** `BEARER TOKEN`, `Content-Type: application/json`
- **Body (any subset):**
```json
{
  "title": "20% off Coffee",
  "description": "Updated details",
  "discountType": "PERCENTAGE",
  "usageLimit": 200,
  "perStudentLimit": 2,
  "expiryDate": "2026-12-31T23:59:59.000Z"
}
```

### 5.11 Toggle Offer Activation
### PATCH `/offers/:offerId/activation`
- **URL:** `{{baseUrl}}/offers/{{offerId}}/activation`
- **Headers:** `x-user-id: {{merchantUserId}}`, `Content-Type: application/json`
- **Body:**
```json
{
  "isActive": false
}
```

### 5.12 Delete Offer
### DELETE `/offers/:offerId`
- **URL:** `{{baseUrl}}/offers/{{offerId}}`
- **Headers:** `BEARER TOKEN` (Merchant)

**Example Response**
```json
{
  "success": true,
  "offerId": "99dc3f0a-5fc1-42f7-95d9-6e8c19dbac08"
}
```

### 5.13 Get My Merchant Offers
### GET `/offers/merchant/me`
- **URL:** `{{baseUrl}}/offers/merchant/me`
- **Headers:** `x-user-id: {{merchantUserId}}`

### 5.14 Validate and Redeem Voucher
### POST `/redemptions/validate`
- **URL:** `{{baseUrl}}/redemptions/validate`
- **Headers:** `x-user-id: {{merchantUserId}}`, `Content-Type: application/json`

#### When merchant has NO secret code set
```json
{
  "uniqueCode": "{{voucherCode}}"
}
```

#### When merchant HAS secret code set
```json
{
  "uniqueCode": "{{voucherCode}}",
  "merchantSecretCode": "1234"
}
```

Redemption rules:
- If merchant has a configured code, `merchantSecretCode` is required
- `merchantSecretCode` must be 4–6 digits
- Wrong code blocks redemption

### 5.15 Get Merchant Redemption Activity
### GET `/redemptions/activity/me`
- **URL:** `{{baseUrl}}/redemptions/activity/me`
- **Headers:** `x-user-id: {{merchantUserId}}`
- **Response fields (per item):** `voucherId`, `offerName`, `studentId`, `voucherStatus`, `redeemStatus`, `reason`, `scannedAt`

```json
[
  {
    "voucherId": "9b5a71ad-29c0-49e2-81f4-0f7dd9047c59",
    "offerName": "20% Off Lunch",
    "studentId": "STU-2026001",
    "voucherStatus": "REDEEMED",
    "redeemStatus": "SUCCESS",
    "reason": null,
    "scannedAt": "2026-03-05T08:11:29.817Z"
  }
]
```

---

## 6) Student APIs

### 6.1 Create Voucher
### POST `/vouchers`
- **URL:** `{{baseUrl}}/vouchers`
- **Headers:** `x-user-id: {{studentUserId}}`, `Content-Type: application/json`
- **Body:**
```json
{
  "offerId": "{{offerId}}"
}
```

Response includes `uniqueCode` (store it into `voucherCode` variable in Postman for redemption testing).

### 6.2 Get My Redeemed Offers
### GET `/offers/student/redeemed/me`
- **URL:** `{{baseUrl}}/offers/student/redeemed/me`
- **Headers:** `x-user-id: {{studentUserId}}`

### 6.3 Get Redeemed Offers by Student ID
### GET `/offers/student/:studentId/redeemed`
- **URL:** `{{baseUrl}}/offers/student/{{studentUserId}}/redeemed`
- **Headers:** none

---

## 7) Suggested End-to-End Postman Test Order

1. Register merchant: `POST /merchants/register`
2. Approve merchant: `PATCH /merchants/:merchantId/approval`
3. (Optional) Set secret code: `PATCH /merchants/profile/me/secret-code`
4. Create offer: `POST /offers`
5. Create voucher as student: `POST /vouchers`
6. Redeem voucher as merchant: `POST /redemptions/validate`
7. Check redemption log: `GET /redemptions/activity/me`

---

## 8) Common Failure Cases

- Invalid merchant secret code format -> `400`
- Missing secret code for redemption when merchant code exists -> `403`
- Wrong previous secret code on update -> `403`
- Wrong voucher merchant / expired / already redeemed -> `4xx` with descriptive message

---