import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { connectDB } from "./db";
import { identify } from "./identifyService";

const app = express();
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Bitespeed Identity Service is running 🚀" });
});

// Browser friendly GET for /identify
app.get("/identify", (_req: Request, res: Response) => {
  res.status(200).json({
    service: "Bitespeed Identity Reconciliation API",
    endpoint: "POST /identify",
    method: "POST",
    description: "Send a POST request to this endpoint to identify and link customer contacts.",
    example_request: {
      email: "lorraine@hillvalley.edu",
      phoneNumber: "123456"
    },
    example_response: {
      contact: {
        primaryContatctId: "<id>",
        emails: ["lorraine@hillvalley.edu"],
        phoneNumbers: ["123456"],
        secondaryContactIds: []
      }
    }
  });
});

// Identify endpoint
app.post("/identify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, phoneNumber } = req.body;

    if (email === undefined && phoneNumber === undefined) {
      res.status(400).json({ error: "Provide at least email or phoneNumber" });
      return;
    }

    const result = await identify({ email, phoneNumber });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`   POST http://localhost:${PORT}/identify`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});