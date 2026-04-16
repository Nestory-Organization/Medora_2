# Medora Healthcare Microservices

A production-ready Node.js and Express microservices project structure for a healthcare platform.

## Services

- api-gateway (Port 4000)
- auth-service (Port 4001)
- patient-service (Port 4002)
- doctor-service (Port 4003)
- appointment-service (Port 4004)
- payment-service (Port 4005)
- notification-service (Port 4006)
- ai-service (Port 4007)

Each service includes:

- Express server setup
- Routes
- Controllers
- Models
- Config
- Dockerfile

Each domain service has its own MongoDB container and database.

## API Gateway Routes

- `/api/auth/*` -> auth-service
- `/api/patients/*` -> patient-service
- `/api/doctors/*` -> doctor-service
- `/api/appointments/*` -> appointment-service
- `/api/payments/*` -> payment-service
- `/api/notifications/*` -> notification-service
- `/api/ai/*` -> ai-service

Appointment-service doctor search endpoint:

- `/appointments/doctors/search?specialty=Cardiology`

## Quick Start

1. Build and run all containers:

```bash
docker compose up --build
```

2. Health checks:

- Gateway: `http://localhost:4000/health`
- Auth service via gateway: `http://localhost:4000/api/auth/health`
- Patient service via gateway: `http://localhost:4000/api/patients/health`
- Doctor service via gateway: `http://localhost:4000/api/doctors/health`
- Appointment service via gateway: `http://localhost:4000/api/appointments/health`

## Appointment Service API

Doctor search with real MongoDB data:

- `GET /api/appointments/doctors/search?specialty=Cardiology&date=2026-04-20`

Book appointment:

- `POST /api/appointments` with appointment details
- Requires authentication (JWT token)

Get my appointments:

- `GET /api/appointments/my-appointments`
- Requires authentication (JWT token)

## Notes

- Service-to-service communication happens over the Docker network.
- Environment variables can be overridden in `docker-compose.yml` or service-level `.env` files.
