import http from "http";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDB } from "../config/db";
import { User, Product, AssetRequest } from "../models";
import { generateToken } from "../utils/token";
import { RequestStatus } from "../constants/requestState";

async function runHandoverApiTests() {
  await connectDB();
  const app = createApp();
  const port = 5088;
  const baseUrl = `http://localhost:${port}`;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`Handover test server running at ${baseUrl}`);

  try {
    // Clean up previous test users and products
    await User.deleteMany({ email: { $in: ["admin_handover@assetflow.com", "user_handover@assetflow.com"] } });
    await Product.deleteMany({ name: "Sony Alpha A7 IV Camera" });

    // 1. Setup Admin and User
    const admin = await User.create({
      name: "Inspection Admin",
      email: "admin_handover@assetflow.com",
      password: "Password123!",
      role: "ADMIN",
    });

    const user = await User.create({
      name: "Borrower Dave",
      email: "user_handover@assetflow.com",
      password: "Password123!",
      role: "USER",
    });

    const adminToken = generateToken({ id: admin._id.toString(), email: admin.email, role: admin.role });
    const userToken = generateToken({ id: user._id.toString(), email: user.email, role: user.role });

    // 2. Setup Product
    const product = await Product.create({
      name: "Sony Alpha A7 IV Camera",
      category: "Cameras",
      description: "Full-frame mirrorless camera for documentary production",
      totalStock: 3,
      availableStock: 3,
    });

    const productId = product._id.toString();

    // 3. User borrows 2 units and admin approves it
    const request = await AssetRequest.create({
      userId: user._id,
      productId: product._id,
      quantity: 2,
      purpose: "Campus documentary shoot",
      status: RequestStatus.APPROVED,
      approvedAt: new Date(),
    });

    // Reduce product stock to 1 (3 total - 2 borrowed = 1)
    await Product.findByIdAndUpdate(productId, { availableStock: 1 });

    const requestId = request._id.toString();

    // Test 1: User checks Owned Assets (Expect 1 item in custody)
    console.log("\n--- Testing 1: User views Owned Assets (Expect 1 active asset) ---");
    const ownedRes = await fetch(`${baseUrl}/api/requests/owned`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const ownedData = (await ownedRes.json()) as any;
    console.log(`Status: ${ownedRes.status} (Expected 200)`);
    console.log(`Owned items count: ${ownedData.data?.assets?.length}`);
    console.log(`Asset Name: ${ownedData.data?.assets[0]?.productId?.name}, Status: ${ownedData.data?.assets[0]?.status}`);
    if (ownedData.data?.assets?.length !== 1 || ownedData.data?.assets[0]?.status !== "APPROVED") {
      throw new Error("Owned assets check failed");
    }

    // Test 2: User initiates handover without photos (Expect 400 Bad Request)
    console.log("\n--- Testing 2: Handover without photos (Expect 400) ---");
    const noPhotoRes = await fetch(`${baseUrl}/api/requests/${requestId}/handover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const noPhotoData = (await noPhotoRes.json()) as any;
    console.log(`Status: ${noPhotoRes.status} (Expected 400)`);
    console.log(`Message: ${noPhotoData.message}`);
    if (noPhotoRes.status !== 400) throw new Error("No-photo guard failed");

    // Test 3: User initiates handover with condition photos (Simulated via FormData)
    console.log("\n--- Testing 3: User submits photo handover with notes ---");
    const formData = new FormData();
    const fakePhotoBlob = new Blob(["fake photo binary content"], { type: "image/jpeg" });
    formData.append("photos", fakePhotoBlob, "camera_screen.jpg");
    formData.append("photos", fakePhotoBlob, "camera_body.jpg");
    formData.append("handoverNotes", "Returned to Media Center shelf 2 with charger and neck strap.");

    const handoverRes = await fetch(`${baseUrl}/api/requests/${requestId}/handover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData,
    });
    const handoverData = (await handoverRes.json()) as any;
    console.log(`Status: ${handoverRes.status} (Expected 200)`);
    console.log(`New Status: ${handoverData.data?.request?.status}`);
    console.log(`Uploaded Photos count: ${handoverData.data?.request?.handoverPhotos?.length}`);

    // Verify stock is STILL 1 (Stock must NOT be restored yet!)
    const midProduct = await Product.findById(productId);
    console.log(`Available stock during review: ${midProduct?.availableStock} (Expected 1)`);
    if (handoverData.data?.request?.status !== "RETURN_PENDING" || midProduct?.availableStock !== 1) {
      throw new Error("Handover submission or stock guard failed");
    }

    // Test 4: User tries to submit handover again while already RETURN_PENDING (Expect 400)
    console.log("\n--- Testing 4: Duplicate handover attempt (Expect 400) ---");
    const dupHandoverRes = await fetch(`${baseUrl}/api/requests/${requestId}/handover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: formData,
    });
    console.log(`Duplicate block status: ${dupHandoverRes.status} (Expected 400)`);
    if (dupHandoverRes.status !== 400) throw new Error("Duplicate handover guard failed");

    // Test 5: Admin checks Handover Inspection Desk
    console.log("\n--- Testing 5: Admin views Handover Inspection Desk (Expect 1 pending return) ---");
    const deskRes = await fetch(`${baseUrl}/api/requests/handovers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deskData = (await deskRes.json()) as any;
    console.log(`Status: ${deskRes.status} (Expected 200)`);
    console.log(`Inspection queue count: ${deskData.data?.handovers?.length}`);
    console.log(`Borrower: ${deskData.data?.handovers[0]?.userId?.name}`);
    if (deskData.data?.handovers?.length !== 1) throw new Error("Inspection desk query failed");

    // Test 6: Admin rejects handover with reason (Missing lens cap) -> Reverts to APPROVED
    console.log("\n--- Testing 6: Admin rejects handover with reason (Reverts to APPROVED) ---");
    const rejectHandoverRes = await fetch(`${baseUrl}/api/requests/${requestId}/handover/reject`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ adminRemark: "Missing 50mm lens front cap and micro-HDMI cable" }),
    });
    const rejectHandoverData = (await rejectHandoverRes.json()) as any;
    console.log(`Status: ${rejectHandoverRes.status} (Expected 200)`);
    console.log(`Reverted Status: ${rejectHandoverData.data?.request?.status}`);
    console.log(`Rejection Reason: ${rejectHandoverData.data?.request?.handoverRejectedReason}`);
    if (rejectHandoverData.data?.request?.status !== "APPROVED") throw new Error("Handover rejection failed");

    // Test 7: User fixes issue and resubmits handover -> RETURN_PENDING
    console.log("\n--- Testing 7: Borrower resubmits handover with complete accessories ---");
    const resubmitFormData = new FormData();
    resubmitFormData.append("photos", fakePhotoBlob, "camera_complete.jpg");
    resubmitFormData.append("handoverNotes", "Added missing lens cap and cable to front desk pouch.");

    const resubmitRes = await fetch(`${baseUrl}/api/requests/${requestId}/handover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: resubmitFormData,
    });
    const resubmitData = (await resubmitRes.json()) as any;
    console.log(`Resubmit Status: ${resubmitRes.status} (Expected 200), Status: ${resubmitData.data?.request?.status}`);
    if (resubmitData.data?.request?.status !== "RETURN_PENDING") throw new Error("Resubmission failed");

    // Test 8: Admin approves handover -> Restores stock to 3, marks RETURNED
    console.log("\n--- Testing 8: Admin approves handover (Atomic Restock) ---");
    const approveHandoverRes = await fetch(`${baseUrl}/api/requests/${requestId}/handover/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveHandoverData = (await approveHandoverRes.json()) as any;
    console.log(`Approve Status: ${approveHandoverRes.status} (Expected 200)`);
    console.log(`Final Status: ${approveHandoverData.data?.request?.status}, ReturnedAt: ${Boolean(approveHandoverData.data?.request?.returnedAt)}`);

    // Verify stock is RESTORED back to 3 in DB
    const finalProduct = await Product.findById(productId);
    console.log(`Restored availableStock in DB: ${finalProduct?.availableStock} (Expected 3)`);
    if (approveHandoverData.data?.request?.status !== "RETURNED" || finalProduct?.availableStock !== 3) {
      throw new Error("Handover approval or stock restock failed");
    }

    // Test 9: User checks Owned Assets -> Should now be 0 (item has left custody)
    console.log("\n--- Testing 9: Verify asset leaves user's active custody ---");
    const finalOwnedRes = await fetch(`${baseUrl}/api/requests/owned`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const finalOwnedData = (await finalOwnedRes.json()) as any;
    console.log(`Owned assets count: ${finalOwnedData.data?.assets?.length} (Expected 0)`);
    if (finalOwnedData.data?.assets?.length !== 0) throw new Error("Custody cleanup failed");

    // Clean up
    await AssetRequest.findByIdAndDelete(requestId);
    await Product.findByIdAndDelete(productId);
    await User.deleteMany({ email: { $in: ["admin_handover@assetflow.com", "user_handover@assetflow.com"] } });

    console.log("\n✓ All Phase 6 Handover & Inspection API tests passed 100%!");
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runHandoverApiTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

