import dotenv from "dotenv"
dotenv.config({ path: ".env.test" });
interface ConfigTypes {
    DB?: string,
    NODE_ENV?:string,
    JWT_SECRET?:string,
}
export const CONFIG: ConfigTypes = {
    DB: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET_KEY
}