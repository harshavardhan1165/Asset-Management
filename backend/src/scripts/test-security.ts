import http from "http";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { createApp } from "../app";
import { connectDB } from "../config/db";
import { User } from "../models";
import { generateToken } from "../utils/token";

async function runSecurityTests() {
  await connectDB();
  const app = createApp();
  const port = 5099;
  const baseUrl = `http://localhost:${port}`;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`Security test server running at ${baseUrl}`);

  try {
    // Test 1: Brute-Force Rate Limiting (authLimiter)
    console.log("\n--- Testing 1: Brute-Force Rate Limiting on Login (10 max, 11th triggers 429) ---");
    let rateLimitTriggered = false;

    for (let i = 1; i <= 12; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonexistent@assetflow.com",
          password: `WrongPass${i}!`,
        }),
      });

      if (res.status === 429) {
        const data = (await res.json()) as any;
        console.log(`✓ Request ${i}: Rate limit correctly triggered with HTTP 429!`);
        console.log(`Message: ${data.message}`);
        rateLimitTriggered = true;
        break;
      }
    }

    if (!rateLimitTriggered) {
      throw new Error("Rate limiting failed to trigger 429 Too Many Requests");
    }

    // Test 2: Orphan File Cleanup on Validation Failure
    console.log("\n--- Testing 2: Orphan Upload File Cleanup on Failed Request ---");
    const admin = await User.create({
      name: "Security Admin",
      email: "sec_admin@assetflow.com",
      password: "Password123!",
      role: "ADMIN",
    });
    const adminToken = generateToken({ id: admin._id.toString(), email: admin.email, role: admin.role });

    const productsDir = path.resolve(__dirname, "../../uploads/products");
    const filesBefore = fs.readdirSync(productsDir).length;

    // Send multipart request with an image, but INVALID body (missing required category and totalStock)
    const formData = new FormData();
    const fakeBlob = new Blob(["test image buffer content"], { type: "image/png" });
    formData.append("image", fakeBlob, "test_orphan.png");
    formData.append("name", "A"); // Invalid name (too short, min is 2)

    const failUploadRes = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: formData,
    });

    console.log(`Upload failed with status: ${failUploadRes.status} (Expected 400 Validation Error)`);

    const filesAfter = fs.readdirSync(productsDir).length;
    console.log(`Files in uploads/products before: ${filesBefore}, after: ${filesAfter}`);

    if (filesAfter !== filesBefore) {
      throw new Error("Orphan file leak detected! The uploaded file was not cleaned up.");
    }
    console.log("✓ Zero orphan file leak verified: Temp file automatically purged from disk!");

    // Clean up
    await User.findByIdAndDelete(admin._id);

    console.log("\n✓ All Phase 7 Security Hardening tests passed 100%!");
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

