# Database Schema Documentation

## Models

### User
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| email | String | Unique user email |
| password_hash | String | Bcrypt hashed password |
| role | Enum (ADMIN, STAFF) | User role |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

### InventoryItem
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| sku | String | Unique stock keeping unit |
| name | String | Product name |
| description | String? | Product description |
| quantity | Int | Current stock level |
| reorder_point | Int | Threshold for low stock alert |
| category | String? | Product category |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Indexes:** sku, deleted, created_at

### Vendor
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Vendor name |
| contact_name | String? | Primary contact person |
| email | String? | Contact email |
| phone | String? | Contact phone |
| address | String? | Vendor address |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Indexes:** deleted, created_at

**Relations:** One-to-many with PurchaseOrder

### PurchaseOrder
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| po_number | String | Unique PO number |
| vendor_id | String | Foreign key to Vendor |
| status | Enum (DRAFT, APPROVED, SENT) | PO status |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Indexes:** vendor_id, status, deleted, created_at

**Relations:** Many-to-one with Vendor, One-to-many with POItem

### POItem
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| purchase_order_id | String | Foreign key to PurchaseOrder |
| item_name | String | Item description |
| quantity | Int | Quantity ordered |
| unit_price | Decimal(10,2) | Price per unit |
| total | Decimal(10,2) | Total line amount |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

**Indexes:** purchase_order_id

**Relations:** Many-to-one with PurchaseOrder (cascade delete)

### PasswordResetToken
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| user_id | String | Foreign key to User |
| token | String | Unique reset token |
| expires_at | DateTime | Token expiration time |
| created_at | DateTime | Creation timestamp |

**Indexes:** user_id, token

**Relations:** Many-to-one with User (cascade delete)

## Seed Data

### Users
- admin@example.com / admin123 (ADMIN)
- staff@example.com / staff123 (STAFF)

### Vendors
- Acme Supplies Co. (john@acmesupplies.com)
- Global Parts Inc. (jane@globalparts.com)
- FastShip Warehouse (bob@fastship.com)