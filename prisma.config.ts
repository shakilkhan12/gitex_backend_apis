import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";
dotenv.config({ path: ".env.test" });

export default defineConfig({
  schema: "src/prisma/schema.prisma",
});
