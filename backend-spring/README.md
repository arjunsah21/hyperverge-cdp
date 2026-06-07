# HyperVerge CDP Spring Boot Backend

This is a Java/Spring Boot implementation of the HyperVerge CDP backend. It is kept separate from the existing FastAPI backend so either backend can be run during development.

## What It Includes

- Spring Boot REST API under `/api`
- JWT login and protected API routes
- Super-admin user management
- JPA entities matching the CDP tables
- Dashboard, customers, orders, inventory, segments, and flows APIs
- AI segment/flow generation with an OpenAI-compatible API when `OPENAI_API_KEY` is configured
- Local fallback generation when no API key is configured
- Demo data seeding for an empty database

## Requirements

- Java 17+
- Maven 3.9+
- Postgres from the root `docker-compose.yml`

## Run Locally

From the repo root:

```bash
docker compose up -d db
```

Then run the Spring backend:

```bash
cd backend-spring
mvn spring-boot:run
```

The API starts on:

```text
http://localhost:8001
```

Default seeded login:

```text
admin@hyperverge.co
admin123
```

## Frontend Proxy

The React app currently proxies `/api` to the FastAPI backend on port `8000`.
To test the Spring backend, change `frontend/vite.config.js`:

```js
target: 'http://localhost:8001'
```

Then restart the Vite dev server.

## Environment

Spring reads configuration from environment variables. See `.env.example` for the expected values. If you use a shell that supports loading env files, load it before starting Maven.

The important defaults are:

```text
SERVER_PORT=8001
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/ecommerce
SPRING_DATASOURCE_USERNAME=user
SPRING_DATASOURCE_PASSWORD=password
SEED_DATABASE=true
```

## Notes

The backend uses `spring.jpa.hibernate.ddl-auto=update` for local development. That makes it convenient as a parallel dev backend, but production should use explicit migrations.
