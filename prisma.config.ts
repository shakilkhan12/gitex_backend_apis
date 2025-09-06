import dotenv from "dotenv";
import { defineConfig } from "@prisma/config";

dotenv.config();

export default defineConfig({
  schema: "src/prisma/schema.prisma",
});
