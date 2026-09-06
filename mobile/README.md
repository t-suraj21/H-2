# HL² Mobile App — Universal Shopping Client

The official cross-platform mobile client for **HL²**, built with **React Native (0.76.7)**, **Expo SDK 52**, and **TypeScript (5.3.3)**.

---

## 📱 Features

1. **Multi-Store Shopping Hub (`HomeScreen.tsx`)**:
   - Modern shopping hub showcasing **Amazon India**, **Flipkart**, **Myntra**, and **Meesho**.
   - One-tap "Open Store" launches into embedded real store views.
   - Quick action shortcuts for price comparisons, watchlists, alerts, and deals.

2. **Universal E-Commerce Master Profile (`ProfileScreen.tsx`)**:
   - VIP Dark Card inspired by **Myntra Insider**, **Amazon Prime**, and **Flipkart Plus**.
   - **Connected Store Accounts Hub**: Live status cards for Amazon, Flipkart, Myntra, and Meesho.
   - **⚡ 1-Tap Store Sync**: Synchronizes master user credentials and addresses across all 4 platforms simultaneously.
   - **Universal Delivery Address Manager**: Full support for Indian street addresses, cities, states, and 6-digit PIN codes.
   - **Multi-Store Orders Drawer**: Direct 1-tap navigation into active orders on Amazon, Flipkart, Myntra, or Meesho.

3. **In-App Store WebView & Auto-Fill Engine (`ShoppingWebViewScreen.tsx`)**:
   - High-speed embedded browsing with isolated cookies and native gestures.
   - **Intelligent JavaScript Injection**:
     - Auto-fills user email and phone number on retailer login / registration forms.
     - Auto-fills recipient name, address line 1, line 2, city, state, and PIN code on checkout and delivery address pages.
   - In-app toolbar with back, forward, refresh, share, and manual "Auto-Fill" trigger buttons.

4. **Authentication & Identity (`AuthContext.tsx`)**:
   - Firebase Auth (Google Sign-In) + Native Email & Password auth.
   - Secure encrypted token storage (`expo-secure-store` / async storage).
   - Instant state persistence with offline fallback support.

---

## 🚀 Running Locally

```bash
# From mobile/ directory:
npm install

# Start Expo development server:
npx expo start
```

### Shortcuts in Expo CLI:
- `a` — Open in **Android Emulator**
- `i` — Open in **iOS Simulator**
- `w` — Open in **Web Browser**
- Scan the QR code using **Expo Go** on your physical device.

---

## 🧪 TypeScript Compilation Check

```bash
# Verify type correctness
npx tsc --noEmit
```
*(Guaranteed 0 errors)*
