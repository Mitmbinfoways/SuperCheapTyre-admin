import { toast, ToastOptions } from 'react-hot-toast';

const GLOBAL_TOAST_ID = 'GLOBAL_SINGLE_HOT_TOAST';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'loading' | 'default';
  duration?: number;
}

export const Toast = ({ message, type = 'default', duration = 3000 }: ToastProps) => {
  const options: ToastOptions = {
    id: GLOBAL_TOAST_ID,
    duration,
    position: 'top-right',
  };

  switch (type) {
    case 'success':
      toast.success(message, options);
      break;
    case 'error':
      toast.error(message, options);
      break;
    case 'loading':
      toast.loading(message, options);
      break;
    default:
      toast(message, options);
      break;
  }
};
