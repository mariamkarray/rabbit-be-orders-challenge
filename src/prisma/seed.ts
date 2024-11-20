import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productsCount = 70000;
  const ordersCount = 10000;
  const maxOrderItems = 10;

  // Step 1: Seed Products
  const products: { name: string; category: string; area: string }[] = [];

  const areas = ['Maadi', 'Zayed', 'New Cairo', 'Giza'];

  for (let i = 0; i < productsCount; i++) {
    const randomArea = areas[Math.floor(Math.random() * areas.length)];

    products.push({
      name: `Product ${i + 1}`,
      category: `Product ${i + 1} Category`,
      area: randomArea,
    });
  }

  console.log('Seeding Products...');
  await prisma.product.createMany({ data: products });

  // Step 2: Seed Orders and Order Items
  const allProducts = await prisma.product.findMany({ select: { id: true } });
  const productIds = allProducts.map((product) => product.id);

  console.log('Seeding Orders and Order Items...');
  for (let i = 0; i < ordersCount; i++) {
    const order = await prisma.order.create({
      data: {
        customerId: Math.floor(Math.random() * 1000),
      },
    });

    const orderItems = [];
    const itemsCount = Math.floor(Math.random() * maxOrderItems) + 1;

    for (let j = 0; j < itemsCount; j++) {
      const randomProductId =
        productIds[Math.floor(Math.random() * productIds.length)];
      orderItems.push({
        productId: randomProductId,
        quantity: Math.floor(Math.random() * 5) + 1,
        orderId: order.id,
      });
    }

    await prisma.orderItem.createMany({ data: orderItems });
  }
  console.log("Seeding finished")
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
