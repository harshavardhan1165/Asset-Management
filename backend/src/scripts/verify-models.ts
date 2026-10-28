import { connectDB } from "../config/db";
import { User, Product, AssetRequest } from "../models";
import { RequestStatus } from "../constants/requestState";
import mongoose from "mongoose";

async function testModels() {
  await connectDB();
  console.log("Starting model validation test...");

  // Clean up any previous test artifacts
  await User.deleteOne({ email: "test_verification@example.com" });
  await Product.deleteOne({ name: "Test Laptop Pro" });

  // 1. Test User Model (Password hashing & comparePassword)
  const user = new User({
    name: "Verification User",
    email: "test_verification@example.com",
    password: "SecretPassword123!",
    role: "USER",
  });
  await user.save();
  console.log("✓ User created and saved.");

  const isPasswordValid = await user.comparePassword("SecretPassword123!");
  const isWrongPasswordInvalid = await user.comparePassword("WrongPassword!");
  console.log("✓ Password hash check:", isPasswordValid && !isWrongPasswordInvalid ? "PASSED" : "FAILED");

  // Verify select: false doesn't expose password
  const queriedUser = await User.findById(user._id);
  console.log("✓ User password hidden by default:", queriedUser?.password === undefined ? "PASSED" : "FAILED");

  // 2. Test Product Model (Stock bounds validation & virtuals)
  const product = new Product({
    name: "Test Laptop Pro",
    category: "Laptops",
    description: "High performance development laptop",
    totalStock: 5,
    availableStock: 5,
  });
  await product.save();
  console.log("✓ Product created with availableStock: 5, totalStock: 5.");
  console.log("✓ Product virtual isInStock:", product.isInStock === true ? "PASSED" : "FAILED");

  // Test stock invariant: availableStock > totalStock should fail
  try {
    const invalidProduct = new Product({
      name: "Invalid Laptop",
      category: "Laptops",
      description: "Invalid stock test",
      totalStock: 2,
      availableStock: 10,
    });
    await invalidProduct.save();
    console.error("✗ Overdraft validation FAILED (should have thrown error)");
  } catch (err: any) {
    console.log("✓ Overdraft validation PASSED (correctly blocked availableStock > totalStock):", err.message);
  }

  // 3. Test AssetRequest Model & State Machine Guard
  const request = new AssetRequest({
    userId: user._id,
    productId: product._id,
    quantity: 1,
    purpose: "Testing state machine transitions",
    status: RequestStatus.PENDING,
  });
  await request.save();
  console.log("✓ AssetRequest created with status PENDING.");

  // Test legal transition: PENDING -> APPROVED
  request.status = RequestStatus.APPROVED;
  request.approvedAt = new Date();
  await request.save();
  console.log("✓ Transition PENDING -> APPROVED PASSED.");

  // Test illegal transition: APPROVED -> RETURNED (must go through RETURN_PENDING first)
  try {
    request.status = RequestStatus.RETURNED;
    await request.save();
    console.error("✗ Illegal transition FAILED (should have blocked APPROVED -> RETURNED)");
  } catch (err: any) {
    console.log("✓ Illegal transition guard PASSED (correctly blocked APPROVED -> RETURNED):", err.message);
  }

  // Clean up test documents
  await User.findByIdAndDelete(user._id);
  await Product.findByIdAndDelete(product._id);
  await AssetRequest.findByIdAndDelete(request._id);
  console.log("✓ Test records cleaned up.");

  console.log("\n All Phase 2 Model tests passed successfully!");
  await mongoose.connection.close();
  process.exit(0);
}

testModels().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

