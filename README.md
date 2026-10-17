# Gazellekey Admin Portal

Staff and administration portal for Gazellekey International. It has no
database of its own; all data comes from the backend API project
(`../gazellkey-client/gazellkey-international`).

## Run it

1. Start the backend API first.
2. Copy `.env.example` to `.env.local` and set `API_URL` to the backend's address.
3. `npm install`
4. `npm run dev`, then open http://localhost:3001

Sign in with a STAFF, FINANCE or ADMIN account (for example the one made by
the backend's `npm run seed`). Customer and supplier accounts are refused.

## How it talks to the API

- `next.config.ts` rewrites `/api/*` to `API_URL/api/*`. The browser only ever
  sees this site, so the backend's httpOnly `login-token` cookie works without CORS.
- Server components call the API with `apiGet()` in `lib/api.ts`, which passes
  the user's cookie on. A 401 sends the user to `/login`.
- Client components use `apiRequest()` in `lib/api-client.ts`.
- `proxy.ts` only checks that the cookie exists. The real check is in
  `app/(portal)/layout.tsx` (`requireStaff`) and in every backend route.
- Menu items are hidden by privilege (`lib/nav.ts`). The backend still checks
  every request and is the real authority.

## Pages

| Path          | Backend route     |
| ------------- | ----------------- |
| `/`           | `/api/dashboard`  |
| `/enquiries`  | `/api/enquiries`  |
| `/customers`  | `/api/customers`  |
| `/quotations` | `/api/quotations` |
| `/orders`     | `/api/orders`     |
| `/payments`   | `/api/payments`   |
| `/users`      | `/api/users`      |
