// src/components/pages/layout/SidebarWorker.tsx

import { useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
  LogOut,
  Home,
  Calendar,
  Building,
  ScanLine,
  Shield,
  ClipboardList,
  Menu,
  X,
  Users as UsersIcon,
} from 'lucide-react';
import { memo, useState } from 'react';
import { useEmpresa } from '@/components/hooks/useEmpresa';
import { useProfiles } from '@/components/hooks/useProfiles';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
};

const SidebarWorker = () => {
  const navigate = useNavigate();
  const empresaId = localStorage.getItem('id_empresa') || undefined;
  const { empresa, loadingEmpresa } = useEmpresa(empresaId);
  const { perfiles, loading: loadingProfiles } = useProfiles();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  const handleChangeProfile = () => {
    navigate('/profiles');
    setMobileOpen(false);
  };

  const navItems = [
    {
      to: '/panel-trabajador',
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard',
      end: true,
    },
    {
      to: '/panel-trabajador/workerProfile',
      icon: <Building className="w-5 h-5" />,
      label: 'Perfil',
    },
    {
      to: '/panel-trabajador/WorkerCalendar',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Calendario',
    },
    {
      to: '/panel-trabajador/WorkerAppointments',
      icon: <ClipboardList className="w-5 h-5" />,
      label: 'Mis citas',
    },
    {
      to: '/panel-trabajador/displayQR',
      icon: <ScanLine className="w-5 h-5" />,
      label: 'Generar QR',
    },
    {
      to: '/panel-trabajador/WorkerBlacklist',
      icon: <Shield className="w-5 h-5" />,
      label: 'Lista negra',
    },
  ];

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-full md:w-64 z-50
          bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-700
          transform transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:static md:flex md:flex-col md:min-h-screen
        `}
      >
        <motion.div
          className="flex flex-col h-full p-6"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Close btn mobile */}
          <motion.div
            variants={itemVariants}
            className="flex justify-end md:hidden mb-4"
          >
            <button onClick={() => setMobileOpen(false)}>
              <X size={24} className="text-gray-700 dark:text-white" />
            </button>
          </motion.div>

          {/* Logo + name */}
          <motion.div
            variants={itemVariants}
            onClick={() => {
              navigate('/panel-trabajador');
              setMobileOpen(false);
            }}
            className="flex flex-col items-center mb-8 cursor-pointer group"
          >
            {loadingEmpresa ? (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : empresa?.logo ? (
              <img
                src={empresa.logo}
                alt="Logo empresa"
                className="w-12 h-12 object-contain rounded-full transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full dark:bg-gray-700" />
            )}
            <span className="mt-2 text-sm font-normal text-gray-800 dark:text-gray-100 text-center truncate w-full">
              {empresa?.empresa || ''}
            </span>
          </motion.div>

          {/* Nav items */}
          <nav className="flex flex-col gap-2 text-sm">
            {navItems.map((item) => (
              <motion.div key={item.to} variants={itemVariants}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm font-normal ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-gray-800 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800'
                    }`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Footer */}
          <motion.div
            variants={itemVariants}
            className="mt-auto pt-6 border-t dark:border-gray-700 flex flex-col gap-2"
          >
            {!loadingProfiles && perfiles.length > 1 && (
              <button
                onClick={handleChangeProfile}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm px-2 py-2"
              >
                <UsersIcon className="w-5 h-5" />
                <span className="text-sm font-normal">Cambiar de perfil</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm px-2 py-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-normal">Cerrar sesión</span>
            </button>
          </motion.div>
        </motion.div>
      </aside>
    </>
  );
};

export default memo(SidebarWorker);
