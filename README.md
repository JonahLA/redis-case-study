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

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the application

To start the development server:
```bash
npm run dev
```

This will start the server on port 7090. You can access the health check endpoint at:
```
http://localhost:7090/health
```

### Testing

To run tests:
```bash
npm test
```

### Building for production

To build the application:
```bash
npm run build
```

To start the production server:
```bash
npm start
```
