
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

// Load environment variables
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: '.env' });
}

const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = process.env.NODE_ENV === 'production'?[
  'https://gitexai-1dd08c5fca2d.herokuapp.com',
  
]:['http://localhost:3000','http://localhost:5000']

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Khorfakkan Smart City API Documentation'
}));

// routes
app.get("/", (_req: Request, res: Response) => res.send("🚀 Welcome to the API "));
app.use('/api', mainRouter)
app.use(errorHandler)

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀  Server ready at: http://localhost:${PORT}/`);
    console.log(`📚  API Documentation: http://localhost:${PORT}/api-docs`);
  });

  // Run once immediately
  // AccessSecretService.updateAccessSecret()
  //   .then(() => console.log("🔑 Initial Access Secret updated"))
  //   .catch((err) => console.error("❌ Failed to update Access Secret:", err));

  // Start daily cron job
  // AccessSecretService.startCronJob();
};



startServer();
