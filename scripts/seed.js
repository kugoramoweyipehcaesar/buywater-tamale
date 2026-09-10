/**
 * Safe seed for local + Render (upsert only — does not wipe orders)
 * Super admin: kugoramoweyipehcaesar49@gmail.com / Dominion4244
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding BuyWater...");

  const adminEmail = "kugoramoweyipehcaesar49@gmail.com";
  const adminPassword = await bcrypt.hash("Dominion4244", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
      role: "ADMIN",
      name: "BuyWater Admin",
      username: "admin",
      phone: "0531448824",
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      role: "ADMIN",
      name: "BuyWater Admin",
      username: "admin",
      phone: "0531448824",
    },
  });
  console.log("Admin ready:", adminEmail);

  if ((await prisma.product.count()) === 0) {
    await prisma.product.create({
      data: {
        name: "20L Water Gallon",
        price: 2.5,
        description:
          "Hygienically produced water gallons delivered to your hostel door.",
        image: "/product.jpg",
        category: "water",
        stock: 500,
      },
    });
  }

  const hostels = [
    "Yaa Naa Hall",
    "Sagnarigu Hall",
    "Kumbungu Hostel",
    "Tech Hostel",
    "Citadel Hostel",
    "Northern Hostel",
  ];
  for (const name of hostels) {
    await prisma.hostel.upsert({
      where: { name },
      update: { active: true },
      create: { name, active: true },
    });
  }

  if ((await prisma.appSettings.count()) === 0) {
    await prisma.appSettings.create({
      data: {
        serviceActive: true,
        maintenanceMode: false,
        heroTitle: "Fresh Water Delivered",
        operatingHours: "7 AM - 8:30 PM DAILY",
        productImageUrl: "/product.jpg",
        productDescription: "Premium 20L sealed water gallons",
        deliveryTimeMin: 45,
        deliveryTimeMax: 60,
        pricePerGallon: 2.5,
        subscriptionPrice: 22,
        subscriptionGallons: 10,
        gallonSize: 20,
        cashEnabled: true,
        momoEnabled: true,
        momoNumber: "0502748671",
        momoName: "CAESAR WEYIPEH KUGORAMO",
        adminPhone: "0531448824",
        adminEmail: adminEmail,
        serviceArea: "Tamale UDS and environs",
      },
    });
    console.log("Default settings created");
  } else {
    console.log("Settings already exist — left unchanged");
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
