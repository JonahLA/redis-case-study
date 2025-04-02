# Feature: Cart Management API

## Overview
This feature implements API endpoints for managing a shopping cart, allowing users to add bowling balls to their cart, view cart contents, update quantities, and remove items.

## User Story
As an online shopper, I want to add bowling balls to my shopping cart and manage the cart contents, so that I can collect items before proceeding to checkout.

## Acceptance Criteria

### Scenario 1: Adding a product to the cart
Given a product exists in the database
When I send a POST request to `/api/cart/items` with product ID and quantity
Then I should receive a 201 status code
And the response should contain the updated cart with the new item included
And the cart total should be recalculated to reflect the new item

### Scenario 2: Viewing cart contents
Given I have items in my shopping cart
When I send a GET request to `/api/cart`
Then I should receive a 200 status code
And the response should contain all items in my cart
And each item should include product details and quantity
And the cart should include the subtotal, any applicable taxes, and total amount

### Scenario 3: Updating item quantity in cart
Given I have a product in my shopping cart
When I send a PATCH request to `/api/cart/items/:productId` with a new quantity
Then I should receive a 200 status code
And the response should contain the updated cart with the modified quantity
And the cart total should be recalculated to reflect the change

### Scenario 4: Removing an item from the cart
Given I have a product in my shopping cart
When I send a DELETE request to `/api/cart/items/:productId`
Then I should receive a 200 status code
And the response should contain the updated cart without the removed item
And the cart total should be recalculated to reflect the removal

### Scenario 5: Adding a product with insufficient stock
Given a product exists in the database with limited stock
When I send a POST request to add a quantity greater than available stock
Then I should receive a 400 status code
And the response should contain an appropriate error message
And the cart should remain unchanged

## Technical Implementation
- Create a CartController with endpoints for:
  - GET /api/cart
  - POST /api/cart/items
  - PATCH /api/cart/items/:productId
  - DELETE /api/cart/items/:productId
  - DELETE /api/cart (clear cart)
- Implement a CartService that handles business logic for cart operations
- Store cart data using user sessions or temporary storage for non-authenticated users
- Check product stock availability before adding to cart
- Calculate cart totals, including potential tax calculations
- Add validation for product existence and quantity values
- Implement proper error handling for invalid requests

### API Contract

```json
{
  "endpoint": "/api/cart/items",
  "method": "POST",
  "request": {
    "productId": "number",
    "quantity": "number"
  },
  "response": {
    "id": "string",
    "items": [
      {
        "productId": "number",
        "quantity": "number",
        "product": {
          "id": "number",
          "name": "string",
          "price": "number",
          "imageUrl": "string"
        },
        "subtotal": "number"
      }
    ],
    "subtotal": "number",
    "tax": "number",
    "total": "number",
    "itemCount": "number"
  }
}
```
