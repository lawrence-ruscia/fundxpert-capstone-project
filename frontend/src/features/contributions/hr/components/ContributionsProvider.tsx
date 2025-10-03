import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';
import type { Contribution } from '../types/hrContribution';

type DialogType = 'add' | 'edit' | 'delete';

type ContributionsContextType = {
  open: DialogType | null;
  setOpen: (str: DialogType | null) => void;
  currentRow: Contribution | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<Contribution | null>>;
};

const ContributionsContext =
  React.createContext<ContributionsContextType | null>(null);

export function ContributionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<Contribution | null>(null);

  return (
    <ContributionsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ContributionsContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useContributions = () => {
  const context = React.useContext(ContributionsContext);

  if (!context) {
    throw new Error(
      'useContributions has to be used within <ContributionsContext>'
    );
  }

  return context;
};
