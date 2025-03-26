# E-Commerce Platform with Redis Caching

## Project Overview

This project aims to gain experience with different caching patterns and their implementation using Redis. The primary focus is on implementing and evaluating the following caching strategies:

1. **Write-behind caching**: To handle high-volume write operations during peak periods (e.g., Black Friday scenarios)
2. **Cache prefetching**: To improve user experience by preloading related product data for faster navigation
3. **Write-through caching** (stretch goal): To ensure data consistency between the cache and the database

The project will involve building a basic e-commerce website for buying bowling balls. It will include the following pages:
- A main landing page
- Three category pages (one for each brand of bowling balls)
- A product details page
- A cart page for adding items
- A simplified checkout page to confirm purchases

To test the caching patterns, the project will include:
- A **baseline implementation** without caching
- An **optimized implementation** utilizing Redis for caching

This approach will allow for direct performance comparison to demonstrate the benefits of caching strategies.

## Business Requirements

### Core Functionality
- Browse products by category
- View detailed product information
- Add products to cart
- Simulate checkout process
- Update product inventory upon purchase

### Non-Functional Requirements
- Support for at least 2,000 concurrent write operations
- Responsive user interface with minimal loading times
- Clear visualization of performance differences between cached and non-cached versions

## Technical Specifications

### Technology Stack

#### Frontend
- **Framework**: React (optional, depending on time constraints)
- **Language**: TypeScript
- **State Management**: React Context or Redux (to be determined)
- **Styling**: CSS/SCSS or a component library like Material-UI

#### Backend
- **Runtime**: Node.js
- **Language**: TypeScript
- **API Framework**: Express.js
- **Data Validation**: Joi or Zod

#### Database
- **Primary Database**: PostgreSQL
- **Caching Layer**: Redis
- **ORM/Query Builder**: Prisma or TypeORM

#### Infrastructure
- **Containerization**: Docker
- **Docker Compose**: For local development and testing

#### Testing
- **Load Testing**: Postman (collections) or k6
- **Unit Testing**: Jest
- **API Testing**: Supertest

### Data Models

#### Product
```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  imageUrl: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Project Timeline

### Week 1 (March 24-30)
- Build out the architecture and baseline implementation in the backend
- Stretch goal: Build a basic React app with pages to display the e-commerce app

### Week 2 (March 31-April 6)
- Implement write-behind caching to handle high-volume write operations (e.g., Black Friday scenarios)
- Conduct load testing to validate performance improvements

### Week 3 (April 7-13)
- Implement cache prefetching to improve page navigation performance
- Develop a testing plan for evaluating cache prefetching effectiveness
- Stretch goal: Implement write-through caching for data consistency
