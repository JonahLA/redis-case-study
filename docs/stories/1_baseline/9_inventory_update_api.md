# Feature: Inventory Update API

## Overview
This feature implements an API endpoint for updating product inventory levels after purchases, ensuring accurate stock tracking for bowling balls and preventing overselling.

## User Story
As a store manager, I want the system to automatically update product inventory after a purchase, so that stock levels remain accurate and we avoid selling products that are out of stock.

## Acceptance Criteria

### Scenario 1: Successful inventory reduction after purchase
Given a product exists with sufficient stock
When an order is completed containing that product
Then the product's inventory should be reduced by the purchased quantity
And the updated inventory count should be reflected in the database
And subsequent requests for the product details should show the updated stock

### Scenario 2: Inventory update within a transaction
Given a customer purchases multiple products in one order
When the order is processed
Then all inventory updates should happen within a single database transaction
And if any update fails, all updates should be rolled back
And an appropriate error should be returned

### Scenario 3: Inventory update with low stock notification
Given a product's stock falls below a predefined threshold after an update
When the inventory update occurs
Then the system should mark the product as "low stock"
And this status should be visible in product API responses

### Scenario 4: Manual inventory adjustment
Given a store administrator needs to adjust inventory
When they send a PATCH request to `/api/inventory/:productId` with the adjustment value
Then the product's inventory should be updated by the specified amount
And the system should record the adjustment in an audit log
And the response should contain the new inventory level

### Scenario 5: Attempted inventory reduction below zero
Given a product has limited stock
When an attempt is made to reduce inventory below zero
Then the system should reject the update
And return an appropriate error message
And maintain the current inventory level

## Technical Implementation
- Update the ProductController to add inventory management endpoints:
  - PATCH /api/inventory/:productId/adjust
- Implement an InventoryService for handling stock updates
- Enhance the existing ProductRepository with inventory-specific methods
- Implement transactional operations for multi-product inventory updates
- Add database triggers or application logic for low stock detection
- Create an audit trail for inventory changes
- Implement proper concurrency control to prevent race conditions
- Add proper validation and error handling for inventory operations

### API Contract

```json
{
  "endpoint": "/api/inventory/:productId/adjust",
  "method": "PATCH",
  "request": {
    "adjustment": "number (positive or negative)",
    "reason": "string (optional - purchase, return, correction, etc.)"
  },
  "response": {
    "productId": "number",
    "previousStock": "number",
    "currentStock": "number",
    "adjustment": "number",
    "status": "string (in_stock, low_stock, out_of_stock)",
    "timestamp": "string (ISO date)"
  }
}
```
