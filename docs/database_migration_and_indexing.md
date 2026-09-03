# HL² Database Indexing & Migration Strategy

This document establishes procedures for maintaining high-performance compound indexing, schema versioning, and zero-downtime database migrations.

---

## 📊 Complete Production Index Catalog

### 1. `PriceHistory` Collection
| Index Keys | Type | Purpose |
| :--- | :--- | :--- |
| `{ product: 1, timestamp: -1 }` | Compound | Fast 7D/30D/90D time-series charts |
| `{ product: 1, retailer: 1, timestamp: -1 }` | Compound | Filtered retailer historical trends |
| `{ timestamp: 1 }` | Single | Automated rolling archive / TTL cleanup |

### 2. `PriceAlert` Collection
| Index Keys | Type | Purpose |
| :--- | :--- | :--- |
| `{ active: 1, triggered: 1, product: 1, targetPrice: 1 }` | Compound | Background worker high-speed evaluation |
| `{ user: 1, active: 1, createdAt: -1 }` | Compound | User active alerts list view |
| `{ product: 1, active: 1 }` | Compound | Instant price drop matching |

### 3. `Watchlist` Collection
| Index Keys | Type | Purpose |
| :--- | :--- | :--- |
| `{ user: 1, product: 1 }` | Unique Compound | Prevents duplicate watchlist entries per user |
| `{ user: 1, createdAt: -1 }` | Compound | User watchlist feed ordering |

### 4. `SearchHistory` Collection
| Index Keys | Type | Purpose |
| :--- | :--- | :--- |
| `{ user: 1, searchedAt: -1 }` | Compound | Recent searches feed ordering |
| `{ user: 1, url: 1 }` | Compound | Deduplication & LRU timestamp update |

### 5. `NotificationLog` Collection
| Index Keys | Type | Purpose |
| :--- | :--- | :--- |
| `{ user: 1, alert: 1, price: 1 }` | Compound | Duplicate notification suppression |
| `{ user: 1, sentAt: -1 }` | Compound | User notification history feed |
| `{ sentAt: 1 }` | TTL (90 Days) | Automated expiration of old log documents |

---

## 🚀 Zero-Downtime Index Synchronization

In production, run index synchronization prior to traffic cutover:

```bash
npm --prefix backend run db:index
# or directly:
node backend/src/scripts/ensureIndexes.js
```

### Schema Migration Guidelines
1. **Additive Schema Updates**: New fields must always have default values or be optional in Mongoose schemas.
2. **Backfill Scripts**: Write idempotent migration scripts using batch cursor pagination (`.cursor().batchSize(500)`) to avoid locking collections.
3. **No Downtime Field Renaming**: Use Mongoose virtuals for legacy field aliases during transitions before removing deprecated fields.
