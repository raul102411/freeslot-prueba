import { toast as sonnerToast, Toaster } from 'sonner';

export const useToast = () => {
  const toast = (options: any) => {
    sonnerToast(options);
  };

  return {
    toast,
    Toaster,
  };
};
