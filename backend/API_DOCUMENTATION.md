# StudentMoves Backend — API Documentation

**Base URL (Production):** `https://api.studentmoves.co.uk`  
**Base URL (Local):** `http://localhost:8000`

---

## Table of Contents

1. [Authentication & Headers](#1-authentication--headers)
2. [User Roles](#2-user-roles)
3. [Auth & User Management](#3-auth--user-management-apiauthapiversions)
4. [Properties](#4-properties-apiproperties)
5. [Tenants & Leases](#5-tenants--leases-apitenants)
6. [Forms & Applications](#6-forms--applications-apiforms)
7. [Chat](#7-chat-apichat)
8. [Notifications](#8-notifications-api)
9. [Error Responses](#9-error-responses)
10. [Data Models Reference](#10-data-models-reference)

---

## 1. Authentication & Headers

### JWT Bearer Token

All protected endpoints require an `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after **1 hour**. Use the refresh endpoint to get a new one.

### Custom Headers

| Header | Purpose |
|---|---|
| `X-Acting-As-Landlord` | Used by agents to perform actions on behalf of a landlord |
| `X-Guarantor-Token` | Token for shared guarantor form access |

---

## 2. User Roles

| Role | Description |
|---|---|
| `admin` | Full system access |
| `landlord` | Manages properties and leases |
| `tenant` | Applies for and manages tenancies |
| `agent` | Acts on behalf of landlords |
| `merchant` | Marketplace/offers participant |

> **Note:** `landlord` and `agent` accounts start with `inactive` status and require admin approval.

---

## 3. Auth & User Management (`/api/auth/`, `/api/users/`)

> Both prefix paths (`/api/auth/` and `/api/users/`) share the same URL configuration.

### 3.1 Register

**`POST /api/auth/register/`**  
Public. Creates a new user account and sends a welcome email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "role": "tenant",
  "profile": {
    "phone": "07700900000"
  }
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Min 8 characters |
| `first_name` | string | Yes | |
| `last_name` | string | Yes | |
| `role` | string | Yes | `tenant`, `landlord`, `agent`, `merchant` |
| `profile.phone` | string | Yes | |

**Response `201`:**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "userData": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "tenant",
    "profile": { "phone": "07700900000", "status": "active" },
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

---

### 3.2 Login

**`POST /api/auth/login/`**  
Public.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "User Loged In Successfully",
  "userData": {
    "id": 1,
    "email": "user@example.com",
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>"
  }
}
```

**Response `403`** (invalid credentials):
```json
{
  "status": "fail",
  "message": ["Invalid email or password"]
}
```

---

### 3.3 Refresh Token

**`POST /api/auth/token/refresh/`**  
Public.

**Request Body:**
```json
{
  "refresh": "<refresh_token>"
}
```

**Response `200`:**
```json
{
  "access": "<new_access_token>"
}
```

---

### 3.4 Password Reset (OTP)

**`POST /api/auth/reset-password-otp/`**  
Public. Sends a 6-digit OTP to the user's email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### 3.5 Update Password with OTP

**`POST /api/auth/update-password-otp/`**  
Public.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "newpassword"
}
```

---

### 3.6 Update Password with Token

**`POST /api/auth/update-password-token/`**  
Public.

**Request Body:**
```json
{
  "token": "<password_reset_token>",
  "password": "newpassword"
}
```

---

### 3.7 Get User Profile

**`GET /api/users/profile/<id>/`**  
Auth required.

**Response `200`:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profile": {
    "phone": "07700900000",
    "status": "active",
    "openForAgents": true,
    "companyName": null,
    "commissionRate": null
  }
}
```

---

### 3.8 Update Profile

**`PATCH /api/users/profile/update/`**  
Auth required.

**Request Body (partial):**
```json
{
  "first_name": "Jane",
  "profile": {
    "phone": "07700900001",
    "company_name": "My Company Ltd"
  }
}
```

---

### 3.9 Deactivate Own Account

**`PUT /api/users/deactivate/`** or **`PATCH /api/users/deactivate/`**  
Auth required.

---

### 3.10 Approve User

**`PATCH /api/users/approve/<id>/`**  
Admin only. Sets user profile status to `active`.

---

### 3.11 Suspend User

**`PATCH /api/users/suspend/<id>/`**  
Admin only. Sets user profile status to `suspended`.

---

### 3.12 List Users by Role

**`GET /api/users/<role>/`**  
Admin or Landlord. Valid roles: `tenant`, `landlord`, `agent`, `merchant`.

**Response `200`:**
```json
{
  "status": "success",
  "message": "User list fetched successfully",
  "users": [ ... ]
}
```

---

### 3.13 Dashboard Stats

**`GET /api/users/dashboard/stats/`**  
Auth required.

Returns summary statistics for the current user's dashboard.

---

### 3.14 Download Monthly Report

**`GET /api/users/dashboard/report/download/`**  
Auth required. Returns a CSV file.

---

### 3.15 Agent–Landlord Relationships

#### List / Create Relationships
**`GET /api/users/agent/relationships/`** — List agent's landlord relationships  
**`POST /api/users/agent/relationships/`** — Create a new relationship

**POST Request Body:**
```json
{
  "landlord_id": 5
}
```

#### Manage Individual Relationship
**`DELETE /api/users/agent/relationships/<id>/`** — Remove relationship  
**`PATCH /api/users/agent/relationships/<id>/`** — Update relationship

#### List Landlords (for agents)
**`GET /api/users/agent/landlords/`** — All landlords visible to agent  
**`GET /api/users/agent/active-landlords/`** — Landlords with active relationships  
**`GET /api/users/agent/available-landlords/`** — Landlords without an agent (open for selection)

#### My Agent (for landlords)
**`GET /api/users/profile/my-agent/`** — Get the landlord's current agent  
**`POST /api/users/profile/remove-agent/`** — Remove current agent

---

## 4. Properties (`/api/properties/`)

### 4.1 List Properties (Authenticated)

**`GET /api/properties/`**  
Auth required. Returns properties owned by or visible to the authenticated user.

**Response `200`:**
```json
[
  {
    "id": 1,
    "name": "2 Bed Flat, Leeds",
    "address": "123 High Street, Leeds",
    "price": "850.00",
    "rooms": 2,
    "bathrooms": 1,
    "status": "available",
    "isFeatured": false,
    "cityIndex": 0,
    "areaIndex": 3,
    "universities": [{"id": 1, "name": "University of Leeds"}],
    "images": [{"id": 1, "image": "/media/properties/img.jpg"}]
  }
]
```

---

### 4.2 Public Property Listing

**`GET /api/properties/all/`**  
Public. Returns all approved/available properties for the marketplace.

---

### 4.3 Create Property

**`POST /api/properties/`**  
Auth required (Landlord or Agent).

**Request Body:**
```json
{
  "name": "3 Bed House",
  "address": "45 Park Lane, Sheffield",
  "description": "Spacious student house near university",
  "rooms": 3,
  "bathrooms": 2,
  "price": "1200.00",
  "city_index": 1,
  "area_index": 2,
  "universities": [1, 2],
  "available_after": "2025-09-01",
  "available_to": "2026-07-31",
  "security_deposit": "600.00",
  "holding_deposit": "200.00",
  "epc_rating": "C",
  "utility_amount": "30.00",
  "key_features": ["Garden", "Parking", "Furnished"],
  "gas_from_date": "2024-01-01",
  "gas_to_date": "2025-01-01",
  "electric_from_date": "2024-01-01",
  "electric_to_date": "2025-01-01"
}
```

**Key Fields:**

| Field | Type | Notes |
|---|---|---|
| `city_index` | int | Index of city in frontend locations array |
| `area_index` | int | Index of area within the city |
| `price` | decimal | Final price shown to users (includes commission for agents) |
| `base_price` | decimal | Agent's price before commission (optional) |
| `epc_rating` | string | A–G |
| `utility_amount` | decimal | Weekly utility fee (auto-calculated as monthly when needed) |
| `key_features` | list[string] | Feature tags |

---

### 4.4 Get, Update, Delete Property

**`GET /api/properties/<id>/`** — Retrieve single property  
**`PUT /api/properties/<id>/`** — Full update (owner/admin)  
**`PATCH /api/properties/<id>/`** — Partial update (owner/admin)  
**`DELETE /api/properties/<id>/`** — Delete (owner/admin)

---

### 4.5 Pending Properties (Admin)

**`GET /api/properties/pending/`**  
Admin only. Lists properties with `pending` status awaiting approval.

---

### 4.6 Flagged Properties (Admin)

**`GET /api/properties/flagged/`**  
Admin only.

---

### 4.7 Approve Property

**`PUT /api/properties/<id>/approve/`**  
Admin only. Sets property status to `available`.

---

### 4.8 Flag Property

**`PUT /api/properties/<id>/flag/`**  
Admin only. Sets property status to `flagged`.

---

### 4.9 Feature / Unfeature Property

**`PATCH /api/properties/<id>/featured/`**  
Admin only. Toggles `is_featured` flag.

---

### 4.10 Landlord Properties

**`GET /api/properties/landlord/<landlord_id>/`**  
Auth required. Lists all properties for a specific landlord.

---

### 4.11 Property Images

**`POST /api/properties/images/<property_id>/`** — Upload images  
**`PUT /api/properties/images/<property_id>/`** — Replace images  
**`GET /api/properties/images/<property_id>/`** — List images

**POST Request:** Multipart form data with `image` field(s).

---

### 4.12 System Settings

**`GET /api/properties/settings/<setting_key>/`** — Get a setting value  
**`PUT /api/properties/settings/<setting_key>/update/`** — Update a setting value

---

## 5. Tenants & Leases (`/api/tenants/`)

### 5.1 Lease Requests

#### Create Lease Request
**`POST /api/tenants/requests/`**  
Auth required (Tenant).

**Request Body:**
```json
{
  "property_obj": 1,
  "installment_type": "monthly",
  "lease_months": 10,
  "start_date": "2025-09-01"
}
```

| Field | Type | Notes |
|---|---|---|
| `installment_type` | string | `monthly` or `weekly` |
| `lease_months` | int | 1–12 |
| `start_date` | date | ISO 8601 format |

#### List Lease Requests
**`GET /api/tenants/requests/`**  
Auth required. Tenants see their own; landlords see leases on their properties.

#### Get Active Lease
**`GET /api/tenants/requests/active/`**  
Auth required (Tenant). Returns the current active lease.

#### Get / Delete Lease
**`GET /api/tenants/requests/<id>/`**  
**`DELETE /api/tenants/requests/<id>/`**

#### Approve Lease
**`PUT /api/tenants/requests/<id>/approve/`**  
Landlord or Admin.

#### Close Lease
**`PUT /api/tenants/requests/<id>/close/`**  
Sets lease to `tenant_closed` or `landlord_closed` depending on requester.

---

### 5.2 Installments

**`GET /api/tenants/installments-list/<lease_id>/`** — List all installments for a lease  
**`GET /api/tenants/installments/<id>/`** — Get single installment  
**`PATCH /api/tenants/installments/<id>/`** — Update installment  
**`DELETE /api/tenants/installments/<id>/`** — Delete installment

#### Change Installment Type
**`PUT /api/tenants/change-installement-type/<lease_id>/`**  
Auth required.

**Request Body:**
```json
{
  "installment_type": "weekly"
}
```

---

### 5.3 Payments

#### Initiate Stripe Payment
**`POST /api/tenants/payments/init/`**  
Auth required.

**Request Body:**
```json
{
  "installment_id": "abc123",
  "amount": 850.00
}
```

**Response:** Contains a Stripe `client_secret` for frontend confirmation.

#### Verify Payment Status
**`GET /api/tenants/payments/<id>/verify/`**  
Auth required.

#### Stripe Webhook
**`POST /api/tenants/payments/webhook/`**  
Called by Stripe. Do not call directly.

#### List Payments
**`GET /api/tenants/payments/list/`**  
Auth required.

#### Payments by Lease
**`GET /api/tenants/payments/lease/<lease_id>/`**

#### Rent Payment History
**`GET /api/tenants/payments/lease/<lease_id>/rent-history/`**

#### Manual Payment Recording
**`POST /api/tenants/payments/manual/record/<id>/`** — Record a manual payment  
**`POST /api/tenants/payments/manual/verify/<id>/`** — Verify a manual payment (Admin)

---

### 5.4 Maintenance Requests

#### List / Create
**`GET /api/tenants/maintanance-requests/`**  
**`POST /api/tenants/maintanance-requests/`**

**POST Request Body:**
```json
{
  "lease": 1,
  "title": "Broken boiler",
  "description": "Hot water not working since yesterday.",
  "image": "<file upload (multipart)>"
}
```

#### Get / Update / Delete
**`GET /api/tenants/maintanance-requests/<id>/`**  
**`PUT /api/tenants/maintanance-requests/<id>/`**  
**`DELETE /api/tenants/maintanance-requests/<id>/`**

#### Update Status
**`PATCH /api/tenants/maintanance-requests/<id>/update-status/<status>/`**

Valid `status` values: `open`, `in_progress`, `resolved`, `closed`

---

### 5.5 Inspections

#### List / Create
**`GET /api/tenants/inspections/`**  
**`POST /api/tenants/inspections/`**

**POST Request Body:**
```json
{
  "lease": 1,
  "scheduled_date": "2025-11-15",
  "notes": "Annual property inspection"
}
```

#### Delete Inspection
**`DELETE /api/tenants/inspections/<id>/`**

#### Update Status
**`PATCH /api/tenants/inspections/<id>/update-status/`**

**Request Body:**
```json
{
  "status": "completed"
}
```

#### Update Schedule
**`PATCH /api/tenants/inspections/<id>/update-schedule/`**

**Request Body:**
```json
{
  "scheduled_date": "2025-12-01"
}
```

#### List by Lease
**`GET /api/tenants/inspection-list/<lease_id>/`**

---

### 5.6 Inquiries

#### List / Create
**`GET /api/tenants/inquiries/`**  
**`POST /api/tenants/inquiries/`**

**POST Request Body:**
```json
{
  "property": 1,
  "message": "Is the property still available from September?"
}
```

#### Get / Update / Delete
**`GET /api/tenants/inquiries/<id>/`**  
**`PUT /api/tenants/inquiries/<id>/`**  
**`DELETE /api/tenants/inquiries/<id>/`**

#### Resolve Inquiry
**`PATCH /api/tenants/inquiries/<id>/resolve/`**  
Auth required (Landlord/Admin).

#### List by Property
**`GET /api/tenants/inquiries-list/<property_id>/`**

---

### 5.7 Property Reports

#### Create / List Reports
**`POST /api/tenants/report-property/`**  
**`GET /api/tenants/report-property/`**

**POST Request Body:**
```json
{
  "property": 1,
  "reason": "Inaccurate listing",
  "description": "Photos do not match the actual property."
}
```

#### Get Single Report
**`GET /api/tenants/report-property/<id>/`**

#### Resolve Report
**`PUT /api/tenants/report-property/<id>/resolve/`**  
Admin only.

---

### 5.8 Documents

#### Upload Document
**`POST /api/tenants/upload-document/`**  
Auth required. Multipart form data.

**Fields:** `lease` (int), `title` (string), `file` (file)

#### List Documents
**`GET /api/tenants/documents/`**  
**`GET /api/tenants/documents/<lease_id>/`**

#### Download Document
**`GET /api/tenants/documents/download/<document_id>/`**  
Returns binary file.

#### Delete Document
**`DELETE /api/tenants/documents/delete/<document_id>/`**

---

### 5.9 Utilities

#### List Utilities by Lease
**`GET /api/tenants/utilities-list/<lease_id>/`**

#### Get / Update / Delete Utility
**`GET /api/tenants/utilities/<id>/`**  
**`PATCH /api/tenants/utilities/<id>/`**  
**`DELETE /api/tenants/utilities/<id>/`**

---

### 5.10 Direct Debit — Utilities

**`GET /api/tenants/direct-debit-utility/<lease_id>/`** — List  
**`PATCH /api/tenants/direct-debit-utility/<lease_id>/`** — Create or update  
**`GET /api/tenants/direct-debit-utility/<id>/`** — Retrieve single record  
**`POST /api/tenants/direct-debit-utility/<id>/`** — Create  
**`PATCH /api/tenants/direct-debit-utility/<id>/`** — Partial update  
**`DELETE /api/tenants/direct-debit-utility/<id>/`** — Delete

---

### 5.11 Direct Debit — Installments

Same pattern as Direct Debit Utilities but at:  
`/api/tenants/direct-debit-installment/<lease_id>/`  
`/api/tenants/direct-debit-installment/<id>/`

---

### 5.12 Dashboard & Reports

**`GET /api/tenants/dashboard/stats/`** — Landlord dashboard statistics  
**`GET /api/tenants/requests/report/download/`** — Download lease report (CSV)

---

## 6. Forms & Applications (`/api/forms/`)

### 6.1 Application Forms

#### List / Create Applications for a Property
**`GET /api/forms/apply/<property_id>/`**  
**`POST /api/forms/apply/<property_id>/`**

**POST Request Body:**
```json
{
  "dob": "2000-05-14",
  "home_address": "10 Student Way, Leeds",
  "postcode": "LS1 1AA",
  "personal_email": "student@example.com",
  "mobile": "07700900123",
  "rent_payer": "Self",
  "status": "Student",
  "start_date": "2025-09-01",
  "bond_amount": "200.00"
}
```

#### List All Applications
**`GET /api/forms/applications/`**  
Auth required. Tenants see their own; landlords/agents see those for their properties.

#### Get / Update Application
**`GET /api/forms/application/<id>/`**  
**`PUT /api/forms/application/<id>/`**

#### Change Application Status
**`PATCH /api/forms/application/<id>/<status>/`**

Valid statuses: `approved`, `rejected`, `pending`

#### Upload Signature
**`PUT /api/forms/application/<id>/sign/`**  
Multipart form data with `signature` field (image file).

#### Upload NIC
**`PUT /api/forms/application/<id>/add-nic/`**  
Multipart form data with `nic` field (image/PDF file).

#### Mark Application Completed
**`PATCH /api/forms/application/<id>/completed/`**

---

### 6.2 Student Details

**`GET /api/forms/<form_id>/student/`** — Get student details  
**`POST /api/forms/<form_id>/student/`** — Create/update student details

**POST Request Body:**
```json
{
  "university": "University of Leeds",
  "course": "Computer Science",
  "year_of_study": 2,
  "student_id": "SC12345"
}
```

---

### 6.3 Employee Details

**`GET /api/forms/<form_id>/employee/`**  
**`POST /api/forms/<form_id>/employee/`**

**POST Request Body:**
```json
{
  "employer_name": "Acme Corp",
  "job_title": "Software Engineer",
  "employment_start_date": "2023-06-01",
  "annual_salary": "35000.00"
}
```

---

### 6.4 Parent / Next of Kin Details

**`GET /api/forms/<form_id>/parent/`**  
**`POST /api/forms/<form_id>/parent/`**

---

### 6.5 Previous Landlord Details

**`GET /api/forms/<form_id>/landlord/`**  
**`POST /api/forms/<form_id>/landlord/`**

---

### 6.6 Guarantor Form

**`GET /api/forms/<form_id>/guarantor/`** — Get guarantor details  
**`GET /api/forms/guarantor/add-details/`** — Retrieve guarantor's own form  
**`POST /api/forms/guarantor/add-details/`** — Submit guarantor details

**POST Request Body:**
```json
{
  "full_name": "Jane Doe",
  "address": "50 Park Road, Manchester",
  "email": "jane@example.com",
  "phone": "07700900222",
  "relationship": "Parent"
}
```

#### Upload Guarantor Signature
**`POST /api/forms/application/<form_id>/guarantor/signature/`**  
Multipart form data with `signature` field.

#### Upload Witness Signature
**`POST /api/forms/application/<form_id>/guarantor/witness-signature/`**  
Multipart form data with `signature` field.

---

### 6.7 Agreement Form

#### Add Owner / Details
**`POST /api/forms/<form_id>/agreement/add-details`**  
**`PUT /api/forms/<form_id>/agreement/add-details`**

#### Mark Agreement Completed
**`PATCH /api/forms/<form_id>/agreement/completed`**

#### Get Agreement Status
**`GET /api/forms/<form_id>/agreement/status`**

#### Get Tenant Signatures
**`GET /api/forms/<form_id>/agreement/tenant-signatures/`**  
**`GET /api/forms/<form_id>/agreement/tenant-signatures-1/`**

#### Upload Signatures
**`POST /api/forms/<form_id>/agreement/landlord-signature/`**  
**`POST /api/forms/<form_id>/agreement/landlord-signature-1/`**  
**`POST /api/forms/<form_id>/agreement/tenant-signature/`**  
**`POST /api/forms/<form_id>/agreement/tenant-signature-1/`**  
**`POST /api/forms/<form_id>/agreement/admin-signature/`**  
**`POST /api/forms/<form_id>/agreement/admin-signature-1/`**

All signature uploads use multipart form data with a `signature` image field.

#### Pending Admin Signature
**`GET /api/forms/agreements/pending-admin-signature/`**  
Admin only. Lists agreements awaiting admin signature.

---

### 6.8 OTP Validation

**`POST /api/forms/<form_id>/otp/validate/`**  
Public.

**Request Body:**
```json
{
  "otp": "123456"
}
```

---

### 6.9 Invites

**`POST /api/forms/<form_id>/invite/`** — Send invite to tenant/guarantor  
**`GET /api/forms/<form_id>/invite/`** — List invites for form

---

### 6.10 Sign & View Form (Shared Access)

**`POST /api/forms/sign/`** — Sign a form using a shared token  
**`GET /api/forms/view/`** — View a form using a shared token

Both endpoints accept a `token` query parameter or body field.

---

### 6.11 Add Tenant Signature

**`POST /api/forms/<form_id>/add-tenant/`**  
Used to attach an additional tenant's signature to a form.

---

### 6.12 Guarantor Share Token

#### Create Share Token
**`POST /api/forms/application/<application_id>/share-token/`**  
Auth required (Landlord/Agent). Creates a link allowing a guarantor to fill out their form without an account.

#### Deactivate Share Token
**`DELETE /api/forms/share-token/<id>/deactivate/`**

---

### 6.13 Shared Guarantor Form (Token-Based Access)

**`GET /api/forms/shared/guarantor/`** — Retrieve guarantor form via share token  
**`POST /api/forms/shared/guarantor/`** — Submit guarantor form via share token

Use `X-Guarantor-Token` header or pass `token` in request body.

---

### 6.14 Lease-Based Form Data

**`GET /api/forms/lease/<lease_id>/application/`** — Application form for a lease  
**`GET /api/forms/lease/<lease_id>/guarantor/`** — Guarantor form for a lease  
**`GET /api/forms/lease/<lease_id>/agreement/`** — Agreement form for a lease

Auth required. Read-only.

---

## 7. Chat (`/api/chat/`)

> Note: The chat module also serves chat-related notifications (mark-as-seen). These live at `/api/chat/notifications/`.

### 7.1 Chat Notifications (within Chat module)

**`GET /api/chat/notifications/`** — List chat notifications  
**`GET /api/chat/notifications/<id>/`** — Get single notification  
**`POST /api/chat/notifications/<id>/mark-as-seen/`** — Mark as seen  
**`POST /api/chat/notifications/mark-all-as-seen/`** — Mark all as seen  
**`GET /api/chat/notifications/unread-count/`** — Get unread count

---

### 7.2 Chat Threads

**`GET /api/chat/thread/all/`** — List all threads (Admin only)  
**`GET /api/chat/thread/`** — Get the current user's thread with admin  
**`GET /api/chat/thread/<id>/`** — Get thread by ID

---

### 7.3 Messages

**`GET /api/chat/thread/<thread_id>/add-message/`** — List messages in thread  
**`POST /api/chat/thread/<thread_id>/add-message/`** — Send a message  
**`PATCH /api/chat/thread/<thread_id>/mark-as-read/`** — Mark all messages in thread as read

**POST Request Body:**
```json
{
  "content": "Hello, I have a question about my lease.",
  "attachment": "<optional file upload>"
}
```

---

## 8. Notifications (`/api/`)

> These are the system-wide notifications (not chat-specific).

### 8.1 List Notifications

**`GET /api/notifications/`**  
Auth required. Returns notifications for the current user.

**Response `200`:**
```json
[
  {
    "id": 1,
    "notificationType": "lease_request",
    "title": "New Lease Request",
    "message": "A new lease request has been submitted for 45 Park Lane.",
    "priority": "high",
    "isRead": false,
    "isSeen": false,
    "createdAt": "2025-09-01T10:00:00Z",
    "actionUrl": "/dashboard/leases/1"
  }
]
```

---

### 8.2 Get Notification

**`GET /api/notifications/<id>/`**

---

### 8.3 Mark as Read

**`POST /api/notifications/<id>/mark-as-read/`**  
**`POST /api/notifications/mark-all-as-read/`**

---

### 8.4 Unread Count

**`GET /api/notifications/unread-count/`**

**Response:**
```json
{
  "unread_count": 5
}
```

---

### 8.5 Summary

**`GET /api/notifications/summary/`**  
Returns a breakdown of notifications by type and priority.

---

### 8.6 Create Notification (Admin)

**`POST /api/notifications/create/`**  
Admin only.

**Request Body:**
```json
{
  "recipient": 3,
  "notification_type": "general",
  "title": "System Maintenance",
  "message": "The system will be down for maintenance on Sunday.",
  "priority": "medium"
}
```

---

### 8.7 Create Public Notification (Admin)

**`POST /api/notifications/create-public/`**  
Admin only. Sends notification to all users.

---

### 8.8 Notification Preferences

**`GET /api/notification-preferences/`** — Get preferences  
**`PUT /api/notification-preferences/`** — Update preferences  
**`PATCH /api/notification-preferences/`** — Partial update

---

## 9. Error Responses

All error responses follow a consistent format via the custom exception handler:

```json
{
  "status": "fail",
  "message": ["Error description here"]
}
```

| HTTP Status | Meaning |
|---|---|
| `400 Bad Request` | Validation errors |
| `401 Unauthorized` | Missing or invalid token |
| `403 Forbidden` | Insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `500 Internal Server Error` | Unexpected server error |

---

## 10. Data Models Reference

### User / Profile

| Field | Type | Notes |
|---|---|---|
| `id` | int | Django User PK |
| `email` | string | Used as login |
| `first_name`, `last_name` | string | |
| `profile.phone` | string | |
| `profile.status` | string | `active`, `inactive`, `suspended`, `binned`, `deleted` |
| `profile.openForAgents` | bool | Landlord setting |
| `profile.companyName` | string | Optional |
| `profile.commissionRate` | decimal | Agent-set commission % |

### Property

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `name` | string | |
| `address` | string | |
| `price` | decimal | Final price (with commission) |
| `basePrice` | decimal | Agent's original price |
| `rooms` | int | |
| `bathrooms` | int | |
| `status` | string | `available`, `rented_out`, `pending`, `flagged` |
| `cityIndex` | int | Frontend location array index |
| `areaIndex` | int | Frontend area array index |
| `epcRating` | string | A–G |
| `utilityAmount` | decimal | Weekly utility cost |
| `isFeatured` | bool | |
| `latitude`, `longitude` | decimal | Optional |

### Lease

| Field | Type | Notes |
|---|---|---|
| `id` | int | |
| `tenant` | int | User ID |
| `property_obj` | int | Property ID |
| `installmentType` | string | `monthly` or `weekly` |
| `leaseMonths` | int | 1–12 |
| `startDate` | date | |
| `endDate` | date | Computed from start + months |
| `status` | string | `pending`, `active`, `completed`, `terminated`, `tenant_closed`, `landlord_closed`, `rejected` |
| `monthlyRent` | decimal | From agreement |

### Notification Types

`chat`, `lease_request`, `lease_approval`, `lease_rejection`, `maintenance_request`, `maintenance_update`, `inspection_schedule`, `inspection_update`, `payment_received`, `payment_overdue`, `property_approval`, `property_rejection`, `agent_request`, `account_suspension`, `account_reactivation`, `removal_warning`, `account_deleted`, `account_restored`, `general`, `reels`, `marketplace`, `offers`

---

*Generated: June 2026*
