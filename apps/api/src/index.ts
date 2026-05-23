import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRouter from './routes/auth';
import usersRouter from './routes/users';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

app.listen(PORT, () => {
  console.log(`PeakForm API running on http://localhost:${PORT}`);
});

export default app;
