import { Router } from 'express';
import database from '../db/database';

const router = Router();

router.get('/', (_request, response) => {
  database.prepare('SELECT 1').get();
  response.json({ status: 'ok', database: 'connected' });
});

export default router;
