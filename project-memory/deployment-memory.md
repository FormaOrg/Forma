# Deployment Memory

## Current Understanding

This repo has both Docker-based backend startup and local per-service startup scripts.

## Frontend Notes

Frontend path:
- `Frontend`

Local development:
- `ng serve`
- default Angular local host is `http://localhost:4200`

Build:
- `ng build`
- `npx ng build --configuration development`

Tooling notes:
- Angular CLI version shown in frontend README is `20.3.6`
- `package.json` pins `vite` through an override to `7.3.2`

## Backend Notes

Backend root:
- `Backend`

Docker startup:
- root script `start-backend.ps1`
- runs `docker compose -f Backend/docker-compose.yml up --build -d`

Docker ports from compose/readme:
- users `8081`
- projects `8082`
- commerce `8083`
- analytics `8084`
- billing `8085`

Local non-Docker startup:
- root script `start-backend-local.ps1`
- starts each service with `mvnw.cmd spring-boot:run`
- writes logs under `.run/logs`
- writes pids under `.run/pids`

Local stop:
- `stop-backend-local.ps1`

Dockerfile pattern inspected:
- service Dockerfiles use Maven base image to build
- then Temurin JRE alpine image to run
- jars are copied from `target/*.jar`

Runtime/storage notes:
- compose defines `uploads_data` volume
- compose uses `service-utilisateurs/.env` as an env source

Security note:
- `.env` contains sensitive secrets; do not surface values in docs or logs

## Database / Schema Notes

Repo contains schema guidance in:
- `database/mvp-current-pages-schema.md`
- `database/mvp-current-pages.sql`

Observed theme:
- schema is still MVP-oriented and includes storefront draft/publish JSON fields

## Testing / Verification Notes

Frontend:
- `npx tsc -p Frontend/tsconfig.app.json --noEmit`
- `npx ng build --configuration development`

Backend:
- `mvn clean package` from `Backend`

End-to-end local verification usually requires:
- frontend on `4200`
- backend services on `8081` to `8085`

## Needs Verification

- production hosting topology
- reverse proxy/API gateway details
- database migration tooling, if any
- whether frontend `environment.apiUrl = http://localhost:8081/api` is intended to go through a gateway or is temporary during backend split
