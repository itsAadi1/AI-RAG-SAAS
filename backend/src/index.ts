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

app.listen(3000, () => console.log("Server running on port 3000"));
