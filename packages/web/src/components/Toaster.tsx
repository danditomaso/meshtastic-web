import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@components/UI/Toast.tsx";
import { CircularProgress } from "@components/UI/CircularProgress.tsx";
import { useToast } from "@core/hooks/useToast.ts";
import { useEffect, useState } from "react";

interface ToastWithProgressProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
}

function ToastWithProgress(
  { id, title, description, action, duration, ...props }:
    ToastWithProgressProps,
) {
  const [progress, setProgress] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!duration) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duration) * 100, 100);
      setProgress(progressPercent);
    }, 100);

    return () => clearInterval(interval);
  }, [duration, startTime]);

  const shouldShowProgress = duration && duration > 5000; // Only show progress for long toasts

  return (
    <Toast
      key={id}
      {...props}
      duration={duration}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-1">
        {title && (
          <ToastTitle>
            {shouldShowProgress
              ? (
                <div className="flex items-center">
                  <CircularProgress
                    progress={progress}
                    size={24}
                    strokeWidth={2}
                    className="mr-4"
                  />
                  {title}
                </div>
              )
              : title}
          </ToastTitle>
        )}
        {description && <ToastDescription>{description}</ToastDescription>}
      </div>
      {action}
      <ToastClose />
    </Toast>
  );
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map((toast) => <ToastWithProgress key={toast.id} {...toast} />)}
      <ToastViewport />
    </ToastProvider>
  );
}
