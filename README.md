# Redis Case Study

_A case study of various use-cases for caching patterns using Redis_

## Overview

Eventually, I want to be able to build websites, applications, and games that are quick and responsive for end users. This means that I will want to become familiar with _caching_ - - what forms it comes in, in what scenarios it is useful, and how to implement it. That is why I want to conduct a case study of various use-cases for caching patterns. For more information, see [this document](resources/Project%20Idea.pdf).

## Potential architecture

At the moment, I am planning on containerizing my backend application in Docker, utilizing local Redis and PostgreSQL containers. If this architecture fails to stand up to load-testing in Postman (5,000 reads and writes), then I will switch to using Redis and PostgreSQL in the cloud instead. If this architecture works, though, then it will look like the following:

![Architecture diagram](resources/project-architecture.svg)

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm
- Docker and Docker Compose (for containerized development)

### Installation

#### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

#### Docker Development

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Start the Docker containers:
   ```bash
   docker-compose up
   ```

This will start the following services:
- Node.js application on port 7090
- PostgreSQL on port 5432
- Redis on port 6379

### Running the application

#### Local Development

To start the development server:
```bash
npm run dev
```

This will start the server on port 7090. You can access the health check endpoint at:
```
http://localhost:7090/health
```

#### Docker Development

The application starts automatically when running `docker-compose up`. 

You can access the health check endpoint at:
```
http://localhost:7090/health
```

### Testing

#### Local Testing

To run tests:
```bash
npm test
```

#### Docker Testing

To run tests in the containerized environment:
```bash
docker-compose -f docker-compose.test.yml up --build
```

### Building for production

#### Local Build

To build the application:
```bash
npm run build
```

To start the production server:
```bash
npm start
```

#### Docker Production Build

To build and run the production Docker image:
```bash
docker build -t redis-case-study .
docker run -p 7090:7090 redis-case-study
```

### Docker Commands

#### View logs
```bash
docker-compose logs -f
```

#### Connect to PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d redis_case_study
```

#### Connect to Redis CLI
```bash
docker-compose exec redis redis-cli
```

#### Stop all services
```bash
docker-compose down
```

#### Stop and remove volumes
```bash
docker-compose down -v
```

### API Documentation

The API is documented using Swagger/OpenAPI 3.0. You can access the interactive API documentation at:
```
http://localhost:7090/api-docs
```
This documentation provides:
- Detailed information about all available endpoints
- Request/response schemas
- Interactive API testing interface
- Models and component definitions

The documentation is available when running either in local development or Docker mode.

### Database Management

#### Running Prisma Migrations

To create a new migration based on schema changes:
```bash
npx prisma migrate dev --name <migration-name>
```

To apply migrations to a production environment:
```bash
npx prisma migrate deploy
```

To reset your database (caution: this will delete all data):
```bash
npx prisma migrate reset
```

To generate Prisma client after schema changes:
```bash
npx prisma generate
```

To view your database with Prisma Studio:
```bash
npx prisma studio
```

### Work Log

To use the work log script:
```bash
npm run worklog
```

## Project Documentation

### Work Log

This project maintains a detailed work log that documents decisions made, implementation details, and challenges encountered during development. The work log is structured as follows:

- [Work Log Index](docs/work-log-index.md): Main chronological index of all work log entries
- Individual work log files in the [docs/work-logs](docs/work-logs/) directory

#### Creating New Work Log Entries

To create a new work log entry, use the provided script:

```bash
npm run worklog "Feature Name"
```

This will:
1. Create a new markdown file in the `docs/work-logs` directory with the current date and feature name
2. Add a template with standard sections for documenting decisions, technical details, and implementation challenges
3. Update the work log index file with a link to the new entry

After creating the entry, edit the generated file to document your work on the feature.
