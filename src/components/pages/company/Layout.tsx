// src/components/pages/layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useNotifications } from '@/components/hooks/useNotifications';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.1, when: 'beforeChildren' },
  },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Layout = () => {
  // Hook que gestiona notificaciones en tiempo real
  useNotifications();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fijo */}
      <Sidebar />

      {/* Contenido principal animado */}
      <motion.main
        className="flex-1 w-full max-w-full overflow-x-hidden px-4 py-4 sm:px-6 md:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Outlet />
        </motion.div>
      </motion.main>
    </div>
  );
};

export default Layout;
