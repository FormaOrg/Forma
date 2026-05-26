# Backend

Forma now runs as a single Spring Boot backend under `Backend/service-utilisateurs`.

That service already contains the auth, users, projects, storefront, commerce, analytics, billing, media, and public storefront controllers, so the repository no longer needs to build or launch five separate backend applications for normal development.

## Build

From `Backend/`:

```bash
mvn clean package
```

This now builds the single backend module only.

## Run Locally

From the repository root:

```bash
.\start-backend-local.ps1
```

The backend will be available at:

```text
http://localhost:8081
```

## Run With Docker

From the repository root:

```bash
.\start-backend.ps1
```

This uses [`Backend/docker-compose.yml`](c:\My Folders\IGL3\S2\Nouvelles Tech°\Forma\Backend\docker-compose.yml) and starts a single container:

- `forma_backend`

## Environment

The backend still reads shared environment values from:

- `Backend/service-utilisateurs/.env`

That file contains sensitive credentials and should not be copied into commits, docs, or logs.
