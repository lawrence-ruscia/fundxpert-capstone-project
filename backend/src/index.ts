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
import { empLoanRouter } from './routes/loanRoutes.js';
import { loanDocumentRouter } from './routes/loanDocumentRoutes.js';
import { empWithdrawalRouter } from './routes/withdrawalRoutes.js';
import { withdrawalDocumentRouter } from './routes/withdrawalDocumentRoutes.js';
import { hrRouter } from './routes/hrRoutes.js';
import { hrContributionsRouter } from './routes/hrContributionsRoutes.js';
import { hrLoanRouter } from './routes/hrLoanRoutes.js';
import { hrWithdrawalRouter } from './routes/hrWithdrawalRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { notifRouter } from './routes/notificationRoutes.js';

// To return client's true IP
app.set('trust proxy', true);

// Auth routes
app.use('/auth', authRouter);

// Employee routes
app.use('/employee', employeeRouter);
app.use('/employee/loan', empLoanRouter);
app.use('/employee/loan', loanDocumentRouter);
app.use('/employee/withdrawal', empWithdrawalRouter);
app.use('/employee/withdrawal', withdrawalDocumentRouter);

// HR routes
app.use('/hr', hrRouter);
app.use('/hr/contributions', hrContributionsRouter);
app.use('/hr/loans', hrLoanRouter);
app.use('/hr/withdrawals', hrWithdrawalRouter);

// admin routes
app.use('/admin', adminRouter);

// notif routes
app.use('/notifications', notifRouter);

app.use('/uploads', express.static('uploads')); // serve uploaded files

app.listen(PORT, err => {
  if (err) {
    throw err;
  }

  console.log(`Server running on port ${PORT.toString()}`);
});
