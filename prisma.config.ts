import path from "path";
import { defineConfig } from "prisma/config";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "src/prisma/schema.prisma",
});
