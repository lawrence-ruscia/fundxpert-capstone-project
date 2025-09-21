import type {
  Loan,
  LoanDocument,
  LoanDocumentResponse,
  LoanPurposeCategory,
  LoanResponse,
} from '../types/loan';

export async function uploadLoanDocument(
  loanId: number,
  fileUrl: string,
  fileName: string
): Promise<{ document: LoanDocument }> {
  const res = await fetch(
    `http://localhost:3000/employee/loan/${loanId}/documents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // important for httpOnly cookie
      body: JSON.stringify({ fileUrl, fileName }),
    }
  );

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Failed to upload document');
  }
  return res.json();
}

export async function fetchLoanDocuments(
  loanId: number
): Promise<LoanDocumentResponse> {
  const res = await fetch(
    `http://localhost:3000/employee/loan/${loanId}/documents`,
    {
      credentials: 'include',
    }
  );

  if (!res.ok) {
    throw new Error((await res.json()).error || 'Failed to fetch documents');
  }
  return res.json();
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
