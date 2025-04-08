# Port Assignments for Loyalty Studio

To avoid port conflicts when running multiple apps simultaneously, each app in the Loyalty Studio monorepo has been assigned a dedicated port.

## Port Assignments

| App | Port | URL |
|-----|------|-----|
| merchant-web | 3001 | http://localhost:3001 |
| admin-portal | 3002 | http://localhost:3002 |
| api | 3003 | http://localhost:3003 |
| web | 3004 | http://localhost:3004 |
| docs | 3005 | http://localhost:3005 |

## Configuration Details

### Next.js Apps

For Next.js applications (merchant-web, admin-portal, web, docs), the port is specified in the `package.json` file:

```json
"scripts": {
  "dev": "next dev -p <PORT>",
  "start": "next start -p <PORT>"
}
```

### API App

For the API application, the port is specified in multiple places to ensure consistency:

1. Default port in `apps/api/src/config/env.ts`:
   ```typescript
   PORT: z.string().default('3003')
   ```

2. Environment variables in `.env` and `.env.local`:
   ```
   PORT=3003
   API_URL=http://localhost:3003
   ```

3. Package.json scripts:
   ```json
   "dev": "NODE_ENV=development PORT=3003 tsx watch src/index.ts",
   "start": "NODE_ENV=production PORT=3003 node dist/index.js",
   ```

This ensures that the API consistently runs on port 3003 regardless of how it's started.

## Running Multiple Apps

With these dedicated port assignments, you can now run multiple apps simultaneously without port conflicts:

```bash
# In separate terminal windows:
npm run merchant:dev  # Runs on port 3001
npm run admin:dev     # Runs on port 3002
npm run api:dev       # Runs on port 3003
npm run web:dev       # Runs on port 3004
npm run docs:dev      # Runs on port 3005
```

## API URLs

The API URLs have been updated in the environment configuration to reflect the new port assignments:

```
API_URL=http://localhost:3003
MERCHANT_WEB_URL=http://localhost:3001
ADMIN_PORTAL_URL=http://localhost:3002
WEB_URL=http://localhost:3004
DOCS_URL=http://localhost:3005
```

These URLs are used for cross-app communication and API endpoints.
