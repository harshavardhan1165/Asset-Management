import { JsonObject } from "swagger-ui-express";

export const swaggerDocument: JsonObject = {
  openapi: "3.0.0",
  info: {
    title: "AssetFlow API",
    version: "1.0.0",
    description:
      "Interactive Swagger UI for the Asset & Equipment Allocation Management System. You can test all endpoints directly here.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token (obtained from /api/auth/login)",
      },
    },
  },
  tags: [
    { name: "System", description: "Health & System status" },
    { name: "Authentication", description: "User registration, login, and profile" },
    { name: "Products & Inventory", description: "Equipment catalog and admin stock management" },
    { name: "User Requests & Custody", description: "Allocation request submission, cancellation, and photo handover" },
    { name: "Admin Approval Queue", description: "Review and approve/reject pending requests" },
    { name: "Admin Inspection Desk", description: "Verify return condition photos and restock inventory" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Check system and database health",
        responses: {
          200: { description: "System is healthy" },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", example: "john@assetflow.com" },
                  password: { type: "string", example: "User@123456" },
                  role: { type: "string", enum: ["USER", "ADMIN"], example: "USER" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully, returns token" },
          409: { description: "Email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Authenticate user and get JWT token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@assetflow.com" },
                  password: { type: "string", example: "Admin@123456" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful, returns JWT token" },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get currently logged-in user profile",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "User profile data" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/products": {
      get: {
        tags: ["Products & Inventory"],
        summary: "Browse equipment catalog (Search, filter, paginate)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Keyword search in name/description" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Filter by category (e.g. Laptops, Cameras)" },
          { name: "inStock", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: {
          200: { description: "List of products with live stock counts" },
        },
      },
      post: {
        tags: ["Products & Inventory"],
        summary: "Add new equipment to catalog (Admin Only)",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "category", "description", "totalStock"],
                properties: {
                  name: { type: "string", example: "MacBook Pro 16\" M3 Max" },
                  category: { type: "string", example: "Laptops" },
                  description: { type: "string", example: "Apple M3 Max 16-Core CPU, 48GB Unified RAM" },
                  totalStock: { type: "integer", example: 8 },
                  imageUrl: { type: "string", example: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Product created" },
          403: { description: "Forbidden - Requires ADMIN role" },
        },
      },
    },
    "/api/products/categories": {
      get: {
        tags: ["Products & Inventory"],
        summary: "Get all distinct equipment categories",
        responses: {
          200: { description: "Array of category names" },
        },
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products & Inventory"],
        summary: "Get single product specifications by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Product details" },
          404: { description: "Product not found" },
        },
      },
      put: {
        tags: ["Products & Inventory"],
        summary: "Update product details & adjust total stock (Admin Only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  description: { type: "string" },
                  totalStock: { type: "integer", example: 10 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Product updated" },
          400: { description: "Cannot reduce total stock below borrowed count" },
          403: { description: "Forbidden" },
        },
      },
      delete: {
        tags: ["Products & Inventory"],
        summary: "Delete equipment (Admin Only - Blocked if units are borrowed)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Product deleted" },
          400: { description: "Cannot delete: units are in active custody" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/products/{id}/holders": {
      get: {
        tags: ["Products & Inventory"],
        summary: "View active borrowers holding this equipment (Admin Only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "List of users currently holding physical units" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/requests": {
      post: {
        tags: ["User Requests & Custody"],
        summary: "Submit equipment allocation request",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["productId", "quantity", "purpose"],
                properties: {
                  productId: { type: "string", example: "6ad07ad556bc37cf2b316d3e" },
                  quantity: { type: "integer", example: 1 },
                  purpose: { type: "string", example: "Senior development project" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Request submitted (Status: PENDING)" },
          400: { description: "Out of stock or invalid quantity" },
        },
      },
    },
    "/api/requests/my": {
      get: {
        tags: ["User Requests & Custody"],
        summary: "View user's own request history (newest first)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of user's requests" },
        },
      },
    },
    "/api/requests/owned": {
      get: {
        tags: ["User Requests & Custody"],
        summary: "View items in user's active custody (APPROVED or RETURN_PENDING)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Currently held items" },
        },
      },
    },
    "/api/requests/{id}": {
      get: {
        tags: ["User Requests & Custody"],
        summary: "Get details of a single request",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Request details" },
          403: { description: "Access denied" },
          404: { description: "Not found" },
        },
      },
    },
    "/api/requests/{id}/cancel": {
      patch: {
        tags: ["User Requests & Custody"],
        summary: "Cancel own request (Only allowed while PENDING)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Request cancelled (Status: CANCELLED)" },
          400: { description: "Cannot cancel non-pending request" },
          403: { description: "Not your request" },
        },
      },
    },
    "/api/requests/{id}/handover": {
      post: {
        tags: ["User Requests & Custody"],
        summary: "Initiate return with condition photos & notes",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  photos: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "1-2 photos of equipment condition",
                  },
                  handoverNotes: { type: "string", example: "Returned to Media Room locker #3 with charger" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Handover submitted (Status: RETURN_PENDING)" },
          400: { description: "Requires photo or invalid status" },
        },
      },
    },
    "/api/requests/pending": {
      get: {
        tags: ["Admin Approval Queue"],
        summary: "Central queue of all pending requests organization-wide (Admin Only)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of pending requests" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/requests/{id}/approve": {
      patch: {
        tags: ["Admin Approval Queue"],
        summary: "Approve request and atomically reserve stock (Admin Only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  adminRemark: { type: "string", example: "Approved for lab coursework" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Request approved (Status: APPROVED, stock decremented)" },
          409: { description: "Stock depleted by concurrent approval (Zero Overdraft)" },
        },
      },
    },
    "/api/requests/{id}/reject": {
      patch: {
        tags: ["Admin Approval Queue"],
        summary: "Reject request with mandatory reason (Admin Only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["adminRemark"],
                properties: {
                  adminRemark: { type: "string", example: "Equipment reserved for faculty exam" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Request rejected (Status: REJECTED)" },
          400: { description: "Rejection reason is mandatory" },
        },
      },
    },
    "/api/requests/handovers": {
      get: {
        tags: ["Admin Inspection Desk"],
        summary: "List all items awaiting physical return inspection (Admin Only)",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of returned items with photos" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/requests/{id}/handover/approve": {
      patch: {
        tags: ["Admin Inspection Desk"],
        summary: "Verify return, atomically restore stock, mark RETURNED (Admin Only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Handover approved, stock restored" },
          400: { description: "Invalid status" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/requests/{id}/handover/reject": {
      patch: {
        tags: ["Admin Inspection Desk"],
        summary: "Reject return with reason and revert to borrower (Admin Only)",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["adminRemark"],
                properties: {
                  adminRemark: { type: "string", example: "Missing power adapter and HDMI cable" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Handover rejected, reverted to APPROVED" },
          400: { description: "Rejection reason mandatory" },
        },
      },
    },
  },
};

