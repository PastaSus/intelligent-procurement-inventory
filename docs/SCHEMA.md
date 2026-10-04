# Database Schema Documentation

## Models

### User
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| email | String | Unique user email |
| password_hash | String | Bcrypt hashed password |
| role | Enum (ADMIN, TECHNICIAN) | User role |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

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

### LaboratoryRoom
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Unique room name (e.g., "Laboratory 127A") |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Indexes:** name, deleted

**Relations:** One-to-many with ComputerUnit

### ComputerUnit
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| unit_name | String | Unit identifier (e.g., "LR1U01") |
| laboratory_room_id | String | Foreign key to LaboratoryRoom |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Unique constraint:** (unit_name, laboratory_room_id)
**Indexes:** laboratory_room_id, deleted

**Relations:** Many-to-one with LaboratoryRoom, One-to-many with ComputerComponent

### ComputerComponent
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| computer_unit_id | String | Foreign key to ComputerUnit |
| type | Enum (ComponentType) | Type of component |
| serial_number | String | Unique per-component serial number |
| specifications | String | Hardware specs (e.g., "Intel Core i5 4460") |
| status | Enum (ComponentStatus) | Functional status |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |

**Indexes:** computer_unit_id, type, status

**Relations:** Many-to-one with ComputerUnit (cascade delete)

### InventoryItem (Spare Parts)
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| sku | String | Unique stock keeping unit |
| name | String | Part name |
| description | String? | Part description |
| quantity | Int | Current stock level |
| reorder_point | Int | Threshold for low stock alert |
| component_type | Enum (ComponentType)? | Links spare part to component type for automated replenishment |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Indexes:** sku, component_type, deleted

### PurchaseRequest
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| pr_number | String | Unique request number |
| status | Enum (PurchaseRequestStatus) | DRAFT, REQUESTED, APPROVED, REJECTED, FULFILLED |
| notes | String? | Additional notes |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |
| created_by | String? | User who created this record |
| updated_by | String? | User who last updated this record |
| deleted | Boolean | Soft delete flag |

**Indexes:** status, deleted, created_at

**Relations:** One-to-many with RequestItem

### RequestItem
| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| purchase_request_id | String | Foreign key to PurchaseRequest |
| item_name | String | Item description |
| quantity | Int | Quantity requested |
| unit_price | Decimal(10,2)? | Estimated unit price |
| total | Decimal(10,2)? | Estimated total line amount |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

**Indexes:** purchase_request_id

**Relations:** Many-to-one with PurchaseRequest (cascade delete)

## Enums

### Role
ADMIN, TECHNICIAN

### ComponentType
MOTHERBOARD, PROCESSOR, MEMORY, HDD, MONITOR, KEYBOARD, MOUSE, AVR, OPTICAL_DRIVE

### ComponentStatus
FUNCTIONAL, NEEDS_REPAIR, NEEDS_REPLACEMENT

### PurchaseRequestStatus
DRAFT, REQUESTED, APPROVED, REJECTED, FULFILLED

## Relationships Summary

```
User 1──many PasswordResetToken
LaboratoryRoom 1──many ComputerUnit
ComputerUnit 1──many ComputerComponent
InventoryItem ── ComponentType (logical link for replenishment)
PurchaseRequest 1──many RequestItem
```

## Seed Data

### Users
- admin@example.com / admin123 (ADMIN)
- tech@example.com / tech123 (TECHNICIAN)
