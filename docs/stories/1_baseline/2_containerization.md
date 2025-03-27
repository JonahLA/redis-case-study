# Ticket: Docker Containerization Setup

## Description
This ticket focuses on containerizing the backend application along with PostgreSQL and Redis services using Docker to ensure a consistent development environment. The containerization will include:
- Creating a Dockerfile for the Node.js application
- Setting up Docker Compose for local development with PostgreSQL and Redis
- Configuring environment variables for the development context
- Ensuring the containerized application supports hot-reloading for efficient development
- Setting up a containerized test environment for running tests

This implementation will provide a complete local development environment with all required services.

## Tests
The following tests will verify the implementation:
1. **Automated Tests**:
   - Verify that all containers (Node.js, PostgreSQL, Redis) can successfully build and run without errors
   - Ensure the health check endpoint (`GET /health`) is accessible from the containerized application
   - Validate that the application can connect to both PostgreSQL and Redis services
2. **Manual Tests**:
   - Build and run the Docker Compose setup locally
   - Access the health check endpoint to confirm it responds correctly
   - Verify that code changes are reflected immediately with hot-reloading
   - Confirm that tests can be run within the containerized environment

## Implementation Steps
1. **Create Dockerfile for Node.js Application**:
   - Create a `Dockerfile` in the project root
   - Use a Node.js base image (node:18-alpine recommended for smaller size)
   - Configure the working directory, copy package files, and install dependencies
   - Set up the container for both production builds and development mode
   - Configure the container to use ts-node-dev for hot-reloading in development

2. **Configure Docker Compose**:
   - Create a `docker-compose.yml` file in the project root
   - Define services for:
     - Node.js application (with appropriate port mapping to 7090)
     - PostgreSQL database
     - Redis cache
   - Set up volume mounts for:
     - Application code to enable hot-reloading
     - PostgreSQL data persistence
     - Redis data persistence (if needed)
   - Configure service dependencies and startup order

3. **Environment Configuration**:
   - Create a `.env.example` file with required environment variables including:
     - Database connection strings
     - Redis connection information
     - Application port and other configs
   - Set up environment variable passing between Docker Compose and containers
   - Ensure sensitive information is not hardcoded in Docker configuration files

4. **Development Workflow Enhancement**:
   - Ensure ts-node-dev works correctly within the container for hot-reloading
   - Configure volume mounts to reflect code changes immediately
   - Set up a convenient way to run npm commands within the container
   - Create a containerized test environment that connects to the same services

5. **Service Health Checks**:
   - Implement proper health checks for all services in Docker Compose
   - Ensure the application waits for PostgreSQL and Redis to be ready before starting
   - Add connection validation to verify the app can communicate with all services

6. **Documentation**:
   - Update the README.md with Docker-specific instructions
   - Document how to:
     - Start the development environment
     - Run tests in the containerized environment
     - Access logs for each service
     - Connect to PostgreSQL and Redis for debugging
   - Include common Docker commands and troubleshooting tips

7. **Run and Verify**:
   - Build and start all services using Docker Compose
   - Verify the health check endpoint is accessible
   - Make a code change and verify hot-reloading works
   - Run tests within the containerized environment
   - Verify PostgreSQL and Redis connections work correctly
