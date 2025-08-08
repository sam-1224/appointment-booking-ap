import {
  authMiddleware,
  roleMiddleware,
  AuthenticatedRequest,
} from "./middleware/auth";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client"; // Import PrismaClient
import bcrypt from "bcryptjs"; // Import bcryptjs
import jwt from "jsonwebtoken"; // Import jsonwebtoken

dotenv.config();

const app = express();

const prisma = new PrismaClient(); // Create a Prisma client instance

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON requests

// 1. Register a new user
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide name, email, and password." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
      },
    });
    res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    res.status(400).json({
      error: {
        code: "USER_EXISTS",
        message: "User with this email already exists.",
      },
    });
  }
});

// 2. Login a user
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide both email and password." });
  }

  if (!JWT_SECRET) {
    return res
      .status(500)
      .json({ error: "JWT Secret not configured on the server." });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res
      .status(401)
      .json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });
  res.status(200).json({ token, role: user.role });
});


// 3. Get all available slots for the next 7 days
app.get('/api/slots', async (req, res) => {
    try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        // Find all slots that are not booked and are within the next 7 days
        const availableSlots = await prisma.slot.findMany({
            where: {
                booking: null, // The slot has no booking linked to it
                start_at: {
                    gte: new Date(), // Starting from now
                    lt: sevenDaysFromNow, // Up to 7 days from now
                },
            },
            orderBy: {
                start_at: 'asc', // Show earliest slots first
            },
        });
        res.status(200).json(availableSlots);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch slots." });
    }
});


// 4. Book an available slot (Patient role required)
app.post('/api/book', authMiddleware, roleMiddleware('patient'), async (req: AuthenticatedRequest, res) => {
    const { slotId } = req.body;
    const userId = req.user!.userId; // We know user exists because authMiddleware passed

    if (!slotId) {
        return res.status(400).json({ error: "slotId is required." });
    }

    try {
        const booking = await prisma.booking.create({
            data: {
                user_id: userId,
                slot_id: slotId,
            },
        });
        res.status(201).json(booking);
    } catch (error: any) {
        // Prisma's unique constraint violation code
        if (error.code === 'P2002') {
            [cite_start]return res.status(409).json({ error: { code: 'SLOT_TAKEN', message: 'This slot is no longer available.' } }); // [cite: 29]
        }
        res.status(500).json({ error: 'Could not book the slot.' });
    }
});


// 5. Get bookings for the currently logged-in patient (Patient role required)
app.get('/api/my-bookings', authMiddleware, roleMiddleware('patient'), async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;

    try {
        const bookings = await prisma.booking.findMany({
            where: { user_id: userId },
            include: {
                slot: true, // Include the details of the booked slot
            },
            orderBy: {
                slot: {
                    start_at: 'asc'
                }
            }
        });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch your bookings." });
    }
});


// 6. Get all bookings in the system (Admin role required)
app.get('/api/all-bookings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const allBookings = await prisma.booking.findMany({
            include: {
                user: {
                    select: { name: true, email: true } // Select specific user fields
                },
                slot: true,
            },
            orderBy: {
                slot: {
                    start_at: 'asc'
                }
            }
        });
        res.status(200).json(allBookings);
    } catch (error) {
        res.status(500).json({ error: "Could not fetch all bookings." });
    }
});

// A simple test route
app.get("/", (req, res) => {
  res.send("Appointment Booking API is running!");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
