import http from "http";
import mongoose from "mongoose";
import { createApp } from "../app";
import { connectDB } from "../config/db";
import { User, Product, AssetRequest } from "../models";
import { generateToken } from "../utils/token";
import { RequestStatus } from "../constants/requestState";

async function runProductApiTests() {
  await connectDB();
  const app = createApp();
  const port = 5066;
  const baseUrl = `http://localhost:${port}`;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(port, resolve));
  console.log(`Product test server running at ${baseUrl}`);

  try {
    // 1. Setup test admin and user
    await User.deleteMany({ email: { $in: ["admin_test@assetflow.com", "user_test@assetflow.com"] } });
    await Product.deleteMany({ name: { $in: ["MacBook Pro 16", "Dell UltraSharp Monitor"] } });

    const admin = await User.create({
      name: "Inventory Admin",
      email: "admin_test@assetflow.com",
      password: "Password123!",
      role: "ADMIN",
    });

    const user = await User.create({
      name: "Standard Borrower",
      email: "user_test@assetflow.com",
      password: "Password123!",
      role: "USER",
    });

    const adminToken = generateToken({ id: admin._id.toString(), email: admin.email, role: admin.role });
    const userToken = generateToken({ id: user._id.toString(), email: user.email, role: user.role });

    // Test 1: User tries to create product (Expect 403 Forbidden)
    console.log("\n--- Testing 1: Standard User creates product (Expect 403) ---");
    const userCreateRes = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Unauthorized Laptop",
        category: "Laptops",
        description: "Should fail",
        totalStock: 5,
      }),
    });
    console.log(`Status: ${userCreateRes.status} (Expected 403)`);
    if (userCreateRes.status !== 403) throw new Error("RBAC guard failed");

    // Test 2: Admin creates product (Expect 201)
    console.log("\n--- Testing 2: Admin creates product (Expect 201) ---");
    const adminCreateRes = await fetch(`${baseUrl}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "MacBook Pro 16",
        category: "Laptops",
        description: "Apple M2 Pro chip with 32GB RAM",
        totalStock: 5,
      }),
    });
    const createData = (await adminCreateRes.json()) as any;
    console.log(`Status: ${adminCreateRes.status} (Expected 201)`);
    console.log(`Created: ${createData.data?.product?.name}, Available: ${createData.data?.product?.availableStock}`);
    if (adminCreateRes.status !== 201 || createData.data?.product?.availableStock !== 5) {
      throw new Error("Admin product creation failed");
    }

    const productId = createData.data.product.id || createData.data.product._id;

    // Test 3: Public Catalog Query (GET /api/products)
    console.log("\n--- Testing 3: Get Products List (Expect 200) ---");
    const listRes = await fetch(`${baseUrl}/api/products?search=MacBook&category=Laptops`);
    const listData = (await listRes.json()) as any;
    console.log(`Status: ${listRes.status} (Expected 200)`);
    console.log(`Found: ${listData.data?.products?.length} product(s), InStock: ${listData.data?.products[0]?.isInStock}`);
    if (listRes.status !== 200 || listData.data.products.length === 0) {
      throw new Error("Catalog search failed");
    }

    // Test 4: Get Categories (GET /api/products/categories)
    console.log("\n--- Testing 4: Get Categories (Expect 200) ---");
    const catRes = await fetch(`${baseUrl}/api/products/categories`);
    const catData = (await catRes.json()) as any;
    console.log(`Status: ${catRes.status}, Categories: ${JSON.stringify(catData.data.categories)}`);
    if (catRes.status !== 200 || !catData.data.categories.includes("Laptops")) {
      throw new Error("Categories query failed");
    }

    // Test 5: Update Total Stock (PUT /api/products/:id)
    console.log("\n--- Testing 5: Admin increases total stock to 8 ---");
    const updateRes = await fetch(`${baseUrl}/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ totalStock: 8 }),
    });
    const updateData = (await updateRes.json()) as any;
    console.log(`Status: ${updateRes.status}, New Total: ${updateData.data.product.totalStock}, Available: ${updateData.data.product.availableStock}`);
    if (updateData.data.product.totalStock !== 8 || updateData.data.product.availableStock !== 8) {
      throw new Error("Stock update failed");
    }

    // Test 6: Delete Protection & Stock Reduction Protection
    console.log("\n--- Testing 6: Active Custody Protection Guard ---");
    // Simulate user holding 3 units under APPROVED status
    const activeRequest = await AssetRequest.create({
      userId: user._id,
      productId: productId,
      quantity: 3,
      purpose: "Project machine learning training",
      status: RequestStatus.APPROVED,
      approvedAt: new Date(),
    });

    // Manually decrement availableStock to 5 (8 total - 3 borrowed = 5)
    await Product.findByIdAndUpdate(productId, { availableStock: 5 });

    // Test reducing total stock below borrowed (e.g. try setting totalStock to 2 when 3 are borrowed)
    const badStockRes = await fetch(`${baseUrl}/api/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ totalStock: 2 }),
    });
    const badStockData = (await badStockRes.json()) as any;
    console.log(`Over-reduction Blocked Status: ${badStockRes.status} (Expected 400)`);
    console.log(`Message: ${badStockData.message}`);
    if (badStockRes.status !== 400) throw new Error("Stock over-reduction guard failed");

    // Test deleting product while borrowed (Expect 400 Bad Request)
    const delBlockedRes = await fetch(`${baseUrl}/api/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const delBlockedData = (await delBlockedRes.json()) as any;
    console.log(`Delete Blocked Status: ${delBlockedRes.status} (Expected 400)`);
    console.log(`Message: ${delBlockedData.message}`);
    if (delBlockedRes.status !== 400) throw new Error("Delete protection guard failed");

    // Test 7: View Active Holders (GET /api/products/:id/holders)
    console.log("\n--- Testing 7: Admin View Product Active Holders ---");
    const holdersRes = await fetch(`${baseUrl}/api/products/${productId}/holders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const holdersData = (await holdersRes.json()) as any;
    console.log(`Status: ${holdersRes.status}`);
    console.log(`Holders Count: ${holdersData.data?.holders?.length}, Borrower: ${holdersData.data?.holders[0]?.user?.email}`);
    if (holdersData.data?.holders?.length !== 1) throw new Error("Holders query failed");

    // Clean up active request and delete product
    await AssetRequest.findByIdAndDelete(activeRequest._id);

    const delSuccessRes = await fetch(`${baseUrl}/api/products/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`Final Delete After Restock Status: ${delSuccessRes.status} (Expected 200)`);
    if (delSuccessRes.status !== 200) throw new Error("Final delete failed");

    // Clean up users
    await User.deleteMany({ email: { $in: ["admin_test@assetflow.com", "user_test@assetflow.com"] } });
    console.log("\n✓ All Product & Inventory API tests passed 100%!");
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runProductApiTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

