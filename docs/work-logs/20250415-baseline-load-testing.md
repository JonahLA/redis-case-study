# Baseline Load Testing Implementation

## Date
April 15, 2025

## Overview
Today I began implementing baseline load testing for our e-commerce API endpoints. This implementation aims to establish performance metrics before Redis caching implementation, focusing on both read and write operations under high load conditions.

## Decisions Made

### 1. Load Testing Tool Selection
- **Decision**: Used k6 for load testing due to its JavaScript support and robust features
- **Rationale**: k6 provides excellent TypeScript support and detailed metrics collection
- **Implementation Details**:
  - Installed k6 via winget package manager
  - Created dedicated load testing directory structure
  - Implemented test configuration and cleanup scripts

### 2. Test Data Strategy
- **Decision**: Implemented product detail tests using dynamic product IDs
- **Rationale**: Testing with random product IDs ensures even distribution of requests
- **Implementation Details**:
  - Created product IDs range from 1-100
  - Added proper validation for response data structure
  - Implemented error handling for non-existent products

### 3. Load Test Configuration
- **Decision**: Configured multi-stage load tests to simulate realistic traffic patterns
- **Rationale**: Gradual ramp-up helps identify performance degradation points
- **Implementation Details**:
  - 30s ramp-up to 100 users
  - 1m sustained load at 2,000 users
  - 30s ramp-down to 0 users

### 4. Performance Thresholds
- **Decision**: Set specific performance thresholds for monitoring
- **Rationale**: Clear metrics help quantify Redis caching benefits later
- **Implementation Details**:
  - Response time: p95 < 1000ms
  - Error rate: < 1%
  - Added HTTP response validation

## Initial Findings

### 1. Test Infrastructure Issues
- **Issue**: High failure rate (100%) in initial product detail test run
- **Root Cause**: Test failures due to:
  1. Connection errors suggesting potential server capacity issues
  2. TypeError when accessing product.id from undefined responses
  3. Missing product data in database

### 2. Checkout Load Test Results (Updated)
- **Test Configuration**:
  - 2,000 concurrent users
  - 2-minute test duration
  - Two-step process: Add to cart + Checkout
- **Performance Metrics**:
  - Average response time: 3.8s
  - 95th percentile: 7.19s (target: <2s)
  - Median response time: 3.54s
  - Maximum response time: 37.31s
  - Request throughput: ~229 requests/second
  - Total iterations completed: 7,152
  - Error rate: 99.99% (target: <1%)
- **Key Issues**:
  1. System unable to handle concurrent load
  2. Response times significantly above thresholds
  3. Nearly all requests resulting in errors
  4. Substantial performance degradation under load

### 3. Performance Analysis
- **Critical Bottlenecks**:
  1. Database connection pool likely exhausted
  2. High server resource utilization
  3. Possible network saturation
  4. Transaction processing delays
- **Resource Utilization**:
  - Network throughput: 204 KB/s received, 58 KB/s sent
  - Successfully ramped to 2,000 VUs
  - System overwhelmed at peak load

### 4. Performance Metrics
- **Current State**:
  - 95th percentile response time: 37.56s (far above target of 1s)
  - Error rate: 100% (above target of < 1%)
  - Average response time: 9.61s
  - Request rate: ~91.58 requests/second

### 5. Database State
- **Finding**: Database appears to be empty or not properly seeded
- **Impact**: Causing "Cannot read property 'id' of undefined" errors
- **Next Step**: Need to run Prisma seed script to populate test data

### 6. Product Detail Load Test Results
- **Test Configuration**:
  - 2,000 concurrent users
  - 2-minute test duration
  - Single endpoint test: GET /api/products/{id}
- **Performance Metrics**:
  - Average response time: 9.59s
  - 95th percentile: 22.23s (target: <2s)
  - Median response time: 9.47s
  - Maximum response time: 30.17s
  - Request throughput: ~84.43 requests/second
  - Total iterations completed: 10,196
  - Error rate: 94.17% (target: <1%)
- **Key Issues**:
  1. System severely degraded under concurrent load
  2. Response times extremely high (22.23s at p95)
  3. High error rate (94.17%)
  4. Connection failures predominant
- **Resource Utilization**:
  - Network throughput: 46 KB/s received, 9 KB/s sent
  - Successfully scaled to 2,000 VUs
  - System overwhelmed during peak load

### 7. Comparative Analysis
- **Product Detail vs Checkout Performance**:
  1. Higher completion rate in product detail test (10,196 vs 7,152 iterations)
  2. Similar error patterns indicating systemic issues
  3. Product detail showing worse response times (22.23s vs 7.19s at p95)
  4. Both endpoints failing to meet performance targets
- **Common Patterns**:
  1. Connection failures dominant in both tests
  2. System unable to handle target load
  3. Response times degrading significantly under load
  4. Resource exhaustion evident in both scenarios

## Next Steps

1. Implement Redis caching layer to address performance issues
2. Focus on optimizing:
   - Database connection pooling
   - Request queue management 
   - Transaction processing
3. Add monitoring for:
   - Database connection pool stats
   - Server resource utilization
   - Network performance metrics
4. Re-run load tests with Redis implementation
5. Compare metrics to establish caching benefits

## References
- [Load Testing Story Ticket](../stories/1_baseline/11_baseline-load-testing.md)
- [k6 Documentation](https://k6.io/docs/)
- [Product Service Implementation](../../src/services/productService.ts)