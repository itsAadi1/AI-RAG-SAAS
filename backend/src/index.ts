import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
import documentRoutes from './routes/documents.routes';
import ragRoutes from "./routes/rag.routes";
import workspaceRoutes from './routes/workspace.routes';
import authRoutes from './routes/auth.routes';

app.use('/documents', documentRoutes);
app.use("/rag", ragRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/auth', authRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', routes: ['/auth/register', '/auth/login'] });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('  POST /auth/register');
  console.log('  POST /auth/login');
});

