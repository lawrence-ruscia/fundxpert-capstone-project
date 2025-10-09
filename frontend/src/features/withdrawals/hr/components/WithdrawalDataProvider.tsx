import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';
import type { WithdrawalRequest } from '../../employee/types/withdrawal';

type DialogType = 'view' | 'manage' | 'approve';

type WithdrawalDataContextType = {
  open: DialogType | null;
  setOpen: (str: DialogType | null) => void;
  currentRow: WithdrawalRequest | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<WithdrawalRequest | null>>;
};

const WithdrawalDataContext =
  React.createContext<WithdrawalDataContextType | null>(null);

export function WithdrawalDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<WithdrawalRequest | null>(null);

  return (
    <WithdrawalDataContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </WithdrawalDataContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWithdrawalsData = () => {
  const context = React.useContext(WithdrawalDataContext);

  if (!context) {
    throw new Error(
      'useWithdrawalsData has to be used within <WithdrawalDataContext>'
    );
  }

  return context;
};
