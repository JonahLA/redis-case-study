# Ticket: Backend Architecture Setup

## Description
This ticket focuses on setting up the minimal backend architecture for the project. The backend will use Node.js, Express, and TypeScript to create a foundation for the API. This setup will include:
- Initializing a Node.js project.
- Installing and configuring Express for handling HTTP requests.
- Setting up TypeScript for type safety and development efficiency.
- Creating a basic health check endpoint to verify the setup.

This ticket assumes no prior installations or configurations on the developer's machine.

## Tests
The following tests will verify the implementation:
1. **Automated Tests**:
   - A unit test to ensure the health check endpoint (`GET /health`) returns a 200 status code and a success message.
2. **Manual Tests**:
   - Start the server and access the health check endpoint in a browser or using a tool like Postman to confirm it responds correctly.

## Implementation Steps
1. **Initialize the Project**:
   - Install Node.js if not already installed.
   - Run `npm init -y` to create a `package.json` file.
   - Install TypeScript (`npm install typescript --save-dev`) and initialize a `tsconfig.json` file using `npx tsc --init`.

2. **Install Dependencies**:
   - Install Express (`npm install express`) and its TypeScript types (`npm install @types/express --save-dev`).
   - Install a TypeScript compiler and a development server like `ts-node-dev` (`npm install ts-node-dev --save-dev`).

3. **Set Up Basic Project Structure**:
   - Create a `src` directory for source files.
   - Create an `index.ts` file in the `src` directory to serve as the entry point.

4. **Write Tests**:
   - Install Jest and Supertest for testing (`npm install jest supertest @types/jest @types/supertest --save-dev`).
   - Write a test in a `tests` directory to verify the health check endpoint (`GET /health`) returns a 200 status code and a success message.

5. **Implement the Health Check Endpoint**:
   - Set up an Express server in `index.ts`.
   - Add a `GET /health` endpoint that returns a JSON response with a success message.

6. **Run and Verify**:
   - Start the server using `ts-node-dev` and verify the health check endpoint manually.
   - Run the Jest tests to ensure the endpoint behaves as expected.
