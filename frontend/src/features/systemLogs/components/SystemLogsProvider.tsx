import React, { useState } from 'react';
import useDialogState from '@/shared/hooks/useDialogState';

import type { AuditLog } from '../types/audit';

type DialogType = 'add' | 'edit' | 'delete';

type SystemLogsContextType = {
  open: DialogType | null;
  setOpen: (str: DialogType | null) => void;
  currentRow: AuditLog | null;
  setCurrentRow: React.Dispatch<React.SetStateAction<AuditLog | null>>;
};

const SystemLogsContext = React.createContext<SystemLogsContextType | null>(
  null
);

export function SystemLogsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useDialogState<DialogType>(null);
  const [currentRow, setCurrentRow] = useState<AuditLog | null>(null);

  return (
    <SystemLogsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </SystemLogsContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSystemLogs = () => {
  const context = React.useContext(SystemLogsContext);

  if (!context) {
    throw new Error('useSystemLogs has to be used within <SystemLogsContext>');
  }

  return context;
};
