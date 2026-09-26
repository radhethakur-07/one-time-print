import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { bootstrapDatabase } from "./bootstrap";

async function main() {
  console.log("==> Starting Neon PostgreSQL Schema Migration & Bootstrap...");
  const result = await bootstrapDatabase();
  if (result.success) {
    console.log("==> Success:", result.message);
    process.exit(0);
  } else {
    console.error("==> Error:", result.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("==> Fatal migration error:", err);
  process.exit(1);
});
