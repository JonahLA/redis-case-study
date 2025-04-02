# Feature: Product Category API

## Overview
This feature implements API endpoints for browsing products by category, allowing users to view all products within a specific category or brand of bowling balls.

## User Story
As an online shopper, I want to browse products by category, so that I can quickly find bowling balls that match my interest and skill level.

## Acceptance Criteria

### Scenario 1: Retrieving all products in a specific category
Given the application has multiple product categories
When I send a GET request to `/api/categories/:categoryId/products`
Then I should receive a 200 status code
And the response should contain an array of products belonging to the specified category
And each product should include basic details (id, name, price, image URL, stock status)

### Scenario 2: Retrieving all categories
Given the application has product categories
When I send a GET request to `/api/categories`
Then I should receive a 200 status code
And the response should contain an array of all available categories
And each category should include its id, name, and description

### Scenario 3: Retrieving products by brand
Given the application has products from different brands
When I send a GET request to `/api/brands/:brandId/products`
Then I should receive a 200 status code
And the response should contain an array of products belonging to the specified brand
And each product should include basic details

### Scenario 4: Category not found
Given I request products for a non-existent category ID
When I send a GET request to `/api/categories/:invalidId/products`
Then I should receive a 404 status code
And the response should contain an appropriate error message

## Technical Implementation
- Create a CategoryController with endpoints for:
  - GET /api/categories
  - GET /api/categories/:categoryId
  - GET /api/categories/:categoryId/products
- Create a BrandController with endpoints for:
  - GET /api/brands
  - GET /api/brands/:brandId
  - GET /api/brands/:brandId/products
- Implement service layer methods to retrieve data from repositories
- Implement proper error handling for invalid IDs and other potential errors
- Add appropriate response pagination for large product collections
- Include filtering capabilities (optional query parameters for sorting, limiting results)

### API Contract

```json
{
  "endpoint": "/api/categories/:categoryId/products",
  "method": "GET",
  "query_parameters": {
    "sort": "(optional) Field to sort by (name, price)",
    "order": "(optional) Sort order (asc, desc)",
    "limit": "(optional) Number of products to return",
    "offset": "(optional) Number of products to skip"
  },
  "response": {
    "products": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "price": "number",
        "imageUrl": "string",
        "stock": "number",
        "categoryId": "number",
        "brandId": "number"
      }
    ],
    "pagination": {
      "total": "number",
      "limit": "number",
      "offset": "number",
      "hasMore": "boolean"
    }
  }
}
```
