# Marlin Sea Food ERP — Phase 5: Purchase Billing & Stock Management Documentation

## 1. Overview
Phase 5 implements the complete, audit-ready **Purchase Billing** and **Stock Management** engine for the Marlin Sea Food ERP / POS system. It provides atomic transaction processing, rate snapshotting from published daily seafood rates, payment record-keeping, fisherman outstanding balance calculations, real-time stock updates, and complete stock movement audit trails.

---

## 2. Database Models & Schema

### `PurchaseBill`
- `id` (UUID, Primary Key)
- `billNumber` (String, Unique, e.g. `PUR-20260928-0001`)
- `billDate` (Date, normalized UTC @db.Date)
- `fishermanId` (UUID, Foreign Key &rarr; `Fisherman`)
- `totalKg` (Decimal(10, 2))
- `subtotal` (Decimal(10, 2))
- `discount` (Decimal(10, 2), default `0.00`)
- `grandTotal` (Decimal(10, 2))
- `paidAmount` (Decimal(10, 2), default `0.00`)
- `outstandingAmount` (Decimal(10, 2), default `0.00`)
- `paymentStatus` (`PENDING`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`)
- `status` (`DRAFT`, `POSTED`, `CANCELLED`, default `POSTED`)
- `notes` (String, nullable)
- `createdById`, `updatedById` (UUID, Foreign Key &rarr; `User`)
- `deletedAt`, `createdAt`, `updatedAt` (Timestamps)

### `PurchaseBillItem`
- `id` (UUID, Primary Key)
- `purchaseBillId` (UUID, Foreign Key &rarr; `PurchaseBill`, Cascade Delete)
- `seafoodId` (UUID, Foreign Key &rarr; `Seafood`, Restrict Delete)
- `gradeId` (UUID, Foreign Key &rarr; `SeafoodGrade`, Restrict Delete)
- `quantityKg` (Decimal(10, 2))
- `purchaseRate` (Decimal(10, 2), **immutable rate snapshot**)
- `amount` (Decimal(10, 2), `quantityKg * purchaseRate` rounded to 2 decimal places)
- `createdAt`, `updatedAt` (Timestamps)

### `Payment`
- `id` (UUID, Primary Key)
- `purchaseBillId` (UUID, Foreign Key &rarr; `PurchaseBill`, nullable)
- `amount` (Decimal(10, 2))
- `paymentMethod` (`CASH`, `UPI`, `BANK_TRANSFER`, `CREDIT`)
- `paymentStatus` (`PENDING`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`)
- `paymentDate` (DateTime, default `now()`)
- `referenceNumber` (String, nullable)
- `notes` (String, nullable)
- `createdById` (UUID, Foreign Key &rarr; `User`)
- `createdAt`, `updatedAt` (Timestamps)

### `Stock`
- `id` (UUID, Primary Key)
- `seafoodId` (UUID, Foreign Key &rarr; `Seafood`)
- `gradeId` (UUID, Foreign Key &rarr; `SeafoodGrade`)
- `quantityKg` (Decimal(10, 2), current stock balance)
- `createdAt`, `updatedAt` (Timestamps)
- **Constraint**: `@@unique([seafoodId, gradeId])`

### `StockMovement`
- `id` (UUID, Primary Key)
- `stockId` (UUID, Foreign Key &rarr; `Stock`)
- `seafoodId` (UUID, Foreign Key &rarr; `Seafood`)
- `gradeId` (UUID, Foreign Key &rarr; `SeafoodGrade`)
- `movementType` (`PURCHASE`, `EXPORT`, `ADJUSTMENT`, `RETURN`, `WASTE`)
- `quantityKg` (Decimal(10, 2), positive quantity purchased)
- `balanceBefore` (Decimal(10, 2))
- `balanceAfter` (Decimal(10, 2))
- `referenceType` (String, e.g. `'PURCHASE_BILL'`)
- `referenceId` (String, `PurchaseBill.id`)
- `movementDate` (DateTime)
- `notes` (String, nullable)
- `createdById` (UUID, Foreign Key &rarr; `User`)
- `createdAt` (Timestamp)

---

## 3. Core Business Workflow & Atomic Transaction

All operations during purchase creation occur within **one atomic Prisma transaction** (`prisma.$transaction`):
1. **Validate Fisherman**: Must exist, not deleted, and `status === 'ACTIVE'`.
2. **Validate Items**:
   - Must contain &ge; 1 item.
   - Rejects duplicate seafood+grade combinations (`DUPLICATE_PURCHASE_ITEM`).
   - Validates each seafood exists and is `ACTIVE`.
   - Validates each grade exists and is active.
   - Validates `quantityKg > 0`.
3. **Lookup Published DailyRate**:
   - Queries `DailyRate` for `(billDate, seafoodId, gradeId, status: 'PUBLISHED')`.
   - If not found, aborts with `RATE_NOT_PUBLISHED`.
   - Captures `purchaseRate` snapshot.
4. **Calculations via Prisma Decimal**:
   - `item.amount = quantityKg * purchaseRate`
   - `subtotal = sum(item.amount)`
   - `discount` validated: `0 <= discount <= subtotal`.
   - `grandTotal = subtotal - discount`
5. **Payment & Outstanding Logic**:
   - Validates `0 <= payment.amount <= grandTotal`.
   - If `CREDIT` with `amount == 0`: `paidAmount = 0`, `outstandingAmount = grandTotal`, `paymentStatus = 'PENDING'`.
   - If `amount == grandTotal`: `paymentStatus = 'PAID'`, `outstandingAmount = 0`.
   - If `0 < amount < grandTotal`: `paymentStatus = 'PARTIALLY_PAID'`, `outstandingAmount = grandTotal - amount`.
6. **Bill Number Generation**:
   - Atomic server-side generator produces collision-safe sequential IDs: `PUR-YYYYMMDD-XXXX`.
7. **Create PurchaseBill & PurchaseBillItem records**.
8. **Create Payment Record**.
9. **Update Stock & Create StockMovement**:
   - Find or create `Stock` for each `(seafoodId, gradeId)`.
   - `balanceBefore = stock.quantityKg`
   - `balanceAfter = balanceBefore + item.quantityKg`
   - Record immutable `StockMovement` with `movementType = 'PURCHASE'`, `referenceType = 'PURCHASE_BILL'`.
10. **Commit Transaction**: If any step fails, everything is rolled back with zero leftover side effects.

---

## 4. API Endpoints

### Purchase Bills
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/purchase-bills` | List purchase bills (supports `page`, `limit`, `billDate`, `fromDate`, `toDate`, `fishermanId`, `status`, `paymentStatus`, `search`) |
| `GET` | `/api/purchase-bills/:id` | Get purchase bill detail with fisherman, items, seafood, grade, and payments |
| `POST` | `/api/purchase-bills` | Create purchase bill with atomic stock update and payment logging |
| `PATCH` | `/api/purchase-bills/:id` | Update non-financial fields (`notes`) on posted bills; rejects financial mutations |

### Stock Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stock` | List stock balances (supports `page`, `limit`, `seafoodId`, `gradeId`, `categoryId`, `search`) |
| `GET` | `/api/stock/movements` | Stock movement history (supports `page`, `limit`, `seafoodId`, `gradeId`, `movementType`, `fromDate`, `toDate`, `referenceType`) |
| `GET` | `/api/stock/:seafoodId/:gradeId` | Current stock balance for seafood + grade combination |
| `GET` | `/api/stock/:id` | Get stock record details by ID |

---

## 5. Standardized Error Codes
- `PURCHASE_BILL_NOT_FOUND` (404)
- `FISHERMAN_NOT_FOUND` (404)
- `FISHERMAN_INACTIVE` (400)
- `SEAFOOD_NOT_FOUND` (404)
- `SEAFOOD_INACTIVE` (400)
- `GRADE_NOT_FOUND` (404)
- `RATE_NOT_PUBLISHED` (400)
- `INVALID_QUANTITY` (400)
- `INVALID_RATE` (400)
- `INVALID_DISCOUNT` (400)
- `INVALID_PAYMENT_AMOUNT` (400)
- `DUPLICATE_PURCHASE_ITEM` (400)
- `STOCK_NOT_FOUND` (404)
- `PURCHASE_BILL_ALREADY_POSTED` (400)
- `PURCHASE_BILL_ALREADY_CANCELLED` (400)
