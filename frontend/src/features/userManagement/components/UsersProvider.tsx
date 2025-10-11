import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';
import type { User } from '@/shared/types/user';

type DialogType = 'add' | 'edit' | 'delete';

type UsersContextType = {
  open: DialogType | null;
  setOpen: (str: DialogType | null) => void;
  currentRow: User | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>;
};

const UsersContext = React.createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<User | null>(null);

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const context = React.useContext(UsersContext);

  if (!context) {
    throw new Error('useUsers has to be used within <UsersContext>');
  }

  return context;
};
