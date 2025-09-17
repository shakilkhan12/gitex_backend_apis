import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: ".env" });
}

interface ConfigTypes {
    DB?: string,
    SHADOW_DB?: string,
    NODE_ENV?: string,
    JWT_SECRET?: string,
}

export const CONFIG: ConfigTypes = {
    DB: process.env.DATABASE_URL,
    SHADOW_DB: process.env.DATABASE_URL_SHADOW,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET_KEY
};
