// src/components/pages/worker/DashboardWorker.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  Clock,
  Briefcase,
  Bell,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import Joyride, { Step } from 'react-joyride';
import DashboardWorkerTourSteps from '@/components/tour/worker/DashboardWorkerTourSteps';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DashboardWorker = () => {
  const [loading, setLoading] = useState(true);
  const [runTour, setRunTour] = useState(false);
  const [stats, setStats] = useState({
    citasHoy: 0,
    citasPendientes: 0,
    servicios: 0,
    notificaciones: 0,
  });
  const [proximaCita, setProximaCita] = useState<any[]>([]);
  const [noLaborableHoy, setNoLaborableHoy] = useState(false);

  const empresaId = localStorage.getItem('id_empresa') || '';
  const userId = localStorage.getItem('id_usuario') || '';

  const fetchStats = async () => {
    if (!empresaId || !userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const today = new Date();
      const weekday = today
        .toLocaleDateString('es-ES', { weekday: 'long' })
        .replace(/^./, (c) => c.toUpperCase());
      const [
        { data: hoy },
        { data: pendientes },
        { data: servicios },
        { data: notis },
        { data: proximas },
        { data: horarioHoy },
      ] = await Promise.all([
        supabase
          .from('vista_citas_trabajador_hoy')
          .select('total')
          .eq('id_empresa', empresaId)
          .eq('id_usuario', userId)
          .maybeSingle(),
        supabase
          .from('vista_citas_trabajador_pendientes')
          .select('total')
          .eq('id_empresa', empresaId)
          .eq('id_usuario', userId)
          .maybeSingle(),
        supabase
          .from('vista_servicios_trabajador')
          .select('total')
          .eq('id_empresa', empresaId)
          .eq('id_usuario', userId)
          .maybeSingle(),
        supabase
          .from('vista_notificaciones_pendientes')
          .select('id_notificacion')
          .eq('id_usuario', userId),
        supabase
          .from('vista_proxima_cita_trabajador')
          .select('*')
          .eq('id_usuario', userId)
          .eq('id_empresa', empresaId)
          .limit(5),
        supabase
          .from('vista_horario_trabajador')
          .select('*')
          .eq('id_usuario', userId)
          .eq('dia_semana', weekday)
          .eq('id_empresa', empresaId),
      ]);

      setStats({
        citasHoy: hoy?.total || 0,
        citasPendientes: pendientes?.total || 0,
        servicios: servicios?.total || 0,
        notificaciones: notis?.length || 0,
      });
      setProximaCita(proximas || []);
      setNoLaborableHoy((horarioHoy?.length || 0) === 0);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const steps: Step[] = DashboardWorkerTourSteps.filter(
    (step) => !(step.target === '.tour-alert' && !noLaborableHoy)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">Dashboard</h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Joyride
          steps={steps}
          run={runTour}
          continuous
          showSkipButton
          spotlightClicks
          disableOverlayClose={false}
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            skip: 'Saltar',
          }}
          callback={({ status }) => {
            if (status === 'finished' || status === 'skipped') {
              setRunTour(false);
            }
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {noLaborableHoy && (
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 p-4 bg-yellow-100 text-yellow-800 rounded-md tour-alert"
        >
          <AlertTriangle className="w-5 h-5" />
          <p>Hoy no tienes horario asignado. Día no laborable.</p>
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          className="tour-metric-citasHoy"
          title="Citas para hoy"
          value={stats.citasHoy}
          icon={<CalendarDays className="w-6 h-6 text-blue-500" />}
        />
        <MetricCard
          className="tour-metric-citasPendientes"
          title="Citas pendientes"
          value={stats.citasPendientes}
          icon={<Clock className="w-6 h-6 text-orange-500" />}
        />
        <MetricCard
          className="tour-metric-servicios"
          title="Servicios asignados"
          value={stats.servicios}
          icon={<Briefcase className="w-6 h-6 text-green-500" />}
        />
        <MetricCard
          className="tour-metric-notificaciones"
          title="Notificaciones"
          value={stats.notificaciones}
          icon={<Bell className="w-6 h-6 text-red-500" />}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold mb-2 tour-upcoming-title">
          Próximas citas
        </h2>
        {proximaCita.map((cita) => (
          <motion.div
            key={cita.id_cita}
            variants={itemVariants}
            className={`bg-gradient-to-r to-white border p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${getContainerStyle(
              cita.estado_cita
            )}`}
          >
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Servicio</p>
              <p className="text-base font-medium text-blue-700">
                {cita.nombre_servicio}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="text-base font-medium text-gray-800">
                {cita.telefono || 'No disponible'}
              </p>
            </div>
            <div className="flex flex-wrap justify-between gap-4 md:gap-8">
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">Fecha</p>
                <p className="text-base font-medium text-gray-800">
                  {new Date(cita.fecha_cita).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">Hora</p>
                <p className="text-base font-medium text-gray-800">
                  {cita.hora_cita.slice(0, 5)}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">Hora fin</p>
                <p className="text-base font-medium text-gray-800">
                  {cita.hora_fin.slice(0, 5)}
                </p>
              </div>
            </div>
            {cita.estado_cita && (
              <motion.div
                variants={itemVariants}
                className={`self-start md:self-center px-4 py-1 text-sm font-semibold rounded-full border ${getEstadoStyles(
                  cita.estado_cita
                )}`}
              >
                {cita.estado_cita.toUpperCase()}
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

const getEstadoStyles = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'completado':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'confirmado':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'pendiente':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'cancelado':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

const getContainerStyle = (estado: string) => {
  switch (estado.toLowerCase()) {
    case 'completado':
      return 'from-green-50 border-green-200';
    case 'confirmado':
      return 'from-blue-50 border-blue-200';
    case 'pendiente':
      return 'from-gray-50 border-gray-200';
    case 'cancelado':
      return 'from-red-50 border-red-200';
    default:
      return 'from-gray-50 border-gray-200';
  }
};

const MetricCard = ({
  className = '',
  title,
  value,
  icon,
}: {
  className?: string;
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <motion.div variants={itemVariants}>
    <Card className={`shadow-md ${className}`}>
      <CardContent className="flex flex-col gap-2 p-6">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-sm font-medium text-gray-500">{title}</h2>
        </div>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default DashboardWorker;
