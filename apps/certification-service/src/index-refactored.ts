import {
  createBaseService,
  addHealthCheck,
  addErrorHandlers,
} from "@thai-binh/utils/service";
import { createDatabase } from "@thai-binh/database/pg";
import { blankRoutes } from "./routes/blanks";
import { registryRoutes } from "./routes/registry";
import { certificateRoutes } from "./routes/certificates-refactored";
import { workflowRoutes } from "./routes/workflow";

// Database connection
const db = createDatabase({
  url:
    process.env.DATABASE_URL ||
    "postgresql://thai_binh:thai_binh_dev@localhost:5432/thai_binh_training",
});

// Create service with shared framework
const app = createBaseService({
  name: "certification-service",
  port: parseInt(process.env.PORT || "3007"),
  database: db,
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
});

// Health check
addHealthCheck(app, "certification-service");

// Routes
app.route("/api/blanks", blankRoutes);
app.route("/api/registry", registryRoutes);
app.route("/api/certificates", certificateRoutes);
app.route("/api/workflow", workflowRoutes);

// Error handlers
addErrorHandlers(app);

const port = parseInt(process.env.PORT || "3007");

console.log(`🎓 Certification Service starting on port ${port}...`);
console.log(`📜 Quản lý Văn bằng Chứng chỉ - Thông tư 21/2019/TT-BGDĐT`);

export default {
  port,
  fetch: app.fetch,
};
