// src/components/pages/layout/LayoutWorker.tsx
import { Outlet } from 'react-router-dom';
import SidebarWorker from './SidebarWorker';
import { useNotifications } from '@/components/hooks/useNotifications';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

const LayoutWorker = () => {
  // Hook que gestiona notificaciones en tiempo real y muestra toasts
  useNotifications();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarWorker />
      <motion.main
        className="flex-1 w-full max-w-full overflow-x-hidden px-4 py-4 sm:px-6 md:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default LayoutWorker;
