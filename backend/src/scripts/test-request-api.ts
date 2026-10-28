import http from "http";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDB } from "../config/db";
import { User, Product, AssetRequest } from "../models";
import { generateToken } from "../utils/token";

async function runRequestApiTests() {
  await connectDB();
  const app = createApp();
  const port = 5077;
  const baseUrl = `http://localhost:${port}`;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`Request engine test server running at ${baseUrl}`);

  try {
    // Clean up test records
    await User.deleteMany({ email: { $in: ["admin_req@assetflow.com", "user_a@assetflow.com", "user_b@assetflow.com"] } });
    await Product.deleteMany({ name: "Lab Oscilloscope Digital" });

    // 1. Create Users
    const admin = await User.create({
      name: "Approval Admin",
      email: "admin_req@assetflow.com",
      password: "Password123!",
      role: "ADMIN",
    });

    const userA = await User.create({
      name: "Borrower Alice",
      email: "user_a@assetflow.com",
      password: "Password123!",
      role: "USER",
    });

    const userB = await User.create({
      name: "Borrower Bob",
      email: "user_b@assetflow.com",
      password: "Password123!",
      role: "USER",
    });

    const adminToken = generateToken({ id: admin._id.toString(), email: admin.email, role: admin.role });
    const userAToken = generateToken({ id: userA._id.toString(), email: userA.email, role: userA.role });
    const userBToken = generateToken({ id: userB._id.toString(), email: userB.email, role: userB.role });

    // 2. Create Product with totalStock: 2, availableStock: 2
    const product = await Product.create({
      name: "Lab Oscilloscope Digital",
      category: "Lab Tools",
      description: "100MHz 2-Channel Digital Oscilloscope",
      totalStock: 2,
      availableStock: 2,
    });

    const productId = product._id.toString();

    // Test 1: User A submits valid request for 1 unit
    console.log("\n--- Testing 1: User A submits request for 1 unit (Expect 201) ---");
    const req1Res = await fetch(`${baseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 1,
        purpose: "Circuits and signals laboratory experiment",
      }),
    });
    const req1Data = (await req1Res.json()) as any;
    console.log(`Status: ${req1Res.status} (Expected 201)`);
    console.log(`Request ID: ${req1Data.data?.request?._id}, Status: ${req1Data.data?.request?.status}`);
    if (req1Res.status !== 201 || req1Data.data?.request?.status !== "PENDING") {
      throw new Error("Request submission failed");
    }

    const requestAId = req1Data.data.request._id;

    // Test 2: User A tries to request more than available stock (e.g. 5 units)
    console.log("\n--- Testing 2: Request quantity exceeding available stock (Expect 400) ---");
    const overReqRes = await fetch(`${baseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 5,
        purpose: "Exceeding stock test",
      }),
    });
    const overReqData = (await overReqRes.json()) as any;
    console.log(`Status: ${overReqRes.status} (Expected 400)`);
    console.log(`Message: ${overReqData.message}`);
    if (overReqRes.status !== 400) throw new Error("Over-stock request guard failed");

    // Test 3: User B submits request for 2 units
    console.log("\n--- Testing 3: User B requests 2 units (Expect 201) ---");
    const req2Res = await fetch(`${baseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userBToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 2,
        purpose: "Robotics workshop demonstration",
      }),
    });
    const req2Data = (await req2Res.json()) as any;
    console.log(`Status: ${req2Res.status} (Expected 201)`);
    const requestBId = req2Data.data.request._id;

    // Test 4: User A checks "My Requests"
    console.log("\n--- Testing 4: User A checks My Requests (Expect 200) ---");
    const myReqsRes = await fetch(`${baseUrl}/api/requests/my`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const myReqsData = (await myReqsRes.json()) as any;
    console.log(`Status: ${myReqsRes.status}, Count: ${myReqsData.data?.requests?.length}`);
    if (myReqsData.data?.requests?.length !== 1) throw new Error("My requests query failed");

    // Test 5: User A cancels their pending request
    console.log("\n--- Testing 5: User A cancels own pending request (Expect 200) ---");
    const cancelRes = await fetch(`${baseUrl}/api/requests/${requestAId}/cancel`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const cancelData = (await cancelRes.json()) as any;
    console.log(`Status: ${cancelRes.status} (Expected 200), New Status: ${cancelData.data?.request?.status}`);
    if (cancelData.data?.request?.status !== "CANCELLED") throw new Error("Cancellation failed");

    // Test 6: Admin views Pending Queue (Expect User B's request)
    console.log("\n--- Testing 6: Admin checks Pending Queue (Expect 200) ---");
    const pendingRes = await fetch(`${baseUrl}/api/requests/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingData = (await pendingRes.json()) as any;
    console.log(`Status: ${pendingRes.status}, Pending Count: ${pendingData.data?.requests?.length}`);
    console.log(`Pending Item: ${pendingData.data?.requests[0]?.product?.name || pendingData.data?.requests[0]?.productId?.name}`);
    if (pendingData.data?.requests?.length !== 1) throw new Error("Pending queue failed");

    // Test 7: Admin approves User B's request for 2 units (Atomic stock decrement)
    console.log("\n--- Testing 7: Admin Approves User B Request (Atomic Stock Decrement) ---");
    const approveRes = await fetch(`${baseUrl}/api/requests/${requestBId}/approve`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adminRemark: "Approved for the robotics team" }),
    });
    const approveData = (await approveRes.json()) as any;
    console.log(`Status: ${approveRes.status} (Expected 200)`);
    console.log(`New Status: ${approveData.data?.request?.status}`);

    // Verify stock is now 0 in database
    const updatedProduct = await Product.findById(productId);
    console.log(`Stock in DB -> Total: ${updatedProduct?.totalStock}, Available: ${updatedProduct?.availableStock}`);
    if (updatedProduct?.availableStock !== 0) throw new Error("Atomic stock decrement failed");

    // Test 8: Zero-Stock Lockout - New request blocked because availableStock == 0
    console.log("\n--- Testing 8: Zero-Stock Lockout Guard ---");
    const zeroStockReq = await fetch(`${baseUrl}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userAToken}`,
      },
      body: JSON.stringify({
        productId,
        quantity: 1,
        purpose: "Should be blocked due to 0 stock",
      }),
    });
    const zeroStockData = (await zeroStockReq.json()) as any;
    console.log(`Zero-stock block status: ${zeroStockReq.status} (Expected 400)`);
    console.log(`Message: ${zeroStockData.message}`);
    if (zeroStockReq.status !== 400) throw new Error("Zero-stock lockout failed");

    // Test 9: Admin Rejection with Mandatory Reason
    console.log("\n--- Testing 9: Admin Rejection (Mandatory Reason Verification) ---");
    // Restock product with 1 unit and create pending request
    await Product.findByIdAndUpdate(productId, { availableStock: 1 });
    const reqToReject = await AssetRequest.create({
      userId: userA._id,
      productId: product._id,
      quantity: 1,
      purpose: "Testing rejection",
      status: "PENDING",
    });

    // Rejection without remark (Expect 400)
    const badRejectRes = await fetch(`${baseUrl}/api/requests/${reqToReject._id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adminRemark: "" }),
    });
    console.log(`Blank reason rejection status: ${badRejectRes.status} (Expected 400)`);
    if (badRejectRes.status !== 400) throw new Error("Mandatory remark validation failed");

    // Rejection with valid reason (Expect 200)
    const goodRejectRes = await fetch(`${baseUrl}/api/requests/${reqToReject._id}/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adminRemark: "Equipment reserved for annual faculty exams" }),
    });
    const goodRejectData = (await goodRejectRes.json()) as any;
    console.log(`Valid rejection status: ${goodRejectRes.status} (Expected 200)`);
    console.log(`Status: ${goodRejectData.data?.request?.status}, Reason: ${goodRejectData.data?.request?.adminRemark}`);
    if (goodRejectData.data?.request?.status !== "REJECTED") throw new Error("Rejection failed");

    // Clean up
    await AssetRequest.deleteMany({ productId });
    await Product.findByIdAndDelete(productId);
    await User.deleteMany({ email: { $in: ["admin_req@assetflow.com", "user_a@assetflow.com", "user_b@assetflow.com"] } });

    console.log("\n✓ All Phase 5 Request Engine API tests passed 100%!");
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runRequestApiTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

