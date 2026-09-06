/**
 * Re-export Firebase configuration from src/config/firebaseConfig
 * (Prevents duplicate configuration and avoids hardcoded secrets)
 */
export { firebaseConfig, app, auth, default } from './src/config/firebaseConfig';
