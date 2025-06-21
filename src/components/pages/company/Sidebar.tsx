import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
  LogOut,
  Home,
  Box,
  Users,
  Calendar,
  Building,
  ScanLine,
  Shield,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useEffect, useState, memo } from 'react';

const Sidebar = () => {
  const navigate = useNavigate();
  const [logo, setLogo] = useState<string | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const empresaId = localStorage.getItem('id_empresa');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  const fetchEmpresaInfo = async () => {
    if (!empresaId) return;
    const { data, error } = await supabase
      .from('vista_empresa_detalle')
      .select('logo, empresa')
      .eq('id_empresa', empresaId)
      .single();

    if (!error && data) {
      setLogo(data.logo);
      setEmpresaNombre(data.empresa);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmpresaInfo();
  }, []);

  const navItems = [
    {
      to: '/panel-empresa',
      icon: <Home className="w-5 h-5" />,
      label: 'Dashboard',
      end: true,
    },
    {
      to: '/panel-empresa/companyProfile',
      icon: <Building className="w-5 h-5" />,
      label: 'Empresa',
    },
    {
      to: '/panel-empresa/services',
      icon: <Box className="w-5 h-5" />,
      label: 'Servicios',
    },
    {
      to: '/panel-empresa/workers',
      icon: <Users className="w-5 h-5" />,
      label: 'Trabajadores',
    },
    {
      to: '/panel-empresa/calendar',
      icon: <Calendar className="w-5 h-5" />,
      label: 'Calendario',
    },
    {
      to: '/panel-empresa/appointments',
      icon: <ClipboardList className="w-5 h-5" />,
      label: 'Citas',
    },
    {
      to: '/panel-empresa/generate-qr',
      icon: <ScanLine className="w-5 h-5" />,
      label: 'Generar QR',
    },
    {
      to: '/panel-empresa/blacklist',
      icon: <Shield className="w-5 h-5" />,
      label: 'Lista negra',
    },
  ];

  return (
    <>
      {/* Botón hamburguesa en móvil */}
      <button
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 shadow md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={20} />
      </button>

      {/* Overlay móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`z-50 bg-white dark:bg-gray-900 shadow-lg border-r dark:border-gray-700
        fixed top-0 left-0 h-screen w-full md:w-64 transform transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:flex md:flex-col md:min-h-screen`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Cierre móvil */}
          <div className="flex justify-end md:hidden mb-4">
            <button onClick={() => setMobileOpen(false)}>
              <X size={24} className="text-gray-700 dark:text-white" />
            </button>
          </div>

          {/* Logo y empresa */}
          <div
            onClick={() => {
              navigate('/panel-empresa');
              setMobileOpen(false);
            }}
            className="flex flex-col items-center mb-8 cursor-pointer group"
          >
            {loading ? (
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            ) : logo ? (
              <img
                src={logo}
                alt="Logo empresa"
                className="w-12 h-12 object-contain rounded-full transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full dark:bg-gray-700" />
            )}
            <span className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-100 text-center truncate w-full">
              {empresaNombre}
            </span>
          </div>

          {/* Navegación */}
          <nav className="flex flex-col gap-2 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition font-medium
                  ${
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
            ))}
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-6 border-t dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm px-2 py-2"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default memo(Sidebar);
