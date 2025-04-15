import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  // Clean the database
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.inventoryAudit.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});

  console.log('Seeding database...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Professional',
        description: 'Professional grade bowling balls for competitive play',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Intermediate',
        description: 'Mid-range bowling balls for regular players',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Beginner',
        description: 'Entry-level bowling balls for casual players and beginners',
      },
    }),
  ]);

  // Create brands
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: 'StrikeMaster',
        description: 'Premium bowling equipment for professionals',
        imageUrl: 'https://example.com/brands/strikemaster.jpg',
      },
    }),
    prisma.brand.create({
      data: {
        name: 'ThunderRoll',
        description: 'Innovative bowling technology for all skill levels',
        imageUrl: 'https://example.com/brands/thunderroll.jpg',
      },
    }),
    prisma.brand.create({
      data: {
        name: 'PinCrusher',
        description: 'Reliable and affordable bowling gear',
        imageUrl: 'https://example.com/brands/pincrusher.jpg',
      },
    }),
  ]);

  // Create products
  const products = await Promise.all([
    // Professional products
    prisma.product.create({
      data: {
        name: 'StrikeMaster Pro X1',
        description: 'Tournament-grade reactive bowling ball with precision core',
        price: 249.99,
        stock: 20,
        imageUrl: 'https://example.com/products/pro-x1.jpg',
        categoryId: categories[0].id,
        brandId: brands[0].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'ThunderRoll Cyclone',
        description: 'High-performance asymmetric core with strong backend reaction',
        price: 229.99,
        stock: 4, // Low stock threshold example
        imageUrl: 'https://example.com/products/cyclone.jpg',
        categoryId: categories[0].id,
        brandId: brands[1].id,
      },
    }),
    
    // Intermediate products
    prisma.product.create({
      data: {
        name: 'PinCrusher Velocity',
        description: 'Mid-range bowling ball with balanced performance',
        price: 149.99,
        stock: 0, // Out of stock example
        imageUrl: 'https://example.com/products/velocity.jpg',
        categoryId: categories[1].id,
        brandId: brands[2].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'StrikeMaster Advance',
        description: 'All-purpose bowling ball for various lane conditions',
        price: 179.99,
        stock: 25,
        imageUrl: 'https://example.com/products/advance.jpg',
        categoryId: categories[1].id,
        brandId: brands[0].id,
      },
    }),
    
    // Beginner products
    prisma.product.create({
      data: {
        name: 'ThunderRoll Rookie',
        description: 'Entry-level bowling ball with forgiving performance',
        price: 89.99,
        stock: 40,
        imageUrl: 'https://example.com/products/rookie.jpg',
        categoryId: categories[2].id,
        brandId: brands[1].id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'PinCrusher Starter',
        description: 'Affordable bowling ball for beginners',
        price: 69.99,
        stock: 50,
        imageUrl: 'https://example.com/products/starter.jpg',
        categoryId: categories[2].id,
        brandId: brands[2].id,
      },
    }),
  ]);

  // Create sample orders
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        id: uuidv4(),
        userId: 'user123',
        status: 'completed',
        subtotal: 479.98,
        tax: 38.40,
        shipping: 15.00,
        total: 533.38,
        shippingName: 'John Doe',
        shippingStreet: '123 Main St',
        shippingCity: 'Springfield',
        shippingState: 'IL',
        shippingZip: '62701',
        shippingCountry: 'USA',
        items: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              quantity: 1,
              unitPrice: 249.99,
              subtotal: 249.99,
            },
            {
              productId: products[1].id,
              productName: products[1].name,
              quantity: 1,
              unitPrice: 229.99,
              subtotal: 229.99,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        id: uuidv4(),
        userId: 'user456',
        status: 'pending',
        subtotal: 269.98,
        tax: 21.60,
        shipping: 15.00,
        total: 306.58,
        shippingName: 'Jane Smith',
        shippingStreet: '456 Oak Ave',
        shippingCity: 'Chicago',
        shippingState: 'IL',
        shippingZip: '60601',
        shippingCountry: 'USA',
        items: {
          create: [
            {
              productId: products[3].id,
              productName: products[3].name,
              quantity: 1,
              unitPrice: 179.99,
              subtotal: 179.99,
            },
            {
              productId: products[4].id,
              productName: products[4].name,
              quantity: 1,
              unitPrice: 89.99,
              subtotal: 89.99,
            },
          ],
        },
      },
    }),
  ]);

  // Create inventory audit entries for initial stock levels
  const auditEntries = await Promise.all(
    products.map((product) =>
      prisma.inventoryAudit.create({
        data: {
          productId: product.id,
          previousStock: 0,
          newStock: product.stock,
          adjustment: product.stock,
          reason: 'Initial inventory setup',
        },
      })
    )
  );

  console.log(`Database seeded with:`);
  console.log(`- ${categories.length} categories`);
  console.log(`- ${brands.length} brands`);
  console.log(`- ${products.length} products`);
  console.log(`- ${orders.length} sample orders`);
  console.log(`- ${auditEntries.length} inventory audit entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
