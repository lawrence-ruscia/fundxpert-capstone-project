import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';
import type { Loan } from '../../employee/types/loan';

type DialogType = 'view' | 'manage' | 'approve';

type LoansDataContextType = {
  open: DialogType | null;
  setOpen: (str: DialogType | null) => void;
  currentRow: Loan | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Loan | null>>;
};

const LoansDataContext = React.createContext<LoansDataContextType | null>(null);

export function LoansDataProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<Loan | null>(null);

  return (
    <LoansDataContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </LoansDataContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLoansData = () => {
  const context = React.useContext(LoansDataContext);

  if (!context) {
    throw new Error('useLoansDat has to be used within <LoansDataContext>');
  }

  return context;
};
