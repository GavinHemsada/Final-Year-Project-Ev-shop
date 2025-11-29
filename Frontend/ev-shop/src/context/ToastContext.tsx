import React, { createContext, useContext, useState, useCallback } from "react";
import { TopMessageAlerts } from "@/components/MessageAlert";
import type { MessageAlertsProps } from "@/types/alert";

interface ToastContextType {
  showToast: (message: Omit<MessageAlertsProps, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a no-op function if ToastProvider is not available
    // This prevents crashes but logs a warning
    console.warn("useToast called outside ToastProvider, using no-op");
    return {
      showToast: () => {
        // No-op: silently fail if ToastProvider is not available
      },
    };
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toast, setToast] = useState<MessageAlertsProps | null>(null);

  const showToast = useCallback(
    (message: Omit<MessageAlertsProps, "id">) => {
      setToast({
        id: Date.now().toString(),
        ...message,
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <TopMessageAlerts
        message={toast}
        onClose={handleClose}
        position="top"
        positionValue="20px"
        right="20px"
        width="350px"
      />
    </ToastContext.Provider>
  );
};

