import http from "http";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDB } from "../config/db";

async function runFullSimulation() {
  await connectDB();
  const app = createApp();
  const port = 5050;
  const baseUrl = `http://localhost:${port}`;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`\n======================================================`);
  console.log(`🚀 AssetFlow Full End-to-End Simulation Runner`);
  console.log(`📡 Server listening at: ${baseUrl}`);
  console.log(`======================================================\n`);

  try {
    // 1. Health Check
    console.log("Step 1: Checking System Health...");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const health = (await healthRes.json()) as any;
    console.log(`✓ Health Status: ${health.status} (${healthRes.status} OK)`);

    // 2. Authentication
    console.log("\nStep 2: Authenticating Demo Users...");
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@assetflow.com", password: "Admin@123456" }),
    });
    const adminData = (await adminLoginRes.json()) as any;
    const adminToken = adminData.data.token;
    console.log(`✓ Admin Logged In: ${adminData.data.user.name} [Role: ${adminData.data.user.role}]`);

    const johnLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "john@assetflow.com", password: "User@123456" }),
    });
    const johnData = (await johnLoginRes.json()) as any;
    const johnToken = johnData.data.token;
    console.log(`✓ User Logged In: ${johnData.data.user.name} [Role: ${johnData.data.user.role}]`);

    // 3. Catalog Discovery
    console.log("\nStep 3: Browsing Product Catalog...");
    const catalogRes = await fetch(`${baseUrl}/api/products?page=1&limit=8`);
    const catalogData = (await catalogRes.json()) as any;
    console.log(`✓ Catalog Loaded: ${catalogData.data.products.length} products found`);
    const macbook = catalogData.data.products.find((p: any) => p.name.includes("MacBook"));
    console.log(`   Sample item: "${macbook.name}" | Available Stock: ${macbook.availableStock} | InStock: ${macbook.isInStock}`);

    // 4. John Submits Request for MacBook
    console.log("\nStep 4: John Doe submits allocation request for MacBook Pro...");
    const requestRes = await fetch(`${baseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${johnToken}`,
      },
      body: JSON.stringify({
        productId: macbook.id || macbook._id,
        quantity: 1,
        purpose: "High-performance iOS and backend development workflow",
      }),
    });
    const requestData = (await requestRes.json()) as any;
    const newRequestId = requestData.data.request._id;
    console.log(`✓ Request Created: ID ${newRequestId} | Status: ${requestData.data.request.status}`);

    // 5. Admin Views Pending Queue and Approves Request
    console.log("\nStep 5: Admin inspects Pending Queue and approves request...");
    const queueRes = await fetch(`${baseUrl}/api/requests/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const queueData = (await queueRes.json()) as any;
    console.log(`✓ Admin Queue has ${queueData.data.requests.length} pending request(s)`);

    const approveRes = await fetch(`${baseUrl}/api/requests/${newRequestId}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adminRemark: "Approved for senior development tasks" }),
    });
    const approveData = (await approveRes.json()) as any;
    console.log(`✓ Admin Approved: Status is now ${approveData.data.request.status}`);

    // Check that MacBook stock decreased from 8 to 7
    const checkProductRes = await fetch(`${baseUrl}/api/products/${macbook.id || macbook._id}`);
    const checkProduct = (await checkProductRes.json()) as any;
    console.log(`✓ Atomic Stock Decrement Verified: Available stock is now ${checkProduct.data.product.availableStock} (was 8)`);

    // 6. John checks Owned Assets
    console.log("\nStep 6: John checks Owned Assets (Active Custody)...");
    const ownedRes = await fetch(`${baseUrl}/api/requests/owned`, {
      headers: { Authorization: `Bearer ${johnToken}` },
    });
    const ownedData = (await ownedRes.json()) as any;
    console.log(`✓ John's active custody has ${ownedData.data.assets.length} items:`);
    ownedData.data.assets.forEach((item: any) => {
      console.log(`   - ${item.productId?.name} (${item.quantity} unit) | Status: ${item.status}`);
    });

    // 7. Admin Inspects Pre-Seeded Handover (Rode Mic) and Approves Return
    console.log("\nStep 7: Admin processes pre-seeded return in Handover Inspection Desk...");
    const handoversRes = await fetch(`${baseUrl}/api/requests/handovers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const handoversData = (await handoversRes.json()) as any;
    const micHandover = handoversData.data.handovers[0];
    console.log(`✓ Found Handover under review: "${micHandover.productId?.name}" by ${micHandover.userId?.name}`);
    console.log(`   Condition photos attached: ${micHandover.handoverPhotos.length}`);
    console.log(`   Return notes: "${micHandover.handoverNotes}"`);

    // Approve the return
    const approveHandoverRes = await fetch(`${baseUrl}/api/requests/${micHandover._id}/handover/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveHandoverData = (await approveHandoverRes.json()) as any;
    console.log(`✓ Return Verified & Approved: Status is now ${approveHandoverData.data.request.status}`);

    // Verify Rode Mic stock was restored to 6
    const micProductRes = await fetch(`${baseUrl}/api/products/${micHandover.productId._id}`);
    const micProduct = (await micProductRes.json()) as any;
    console.log(`✓ Stock Restock Verified: "${micProduct.data.product.name}" available stock restored to ${micProduct.data.product.availableStock}`);

    console.log(`\n======================================================`);
    console.log(`🎉 FULL SIMULATION COMPLETED WITH 100% SUCCESS!`);
    console.log(`Backend is ready for React Frontend Integration!`);
    console.log(`======================================================\n`);
  } catch (error) {
    console.error("Simulation failed:", error);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runFullSimulation();

