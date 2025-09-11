import express, { json } from 'express';
import 'dotenv/config'; // This works with ES modules
import cors from 'cors';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.urlencoded());
app.use(json());
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true, // Allow cookies/auth headers
  })
);

import { authRouter } from './routes/authRoutes.js';

// Authentication
app.use('/auth', authRouter);

app.listen(PORT, err => {
  if (err) {
    throw err;
  }

  console.log(`Server running on port ${PORT.toString()}`);
});
