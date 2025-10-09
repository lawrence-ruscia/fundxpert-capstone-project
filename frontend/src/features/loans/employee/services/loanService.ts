import { api } from '@/shared/api/api';
import type {
  CancelLoanResponse,
  Loan,
  LoanDocument,
  LoanResponse,
} from '../types/loan';

export async function uploadLoanDocument(
  loanId: number,
  fileUrl: string,
  fileName: string,
  role: 'HR' | 'Employee' = 'Employee'
): Promise<{ document: LoanDocument }> {
  const endpoint =
    role === 'Employee'
      ? `employee/loan/${loanId}/documents`
      : `hr/loans/${loanId}/documents`;

  const res = await api.post(endpoint, {
    fileUrl,
    fileName,
  });

  return res.data;
}

export async function fetchLoanDocuments(
  loanId: number
): Promise<LoanDocument[]> {
  const res = await api.get(`employee/loan/${loanId}/documents`);

  return res.data.employeeDocuments;
}

export async function fetchLoanDetails(loanId: number): Promise<LoanResponse> {
  const res = await fetch(`http://localhost:3000/employee/loan/${loanId}`, {
    method: 'GET',
    credentials: 'include', // ensure cookies (auth) are sent
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch loan details: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchEmployeeLoans(): Promise<Loan[]> {
  const res = await fetch(`http://localhost:3000/employee/loan/history`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch loans: ${res.statusText}`);
  }
  const data = await res.json();
  return data.loans;
}

type LoanApplicationRequest = {
  amount: number;
  repayment_term_months: number;
  purpose_category: string;
  purpose_detail?: string | null;
  consent_acknowledged: boolean;
  co_maker_employee_id?: string | null;
};

export async function applyForLoan(
  payload: LoanApplicationRequest
): Promise<Loan> {
  const res = await fetch('http://localhost:3000/employee/loan/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Loan application failed');
  }

  return res.json();
}

export async function cancelLoan(
  loanId: number,
  reason: string
): Promise<CancelLoanResponse> {
  const res = await api.post(`/employee/loan/${loanId}/cancel`, {
    remarks: reason,
  });
  return res.data;
}
