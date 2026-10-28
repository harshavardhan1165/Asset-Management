import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User, Product, AssetRequest } from "../models";
import { UserRole } from "../constants/roles";
import { RequestStatus } from "../constants/requestState";

export async function seedDatabase() {
  await connectDB();
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Purge existing collections
    console.log("Cleaning existing database records...");
    await AssetRequest.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // 2. Seed Users
    console.log("Seeding user accounts...");
    const adminUser = await User.create({
      name: "System Administrator",
      email: "admin@assetflow.com",
      password: "Admin@123456",
      role: UserRole.ADMIN,
    });

    const johnUser = await User.create({
      name: "John Doe",
      email: "john@assetflow.com",
      password: "User@123456",
      role: UserRole.USER,
    });

    const janeUser = await User.create({
      name: "Jane Smith",
      email: "jane@assetflow.com",
      password: "User@123456",
      role: UserRole.USER,
    });

    console.log("✓ Created 3 users: 1 Admin, 2 End Users");

    // 3. Seed Products
    console.log("Seeding equipment catalog...");
    const productsData = [
      {
        name: "MacBook Pro 16\" M3 Max",
        category: "Laptops",
        description: "Apple M3 Max 16-Core CPU, 40-Core GPU, 48GB Unified RAM, 1TB SSD. Top-tier engineering machine.",
        totalStock: 8,
        availableStock: 8,
        imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Dell XPS 15 OLED",
        category: "Laptops",
        description: "13th Gen Intel Core i7, 32GB RAM, 1TB SSD, 3.5K OLED InfinityEdge touch display. Great for design and coding.",
        totalStock: 5,
        availableStock: 4, // 1 held by John
        imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Sony Alpha A7 IV Camera Kit",
        category: "Cameras",
        description: "33MP Full-Frame Exmor R sensor with 28-70mm lens, 4K 60p 10-bit recording. For documentary and media production.",
        totalStock: 4,
        availableStock: 4,
        imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Blackmagic Pocket Cinema 6K",
        category: "Cameras",
        description: "Super 35 sensor, 6K HDR video, dual native ISO, EF lens mount. Professional filmmaking camera.",
        totalStock: 2,
        availableStock: 2,
        imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Dell UltraSharp 32\" 4K USB-C Monitor",
        category: "Monitors",
        description: "4K IPS Black panel with 90W USB-C Power Delivery, RJ45 Ethernet hub, and factory calibrated color accuracy.",
        totalStock: 10,
        availableStock: 10,
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Rigol 100MHz Digital Oscilloscope",
        category: "Lab Tools",
        description: "4-Channel 100MHz Digital Storage Oscilloscope with 1GSa/s sampling rate and 7-inch color display.",
        totalStock: 6,
        availableStock: 6,
        imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Fluke 87V Industrial Multimeter",
        category: "Lab Tools",
        description: "True-RMS industrial digital multimeter with temperature probe, lifetime warranty, and rugged shock housing.",
        totalStock: 8,
        availableStock: 8,
        imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
      },
      {
        name: "Rode Wireless PRO Dual Mic System",
        category: "Audio Equipment",
        description: "Dual-channel wireless microphone system with 32-bit float on-board recording, timecode, and charging case.",
        totalStock: 6,
        availableStock: 5, // 1 in return review by John
        imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
      },
    ];

    const seededProducts = await Product.create(productsData);
    console.log(`✓ Created ${seededProducts.length} equipment catalog products across 5 categories`);

    // 4. Seed Realistic Lifecycle Requests
    console.log("Seeding sample requests across lifecycle stages...");

    const dellXps = seededProducts.find((p) => p.name.includes("Dell XPS"))!;
    const sonyCamera = seededProducts.find((p) => p.name.includes("Sony Alpha"))!;
    const rodeMic = seededProducts.find((p) => p.name.includes("Rode Wireless"))!;

    // Scenario A: Active Custody (Owned Asset)
    // John currently holds 1 Dell XPS 15 (APPROVED)
    await AssetRequest.create({
      userId: johnUser._id,
      productId: dellXps._id,
      quantity: 1,
      purpose: "Final semester Capstone full-stack project development",
      status: RequestStatus.APPROVED,
      processedBy: adminUser._id,
      approvedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      adminRemark: "Approved for capstone project team",
    });

    // Scenario B: Admin Pending Approval Queue
    // Jane requested 1 Sony Alpha Camera (PENDING)
    await AssetRequest.create({
      userId: janeUser._id,
      productId: sonyCamera._id,
      quantity: 1,
      purpose: "Department Annual Science Fair media coverage and interviews",
      status: RequestStatus.PENDING,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });

    // Scenario C: Admin Handover Inspection Desk
    // John initiated return on Rode Wireless Mic with photo proof (RETURN_PENDING)
    await AssetRequest.create({
      userId: johnUser._id,
      productId: rodeMic._id,
      quantity: 1,
      purpose: "Department podcast season 2 recording",
      status: RequestStatus.RETURN_PENDING,
      approvedAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
      handoverPhotos: [
        "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80",
      ],
      handoverNotes: "Returned to Media Lab Locker #3 with charging case, 2 transmitters, and both lavaliers in clean condition.",
      handoverRequestedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      processedBy: adminUser._id,
    });

    console.log("✓ Created 3 realistic sample requests:");
    console.log("   - 1 in Active Custody (Owned Assets)");
    console.log("   - 1 in Admin Approval Queue (Pending)");
    console.log("   - 1 in Admin Inspection Desk (Return Pending with photo)");

    console.log("\n✨ Database successfully seeded!");
    console.log(`
=====================================================
🔑 Demo Credentials Ready:
   Admin Account: admin@assetflow.com / Admin@123456
   User 1:        john@assetflow.com  / User@123456
   User 2:        jane@assetflow.com  / User@123456
=====================================================
    `);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedDatabase();

