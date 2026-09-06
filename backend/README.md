# HL² Backend API & Background Workers

The high-performance backend powering the **HL² Universal Shopping Hub & Price Intelligence Engine**. Built with **Node.js (ES Modules)**, **Express**, **MongoDB Atlas**, and **BullMQ / Redis**.

---

## 🚀 Key Responsibilities

1. **Universal User & Profile Engine**:
   - Master authentication with Bcrypt (12 work factor salt rounds) and strict JWT (`HS256`).
   - Unified e-commerce profile management (`PUT /api/auth/profile`) supporting name, phone (+91), gender, date of birth, and formatted Indian delivery addresses.
   - Platform connection synchronization (`POST /api/auth/sync-platforms`) keeping timestamps and linkage states with Amazon, Flipkart, Myntra, and Meesho.
   - Google social authentication bridge (`POST /api/auth/google`).

2. **Price Intelligence Services**:
   - **URL Analyzer**: Extracts canonical product IDs (ASIN, PID, etc.) from retailer links.
   - **Product Normalizer & Matcher**: Cleans attributes and maps matching products across retailers.
   - **Price History Service**: Computes 180-day price trends, moving averages, and percentage drops.
   - **Buy Now Link Generator**: Generates safe, verified merchant URLs with dynamic partner tags.

3. **Background Scanner & Alert Engine**:
   - **BullMQ Queue**: Redis-backed queue scheduling periodic automated scans for watched products.
   - **Notification Service**: Expo Push Gateway with deduplication logging.

---

## 📡 API Routes

### Authentication & Profile (`/api/auth`)
- `POST /register` — Register new user with phone & shipping address
- `POST /login` — Authenticate user credentials
- `POST /google` — Sign in or register via Google OAuth
- `GET /me` — Fetch currently authenticated user
- `PUT /profile` — Update master profile details & shipping address
- `POST /sync-platforms` — Synchronize profile credentials with Amazon, Flipkart, Myntra, Meesho

### Products & Intelligence (`/api/products`)
- `POST /analyze` — Parse product URL, clean tracking tags, extract ID
- `POST /compare` — Compare prices across authorized stores
- `GET /:id/history` — Fetch historical price observations & statistics
- `POST /buy-now` — Generate verified external store redirection

### Watchlist & Alerts (`/api/watchlist`, `/api/alerts`)
- `GET /watchlist` — List saved items
- `POST /watchlist` — Save item to watchlist
- `DELETE /watchlist/:id` — Delete item from watchlist
- `GET /alerts` — List user's price drop alerts
- `POST /alerts` — Create price drop target
- `DELETE /alerts/:id` — Remove price drop alert

---

## 🧪 Running Tests

The backend includes 16 automated test suites covering all controllers, security, rate limiting, and performance:

```bash
npm test
```

To run individual test suites:
```bash
npm run test:auth
npm run test:security
npm run test:perf
```

---

## ⚙️ Environment Variables

Configure `.env` in the `backend/` directory:

```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/hl2
JWT_SECRET=your_super_secret_jwt_key_32_characters_minimum
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
REDIS_HOST=localhost
REDIS_PORT=6379
```
