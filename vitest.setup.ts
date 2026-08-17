import '@testing-library/jest-dom/vitest';

// Auth.js validates provider config at MODULE CONSTRUCTION, so importing
// `src/auth.ts` throws before a single test runs when these are unset:
//
//     Nodemailer requires a `server` configuration.
//
// A unit test never sends mail — it asserts the module wires the provider and
// adapter correctly — so these are placeholders that satisfy construction and
// nothing else. Real values live in Vercel; a test that needed them would be
// an integration test, not this.
process.env.EMAIL_SERVER ??= 'smtp://user:pass@localhost:587';
process.env.EMAIL_FROM ??= 'noreply@localhost';
process.env.NEXTAUTH_SECRET ??= 'test-secret-not-used-outside-tests';
process.env.NEXTAUTH_URL ??= 'http://localhost:3000';
process.env.AUTH_SECRET ??= 'test-secret-not-used-outside-tests';
