import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // 1. Create the Admin User
  const adminPassword = process.env.ADMIN_PASSWORD || "Password!";
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@example.com",
      password_hash: hashedPassword,
      role: "admin",
    },
  });
  console.log("Admin user created/updated.");

  // 2. Generate Appointment Slots for the next 7 days
  console.log("Deleting old slots...");
  await prisma.slot.deleteMany({}); // Clear out old slots

  const slots = [];
  const today = new Date();

  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);

    // Slots from 9:00 to 16:30
    for (let hour = 9; hour < 17; hour++) {
      const startTime = new Date(date);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + 30);

      slots.push({ start_at: startTime, end_at: endTime });

      // Add the second 30-minute slot of the hour (e.g., 9:30)
      if (hour !== 16) {
        // Don't create a 17:00 slot
        const nextStartTime = new Date(endTime);
        const nextEndTime = new Date(nextStartTime);
        nextEndTime.setMinutes(nextStartTime.getMinutes() + 30);
        slots.push({ start_at: nextStartTime, end_at: nextEndTime });
      }
    }
  }

  await prisma.slot.createMany({
    data: slots,
  });
  console.log(`${slots.length} slots created.`);

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
