import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';
import type { HREmployeeRecord } from '../types/employeeTypes';

type EmployeesActionType = 'add' | 'view' | 'edit' | 'delete';

type EmployeesContextType = {
  open: EmployeesActionType | null;
  setOpen: (str: EmployeesActionType | null) => void;
  currentRow: HREmployeeRecord | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<HREmployeeRecord | null>>;
};

const EmployeesContext = React.createContext<EmployeesContextType | null>(null);

export function EmployeesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<EmployeesActionType>(null);
  const [currentRow, setCurrentRow] = useState<HREmployeeRecord | null>(null);

  return (
    <EmployeesContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </EmployeesContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEmployees = () => {
  const employeesContext = React.useContext(EmployeesContext);

  if (!employeesContext) {
    throw new Error('useEmployees has to be used within <EmployeesContext>');
  }

  return employeesContext;
};
