
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors"
import morgan from "morgan";
import bodyParser from "body-parser";
import compression from "compression";
import express, { Request, Response } from "express";
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';
import mainRouter from "@/routes";
import { errorHandler } from "@/middlewares";
import SocketService from "@/services/socket.service";
import CronService from "@/services/cron.service";
import EventBufferService from "@/services/event-buffer.service";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: '.env' });
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;


const allowedOrigins = process.env.NODE_ENV === 'production'?[
  'https://gitexai-1dd08c5fca2d.herokuapp.com','http://localhost:4000','https://10.70.90.183:443','https://10.70.90.183', 'http://10.70.90.9:3000','https://10.70.90.9:3000', 'http://83.111.75.163:3000', 'https://83.111.75.163:3000','http://10.70.90.9'
  
]:['http://localhost:3000','http://localhost:5000','http://localhost:4000','https://10.70.90.183:443','https://10.70.90.183', 'http://10.70.90.9:3000','https://10.70.90.9:3000', 'http://83.111.75.163:3000', 'https://83.111.75.163:3000','http://10.70.90.9']

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// }));
app.use(cors());

app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'", "*"],
        imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
        connectSrc: ["'self'", "http:", "https:"],
        mediaSrc: ["'self'", "data:", "blob:", "http:", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "http:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'", "http:", "https:"],
      },
    },
    crossOriginResourcePolicy: false, // ✅ very important for images
  })
);


app.use(morgan("dev"));
app.use(compression());

app.use('/api-docs', express.static('node_modules/swagger-ui-dist', {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.match(/\.(png|jpg|jpeg|gif)$/)) {
      res.setHeader('Content-Type', 'image/' + path.split('.').pop());
    } else if (path.match(/\.(woff|woff2)$/)) {
      res.setHeader('Content-Type', 'font/woff');
    }
  }
}));

app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.send(specs);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Khorfakkan Smart City API Documentation',
  swaggerOptions: {
    url: '/api-docs/swagger.json',
    validatorUrl: null
  }
}));

app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  next();
}, express.static('uploads'));

app.get("/", (_req: Request, res: Response) => res.send("🚀 Welcome to the API "));
app.use('/api', mainRouter)
app.use(errorHandler)

const startServer = async () => {
  try {
    SocketService.initializeSocket(server);
    
    CronService.initializeCronJobs();
    
    EventBufferService.initialize();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server initialized`);
      console.log(`⏰ Cron jobs initialized - Grass monitoring at 07:30AM, Irrigation at 08:00AM daily, User fetch at every hour`);
      console.log(`🔄 QMS Stream Bridge initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};



startServer();
