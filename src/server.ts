
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors"
import morgan from "morgan";
import bodyParser from "body-parser";
import compression from "compression";
import express, { Request, Response } from "express";
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import mainRouter from "@/routes";
import { errorHandler } from "@/middlewares";
import AccessSecretService from "@/services/access_secret.service";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: '.env' });
}

const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = process.env.NODE_ENV === 'production'?[
  'https://gitexai-1dd08c5fca2d.herokuapp.com','http://localhost:4000','https://10.70.90.183:443','https://10.70.90.183'
  
]:['http://localhost:3000','http://localhost:5000','http://localhost:4000','https://10.70.90.183:443','https://10.70.90.183']

app.use(cors());

app.options('*', cors());

app.use(express.json({ limit: '100mb' }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Khorfakkan Smart City API Documentation'
}));

app.get("/", (_req: Request, res: Response) => res.send("🚀 Welcome to the API "));
app.use('/api', mainRouter)
app.use(errorHandler)

const startServer = async () => {
  app.listen(PORT, () => {
  });

};



startServer();
