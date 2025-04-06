# Cart Management API Implementation

## Date
April 5, 2025

## Overview
Today I implemented the Cart Management API, which allows users to add products to their cart, view cart contents, update quantities, and remove items. This implementation follows the baseline approach without Redis caching to establish performance metrics for later comparison.

## Decisions Made

### 1. In-Memory Storage Approach
- **Decision**: Used a static Map in the CartService class for storing cart data in memory.
- **Rationale**: This provides a simple baseline implementation that we can later compare with Redis-based storage.
- **Implications**: Cart data will be lost when the server restarts, but this is acceptable for our baseline testing.

### 2. Cart Data Structure
- **Decision**: Created interfaces for Cart and CartItem that include product details, quantities, and price calculations.
- **Rationale**: This structure ensures all necessary information is available for front-end display without additional requests.
- **Implications**: More data is stored per cart, but provides a complete view of cart state.

### 3. Stock Validation
- **Decision**: Added validation to check product stock availability before adding or updating cart items.
- **Rationale**: This prevents users from adding more items than are available in inventory.
- **Implications**: Requires additional database queries to check stock levels.

### 4. Price Calculation Logic
- **Decision**: Implemented price calculations for subtotals, tax, and total within the cart service.
- **Rationale**: Centralizing these calculations ensures consistency across the application.
- **Implications**: Any tax rate changes will only need to be updated in one place.

### 5. Decimal to Number Conversion
- **Decision**: Added a helper method to convert Prisma Decimal types to JavaScript numbers.
- **Rationale**: This resolves type compatibility issues between Prisma's Decimal type and JavaScript's number type.
- **Implications**: Ensures consistent number handling across the application.

## API Endpoints Implemented

1. `GET /api/cart` - View cart contents
2. `POST /api/cart/items` - Add a product to the cart
3. `PATCH /api/cart/items/:productId` - Update item quantity in the cart
4. `DELETE /api/cart/items/:productId` - Remove an item from the cart
5. `DELETE /api/cart` - Clear the entire cart

## Next Steps

1. Collect performance metrics for the baseline implementation
2. Implement Redis-based caching for cart data
3. Compare performance between baseline and Redis implementations
4. Document findings and recommendations

## References
- [Cart Management API Ticket](../stories/1_baseline/7_cart_management_api.md)
- [CategoryService Implementation](../../src/services/categoryService.ts)
