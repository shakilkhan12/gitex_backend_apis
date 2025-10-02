
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

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: '.env' });
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;


const allowedOrigins = process.env.NODE_ENV === 'production'?[
  'https://gitexai-1dd08c5fca2d.herokuapp.com','http://localhost:4000','https://10.70.90.183:443','https://10.70.90.183', 'http://10.70.90.9:3000','https://10.70.90.9:3000', 'http://83.111.75.163:3000', 'https://83.111.75.163:3000'
  
]:['http://localhost:3000','http://localhost:5000','http://localhost:4000','https://10.70.90.183:443','https://10.70.90.183', 'http://10.70.90.9:3000','https://10.70.90.9:3000', 'http://83.111.75.163:3000', 'https://83.111.75.163:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Apply CSP to all routes except Swagger UI
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    // Disable CSP for Swagger UI routes
    return next();
  }
  
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })(req, res, next);
});
app.use(morgan("dev"));
app.use(compression());

// Serve Swagger UI static assets with proper MIME types
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

// Serve the swagger.json file
app.get('/api-docs/swagger.json', (req, res) => {
  console.log('Swagger specs generated:', Object.keys((specs as any).paths || {}).length, 'paths found');
  console.log('Specs object keys:', Object.keys(specs));
  console.log('Paths found:', Object.keys((specs as any).paths || {}));
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.send(specs);
});

// Swagger UI configuration with proper static asset handling
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Khorfakkan Smart City API Documentation',
  swaggerOptions: {
    url: '/api-docs/swagger.json',
    validatorUrl: null
  }
}));

app.get("/", (_req: Request, res: Response) => res.send("🚀 Welcome to the API "));
app.use('/api', mainRouter)
app.use(errorHandler)

const startServer = async () => {
  try {
    // Initialize Socket.IO
    SocketService.initializeSocket(server);
    
    // Initialize Cron Jobs
    CronService.initializeCronJobs();
    
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server initialized`);
      console.log(`⏰ Cron jobs initialized - Morning grass monitoring at 7:00 AM daily`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};



startServer();
