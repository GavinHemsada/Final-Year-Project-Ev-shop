import { useEffect, useState } from "react";

interface AlertProps {
  alert: {
    title?: string;
    message?: string;
    type?: "success" | "error";
    duration?: number; 
  } | null;
  onClose?: () => void; 
  position?: "center" | "left" | "right";
  positionValue?: number;
  container?: boolean; // If true, positions relative to parent container instead of viewport
}

export const Alert: React.FC<AlertProps> = ({
  alert,
  onClose,
  position = "center",
  positionValue = 20,
  container = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
    }
  }, [alert]);

  useEffect(() => {
    if (!isVisible || !alert) return;

    const duration = alert.duration ?? 5000;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, alert]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!alert || !isVisible) return null;

  const { title = "", message = "", type = "error" } = alert;

  const colorMap: Record<"success" | "error", { icon: string; title: string; border: string }> = {
    success: { icon: "text-green-600", title: "text-green-700", border: "border-green-300" },
    error: { icon: "text-red-600", title: "text-red-700", border: "border-red-300" },
  };

  const { icon, title: titleColor, border } = colorMap[type];

  const positionClass = {
    center: "justify-center",
    left: "justify-start",
    right: "justify-end",
  }[position];

  const offsetStyle: React.CSSProperties =
    position === "left"
      ? { marginLeft: positionValue }
      : position === "right"
      ? { marginRight: positionValue }
      : {};

  // Use absolute positioning when container is true, fixed when false
  const containerClass = container 
    ? "absolute inset-0 bg-black/40 flex items-center" 
    : "fixed inset-0 bg-black/40 flex items-center";
  
  const alertWidthClass = container 
    ? "max-w-sm w-full sm:max-w-sm" 
    : "max-w-sm w-full";

  return (
    <div className={`${containerClass} ${positionClass} z-50`}>
      <div
        className={`bg-white border ${border} rounded-lg shadow-lg relative ${alertWidthClass} animate-slide-in mx-2 sm:mx-4`}
        style={offsetStyle}
      >
        {/* Close button */}
        <div className="flex justify-end p-2">
          <button
            onClick={handleClose}
            type="button"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm p-1.5 inline-flex items-center"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-0 text-center">
          {type === "success" ? (
            <svg className={`w-16 h-16 mx-auto ${icon} animate-pop`} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM8.5 13.3l-3.3-3.3 1.4-1.4 1.9 1.9 4.3-4.3 1.4 1.4-5.7 5.7Z" />
            </svg>
          ) : (
            <svg className={`w-16 h-16 mx-auto ${icon} animate-pop`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}

          <h3 className={`text-xl font-semibold mt-5 mb-3 ${titleColor}`}>{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
        </div>
      </div>
    </div>
  );
};


type MessageType = "success" | "warning" | "error";

interface MessageAlertsProps {
  message: {
    id: string;
    text: string;
    type: MessageType;
  } | null;
  onClose?: () => void;
  position?: "top" | "bottom";
  positionValue?: string;
  right?: string;
  width?: string;
}

export const TopMessageAlerts = ({
  message,
  onClose,
  position = "top",
  positionValue = "10%",
  right = "5px",
  width = "80%",
}: MessageAlertsProps) => {
  if (!message) return null;

  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  const colorMap: Record<
    MessageType,
    { bg: string; text: string; border: string; borderColor: string }
  > = {
    success: {
      bg: "bg-green-50",
      text: "text-green-500",
      border: "border-green-400",
      borderColor: "#4ade80",
    },
    warning: {
      bg: "bg-yellow-50",
      text: "text-yellow-500",
      border: "border-yellow-400",
      borderColor: "#facc15",
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-500",
      border: "border-red-400",
      borderColor: "#f87171",
    },
  };
  const { bg, text, border, borderColor } = colorMap[message.type];
  const baseClasses = `fixed max-w-md flex items-center gap-3 p-3 shadow-md animate-slide-in-out z-50 ${bg} ${text} ${border}`;

  return (
    <div
      key={message.id}
      className={baseClasses}
      style={{
        borderLeftColor: borderColor,
        [position]: positionValue,
        right: right,
        width: width,
      }}
    >
      {/* Icon */}
      <div className={`${text}`}>
        {message.type === "success" && (
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM8.5 13.3l-3.3-3.3 1.4-1.4 1.9 1.9 4.3-4.3 1.4 1.4-5.7 5.7Z" />
          </svg>
        )}
        {message.type === "warning" && (
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 14a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5H9V5h2v4.5Z" />
          </svg>
        )}
        {message.type === "error" && (
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 0a10 10 0 1 0 10 10A10 10 0 0 0 10 0Zm3.5 12.5L12.5 13 10 10.5 7.5 13l-.9-.9L9.1 9.6 6.6 7.1l.9-.9L10 8.7l2.5-2.5.9.9-2.5 2.5 2.5 2.5Z" />
          </svg>
        )}
      </div>

      {/* Message text */}
      <span className="flex-1 text-sm">{message.text}</span>

      {/* Close button */}
      <button onClick={onClose} className={`${text}-500 hover:${text}-700`}>
        <svg
          className="w-3 h-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M1 1l12 12M13 1L1 13"
          />
        </svg>
      </button>
    </div>
  );
};

interface ConfirmAlertProps {
  alert:{
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
  }
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmAlert: React.FC<ConfirmAlertProps> = ({
  alert,
  onConfirm,
  onCancel,
}) => {
  if (!alert) return null;
  const { title = "", message = "", confirmText = "Confirm", cancelText = "Cancel" } = alert;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white border rounded-lg shadow-lg relative max-w-sm w-full animate-slide-in">
        {/* Close button */}
        <div className="flex justify-end p-2">
          <button
            onClick={onCancel}
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 inline-flex items-center"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-0 text-center">
          <svg
            className="w-20 h-20 text-red-600 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 mt-5 mb-3">
            {title}
          </h3>
          <p className="text-gray-500 mb-6">{message}</p>

          <div className="flex justify-center gap-3">
            <button
              onClick={onConfirm}
              className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-base inline-flex items-center px-4 py-2.5"
            >
              {confirmText}
            </button>
            <button
              onClick={onCancel}
              className="text-gray-900 bg-white hover:bg-gray-100 focus:ring-4 focus:ring-cyan-200 border border-gray-200 font-medium rounded-lg text-base inline-flex items-center px-4 py-2.5"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};