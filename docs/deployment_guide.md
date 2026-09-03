# HL² Production Deployment Guide

This guide covers deployment instructions for the HL² backend API, background workers, and mobile client builds.

---

## 🚀 1. Backend Container Deployment (Docker & PM2)

### Dockerfile (Backend)
```dockerfile
# Multi-stage production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Run as non-privileged user for security
USER node
EXPOSE 5001

CMD ["node", "src/server.js"]
```

### PM2 Cluster Configuration (`ecosystem.config.cjs`)
```javascript
module.exports = {
  apps: [
    {
      name: 'hl2-api',
      script: 'src/server.js',
      instances: 'max', // Scale to available CPU cores
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'hl2-worker',
      script: 'src/workers/priceQueueWorker.js',
      instances: 2, // Dedicated background queue worker processes
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

---

## 🌐 2. Nginx Reverse Proxy & Load Balancing Configuration

```nginx
upstream hl2_backend_cluster {
    server 127.0.0.1:5001 max_fails=3 fail_timeout=10s;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.hl2.app;

    ssl_certificate /etc/letsencrypt/live/api.hl2.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.hl2.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Payload limits & timeouts
    client_max_body_size 2M;
    proxy_connect_timeout 5s;
    proxy_read_timeout 15s;

    location / {
        proxy_pass http://hl2_backend_cluster;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📱 3. Mobile Production Release (Expo EAS / Fastlane)

1. **Pre-build Typecheck & Linting**:
   ```bash
   npm run typecheck:mobile
   ```

2. **Build Production Binaries**:
   - **Android**: `eas build --platform android --profile production` (Generates signed `.aab` for Google Play Console).
   - **iOS**: `eas build --platform ios --profile production` (Generates `.ipa` signed with Apple Distribution Certificate for TestFlight / App Store).

3. **Release Submission**:
   - `eas submit -p android`
   - `eas submit -p ios`
