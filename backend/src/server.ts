import express, { json } from 'express';
import 'dotenv/config'; // This works with ES modules
import cors from 'cors';
import cookieParser from 'cookie-parser';

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
app.use(cookieParser());

import { authRouter } from './routes/authRoutes.js';
import { employeeRouter } from './routes/employeeRoutes.js';
import { empLoanRouter } from './routes/employeeLoanRoutes.js';
import { loanDocumentRouter } from './routes/loanDocumentRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';

// Routes
app.use('/auth', authRouter);
app.use('/employee', employeeRouter);
app.use('/employee/loan', empLoanRouter);
app.use('/employee/loan', loanDocumentRouter);

app.use('/uploads', express.static('uploads')); // serve uploaded files

app.listen(PORT, err => {
  if (err) {
    throw err;
  }

  console.log(`Server running on port ${PORT.toString()}`);
});
