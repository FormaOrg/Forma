# Frontend

Angular 20 SPA for FORMA.

## Local development

```bash
npm install
npm start
```

Local frontend runs on `http://localhost:4200` and expects the backend on `http://localhost:8081/api`.

## Production build

```bash
npm run build
```

Build output is generated in `dist/Frontend/browser`.

## Cloudflare Pages

This frontend is prepared for Cloudflare Pages as a static SPA.

Recommended Pages settings if the repository root is the project root:

```text
Framework preset: None
Build command: cd Frontend && npm ci && npm run build
Build output directory: Frontend/dist/Frontend/browser
Root directory: /
```

Alternative settings if you set `Frontend/` as the Pages root directory:

```text
Framework preset: None
Build command: npm ci && npm run build
Build output directory: dist/Frontend/browser
Root directory: Frontend
```

Set `NODE_VERSION=20` in Cloudflare Pages build environment.

SPA fallback is handled by [public/_redirects](C:/Users/Infoshop/Desktop/forma_proj_main/Frontend/public/_redirects), so direct navigation to Angular routes works on Pages.

## Production backend target

Production frontend traffic is configured to call:

```text
https://forma-production-c40b.up.railway.app/api
```

and WebSocket activity updates use:

```text
wss://forma-production-c40b.up.railway.app/ws/activity
```

If you move the backend to another hostname later, update:

- `src/environments/environment.prod.ts`
- `src/index.html`
- `public/google-oauth-popup.html`

For Railway, make sure these production variables point to your real Cloudflare frontend URL, not the old Vercel one:

```text
FRONTEND_URL=https://your-cloudflare-domain
APP_ALLOWED_ORIGINS=https://your-cloudflare-domain
GOOGLE_LINK_REDIRECT_URI=https://your-cloudflare-domain/google-oauth-popup.html
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
```

## Important limitation

Cloudflare Pages can host `formaa.studio` and `www.formaa.studio`, but it does not provide wildcard tenant subdomains by itself. Path-based public routes such as `/store/:projectId` are fine. Host-based tenant routing like `shop1.formaa.studio` needs a different Cloudflare product layer than Pages alone.
