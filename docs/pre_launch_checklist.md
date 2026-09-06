# HL² Pre-Launch Production Readiness Checklist

This checklist enumerates all technical, operational, and business prerequisites that must be completed before opening HL² to real public users.

---

## 📋 Comprehensive Pre-Launch Action Items

### 1. Credentials & Partner Accounts
- [ ] **Amazon Associates**: Register and verify production Associate Tag (`tag=...`).
- [ ] **Flipkart Affiliate Program**: Configure approved Affiliate ID (`affid=...`).
- [ ] **Croma Partnership**: Configure approved UTM campaign parameters.
- [ ] **Expo Push Services**: Configure Apple APNs Push Key (`.p8`) and Android push credentials in Expo project settings.

### 2. Infrastructure & Database
- [ ] **MongoDB Atlas**: Provision production M10+ replica set cluster across multiple availability zones.
- [ ] **Database Indexes**: Execute `node backend/src/scripts/ensureIndexes.js` on production cluster.
- [ ] **Redis Cluster**: Provision production Redis instance with auth password enabled.
- [ ] **Backups**: Verify automated daily snapshot schedule in AWS S3 or Atlas.

### 3. Networking & Security
- [ ] **DNS & SSL**: Provision custom domain (`api.hl2.app`), configure DNS A records, and issue Let's Encrypt / Cloudflare SSL certificate.
- [ ] **Environment Secrets**: Generate 64-character cryptographically secure `JWT_SECRET` (`openssl rand -hex 32`) and populate production `.env`.
- [ ] **CORS Restriction**: Update `CORS_ORIGIN` in production environment to allow only authorized app schemes and web domains.

### 4. App Store & Mobile Release
- [ ] **Apple App Store Connect**: Create app entry, upload privacy policy URL, and configure age rating and metadata.
- [ ] **Google Play Console**: Create production track, fill Data Safety Form, and upload target store listing assets.
- [ ] **Production Mobile Binary Build**: Build signed production `.aab` and `.ipa` via Expo EAS (`eas build --profile production`).

### 5. Monitoring & Support
- [ ] **Sentry APM**: Initialize Sentry DSN in backend and mobile for real-time crash alerting.
- [ ] **Uptime Monitoring**: Configure external ping monitor on `GET /api/health`.
- [ ] **Customer Support Channel**: Set up support email (`support@hl2.app`).
