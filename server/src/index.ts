import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import database from './db/db';
import healthRoutes from './routes/healthRoutes';
import attemptRoutes from './routes/attemptRoutes';
import problemRoutes from './routes/problemRoutes';
import { seedProblems } from './db/seed';

const app = express();
const port = Number(process.env.PORT) || 3000;

console.log('[startup] database initialized; invoking seedProblems');
seedProblems(database);

app.use(cors());
app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/attempts', attemptRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
