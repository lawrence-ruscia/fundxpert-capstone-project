import express, { json } from 'express';
import 'dotenv/config'; // This works with ES modules
import { authRouter } from './routes/authRoutes.js';
const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.urlencoded());
app.use(json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Authentication
app.use('/auth', authRouter);

app.listen(PORT, err => {
  if (err) {
    throw err;
  }

  console.log(`Server running on port ${PORT.toString()}`);
});
