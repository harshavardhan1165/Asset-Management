import http from "http";
import mongoose from "mongoose";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";

const bootstrap = async (): Promise<void> => {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.connection.close(false);
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  process.on("unhandledRejection", (reason: unknown) => {
    console.error("Unhandled rejection:", reason);
  });

  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught exception:", error);
    process.exit(1);
  });
};

bootstrap();
