# Backend Microservices

This backend is now organized as multiple focused Spring Boot services under `Backend/`:

- `service-utilisateurs`: authentication, users, profile, session activity, and avatar uploads
- `service-projets`: project lifecycle, templates, and project asset uploads
- `service-commerce`: catalog, customers, sales, storefront, portfolio pages, portfolio inquiries, and public checkout
- `service-analytics`: project analytics, public analytics tracking, and dashboard home insights
- `service-billing`: billing overview, invoices, payment methods, and subscriptions

## Build

From `Backend/`:

```bash
mvn clean package
```

## Run With Docker

From `Backend/`:

```bash
docker compose up --build
```

The compose setup uses the hosted database credentials from [`service-utilisateurs/.env`](g:\Coding\Forma\Backend\service-utilisateurs\.env). It does not start a local Postgres container anymore.

If you want to run one service by itself, each service folder also has its own `docker-compose.yml` wired to the same hosted env file.

## Ports

- `service-utilisateurs`: `8081`
- `service-projets`: `8082`
- `service-commerce`: `8083`
- `service-analytics`: `8084`
- `service-billing`: `8085`
