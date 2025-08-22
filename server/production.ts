// Production server entry point for Railway
// This bypasses vite configuration issues

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());

// Enable CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files from the build directory
const publicPath = path.join(__dirname, 'public');
const distPath = path.join(__dirname, '..', 'dist', 'public');

// Try to serve from dist/public first (built files), then fallback to server/public
app.use(express.static(distPath));
app.use(express.static(publicPath));

// Register API routes
registerRoutes(app).then(server => {
  server.listen(PORT, () => {
    console.log(`🚀 Production server running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, err => {
      if (err) {
        // Fallback to server/public
        const fallbackPath = path.join(publicPath, 'index.html');
        res.sendFile(fallbackPath, err => {
          if (err) {
            res.status(404).send('Client build not found. Please run npm run build');
          }
        });
      }
    });
  }
});