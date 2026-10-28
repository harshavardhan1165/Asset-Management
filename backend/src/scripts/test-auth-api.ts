import http from "http";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDB } from "../config/db";
import { User } from "../models";

async function runAuthApiTests() {
  await connectDB();
  const app = createApp();
  const port = 5055;
  const baseUrl = `http://localhost:${port}`;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`Test server running at ${baseUrl}`);

  try {
    // Clean up any previous test user
    await User.deleteMany({ email: "postman_tester@assetflow.com" });

    // Test 1: Register New User
    console.log("\n--- Testing 1: Register New User ---");
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Postman Tester",
        email: "postman_tester@assetflow.com",
        password: "TesterPassword123!",
      }),
    });
    const regData = (await regRes.json()) as any;
    console.log(`Status: ${regRes.status}`);
    console.log(`Success: ${regData.success}, Token Received: ${Boolean(regData.data?.token)}`);
    if (regRes.status !== 201 || !regData.data?.token) {
      throw new Error("Register test failed");
    }

    const savedToken = regData.data.token;

    // Test 2: Duplicate Registration (Expect 409)
    console.log("\n--- Testing 2: Duplicate Email Registration ---");
    const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: "postman_tester@assetflow.com",
        password: "TesterPassword123!",
      }),
    });
    const dupData = (await dupRes.json()) as any;
    console.log(`Status: ${dupRes.status} (Expected 409)`);
    console.log(`Message: ${dupData.message}`);
    if (dupRes.status !== 409) {
      throw new Error("Duplicate registration test failed");
    }

    // Test 3: Login User (Expect 200)
    console.log("\n--- Testing 3: Login With Valid Credentials ---");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "postman_tester@assetflow.com",
        password: "TesterPassword123!",
      }),
    });
    const loginData = (await loginRes.json()) as any;
    console.log(`Status: ${loginRes.status} (Expected 200)`);
    console.log(`User Name: ${loginData.data?.user?.name}`);
    if (loginRes.status !== 200) {
      throw new Error("Login test failed");
    }

    // Test 4: Login With Wrong Password (Expect 401)
    console.log("\n--- Testing 4: Login With Wrong Password ---");
    const wrongLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "postman_tester@assetflow.com",
        password: "WrongPassword999!",
      }),
    });
    const wrongData = (await wrongLoginRes.json()) as any;
    console.log(`Status: ${wrongLoginRes.status} (Expected 401)`);
    console.log(`Message: ${wrongData.message}`);
    if (wrongLoginRes.status !== 401) {
      throw new Error("Wrong password test failed");
    }

    // Test 5: Protected Route GET /api/auth/me with Bearer Token (Expect 200)
    console.log("\n--- Testing 5: Protected GET /api/auth/me with Token ---");
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    });
    const meData = (await meRes.json()) as any;
    console.log(`Status: ${meRes.status} (Expected 200)`);
    console.log(`Authenticated User: ${meData.data?.user?.email} [Role: ${meData.data?.user?.role}]`);
    if (meRes.status !== 200 || meData.data?.user?.email !== "postman_tester@assetflow.com") {
      throw new Error("Protected route test failed");
    }

    // Test 6: Protected Route Without Token (Expect 401)
    console.log("\n--- Testing 6: Protected GET /api/auth/me without Token ---");
    const noTokenRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: "GET",
    });
    const noTokenData = (await noTokenRes.json()) as any;
    console.log(`Status: ${noTokenRes.status} (Expected 401)`);
    console.log(`Message: ${noTokenData.message}`);
    if (noTokenRes.status !== 401) {
      throw new Error("Unauthorized test failed");
    }

    // Clean up
    await User.deleteMany({ email: "postman_tester@assetflow.com" });
    console.log("\n✓ All Auth API tests passed with flying colors!");
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runAuthApiTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

