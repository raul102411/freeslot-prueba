import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  Clock,
  Briefcase,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const DashboardWorker = () => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    citasHoy: 0,
    citasPendientes: 0,
    servicios: 0,
    notificaciones: 0,
  });

  const [proximaCita, setProximaCita] = useState<any[]>([]);
  const [noLaborableHoy, setNoLaborableHoy] = useState<boolean>(false);

  const empresaId = localStorage.getItem('id_empresa') || '';
  const userId = localStorage.getItem('id_usuario') || '';

  const fetchStats = async () => {
    if (!empresaId || !userId) return;

    setLoading(true);
    try {
      const today = new Date();

      const weekday = today.toLocaleDateString('es-ES', {
        weekday: 'long',
      });

      const diaSemana = weekday
        ? weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase()
        : '';

      // Citas hoy
      const { data: hoy } = await supabase
        .from('vista_citas_trabajador_hoy')
        .select('total')
        .eq('id_empresa', empresaId)
        .eq('id_usuario', userId)
        .maybeSingle();

      // Citas pendientes
      const { data: pendientes } = await supabase
        .from('vista_citas_trabajador_pendientes')
        .select('total')
        .eq('id_empresa', empresaId)
        .eq('id_usuario', userId)
        .maybeSingle();

      // Servicios
      const { data: servicios } = await supabase
        .from('vista_servicios_trabajador')
        .select('total')
        .eq('id_empresa', empresaId)
        .eq('id_usuario', userId)
        .maybeSingle();

      // Notificaciones no leídas
      const { data: notis } = await supabase
        .from('vista_notificaciones_pendientes')
        .select('id_notificacion')
        .eq('id_usuario', userId);

      // Próxima cita
      const { data: proximas } = await supabase
        .from('vista_proxima_cita_trabajador')
        .select('*')
        .eq('id_usuario', userId)
        .eq('id_empresa', empresaId)
        .limit(5);

      setProximaCita(proximas ?? []);

      // Día no laborable (si no hay horarios asignados hoy)
      const { data: horarioHoy } = await supabase
        .from('vista_horario_trabajador')
        .select('*')
        .eq('id_usuario', userId)
        .eq('dia_semana', diaSemana)
        .eq('id_empresa', empresaId);

      setNoLaborableHoy((horarioHoy?.length ?? 0) === 0);

      setStats({
        citasHoy: hoy?.total || 0,
        citasPendientes: pendientes?.total || 0,
        servicios: servicios?.total || 0,
        notificaciones: notis?.length || 0,
      });
    } catch (error) {
      console.error('Error al obtener estadísticas del trabajador:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return new Date(dateStr).toLocaleDateString('es-ES', options);
  };

  const formatTime = (timeStr: string) => {
    return timeStr?.slice(0, 5); // HH:MM
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 60s
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {noLaborableHoy && (
        <div className="flex items-center gap-3 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <AlertTriangle className="w-5 h-5" />
          <p>Hoy no tienes horario asignado. Día no laborable.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Citas para hoy"
          value={stats.citasHoy}
          icon={<CalendarDays className="w-6 h-6 text-blue-500" />}
        />
        <MetricCard
          title="Citas pendientes"
          value={stats.citasPendientes}
          icon={<Clock className="w-6 h-6 text-orange-500" />}
        />
        <MetricCard
          title="Servicios asignados"
          value={stats.servicios}
          icon={<Briefcase className="w-6 h-6 text-green-500" />}
        />
        <MetricCard
          title="Notificaciones"
          value={stats.notificaciones}
          icon={<Bell className="w-6 h-6 text-red-500" />}
        />
      </div>
      {/* Próximas citas: se reorganiza para móviles */}
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold mb-2">Próximas citas</h2>
        {proximaCita.map((cita) => (
          <div
            key={cita.id_cita}
            className={`bg-gradient-to-r to-white border p-4 rounded-xl shadow-sm flex flex-col sm:flex-col md:flex-row md:items-center md:justify-between gap-4 ${getContainerStyle(
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
                  {formatDate(cita.fecha_cita)}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">Hora</p>
                <p className="text-base font-medium text-gray-800">
                  {formatTime(cita.hora_cita)}
                </p>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-500">Hora fin</p>
                <p className="text-base font-medium text-gray-800">
                  {formatTime(cita.hora_fin)}
                </p>
              </div>
            </div>

            {cita.estado_cita && (
              <div
                className={`self-start md:self-center px-4 py-1 text-sm font-semibold rounded-full border ${getEstadoStyles(
                  cita.estado_cita
                )}`}
              >
                {cita.estado_cita.toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card className="shadow-md">
    <CardContent className="flex flex-col gap-2 p-6">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </CardContent>
  </Card>
);

export default DashboardWorker;
