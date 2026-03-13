import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { router as vcRouter } from "./routes/index.js";
import morganMiddleware from "./middlewares/morganMiddleware.js";
import languageMiddleware from "./middlewares/languageMiddleware.js";
import logger from "./utils/logger.js";

const app = express();

// Middleware setup

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(morganMiddleware);
app.use(cors());
app.use(languageMiddleware);

// Routes
app.use("/api/vc", vcRouter);

// Default route
app.get("/", (req, res) => {
  logger.info("Health check route accessed.");
  res.send(
    "Welcome to the Verifiable Credentials API. Visit /api/vc for API documentation.",
  );
});

// Error handler for uncaught routes
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.originalUrl}`);
  res.status(404).send({ error: "Route not found" });
});

export default app;
