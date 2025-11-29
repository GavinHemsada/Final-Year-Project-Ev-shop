export type AlertProps = {
  id: number;
  title?: string;
  message?: string;
  type?: "success" | "error";
  duration?: number;
};
export type MessageAlertsProps = {
  id: string;
  text: string;
  type: "success" | "error" | "warning" | "info";
};
export type ConfirmAlertProps = {
  id: number;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};
