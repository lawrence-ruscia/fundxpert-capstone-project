import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';
import type { Contribution } from '../types/hrContribution';

type DialogType = 'add' | 'edit' | 'delete';

type EmployeesContextType = {
  open: DialogType | null;
  setOpen: (str: DialogType | null) => void;
  currentRow: Contribution | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Contribution | null>>;
};

const EmployeeContributionsContext =
  React.createContext<EmployeesContextType | null>(null);

export function EmployeeContributionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<Contribution | null>(null);

  return (
    <EmployeeContributionsContext
      value={{ open, setOpen, currentRow, setCurrentRow }}
    >
      {children}
    </EmployeeContributionsContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEmpContributions = () => {
  const employeesContext = React.useContext(EmployeeContributionsContext);

  if (!employeesContext) {
    throw new Error(
      'useEmpContributions has to be used within <EmployeeContributionsContext>'
    );
  }

  return employeesContext;
};
