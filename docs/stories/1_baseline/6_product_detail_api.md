# Feature: Product Detail API

## Overview
This feature implements API endpoints for retrieving detailed information about a specific bowling ball product, providing comprehensive data needed for product display pages.

## User Story
As an online shopper, I want to view detailed information about a specific bowling ball, so that I can evaluate if it meets my needs before making a purchase decision.

## Acceptance Criteria

### Scenario 1: Retrieving detailed product information
Given a product exists in the database
When I send a GET request to `/api/products/:id`
Then I should receive a 200 status code
And the response should contain comprehensive product details
And the details should include the product name, description, price, stock, image URL, category, and brand information

### Scenario 2: Product not found
Given I request details for a non-existent product ID
When I send a GET request to `/api/products/:invalidId`
Then I should receive a 404 status code
And the response should contain an appropriate error message

### Scenario 3: Retrieved product includes related product suggestions
Given a product exists in the database
And there are other products in the same category
When I send a GET request to `/api/products/:id`
Then the response should include an array of suggested related products from the same category
And each suggested product should include basic information (id, name, price, image URL)

### Scenario 4: Product information includes category and brand details
Given a product exists in the database
When I send a GET request to `/api/products/:id`
Then the product details should include the full category information
And the product details should include the full brand information

## Technical Implementation
- Create a ProductController with endpoints for:
  - GET /api/products
  - GET /api/products/:id
- Implement service layer methods to retrieve complete product data
- Use the existing ProductRepository to fetch product with relations
- Implement logic to find related products in the same category
- Add proper error handling for invalid product IDs and other potential errors
- Structure the response to include all required product information
- Ensure efficient database queries that minimize N+1 query problems

### API Contract

```json
{
  "endpoint": "/api/products/:id",
  "method": "GET",
  "response": {
    "id": "number",
    "name": "string",
    "description": "string",
    "price": "number", 
    "stock": "number",
    "imageUrl": "string",
    "createdAt": "string (ISO date)",
    "updatedAt": "string (ISO date)",
    "category": {
      "id": "number",
      "name": "string",
      "description": "string"
    },
    "brand": {
      "id": "number",
      "name": "string",
      "description": "string",
      "imageUrl": "string"
    },
    "relatedProducts": [
      {
        "id": "number",
        "name": "string",
        "price": "number",
        "imageUrl": "string"
      }
    ]
  }
}
```
