import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Users, ClipboardList, Briefcase } from 'lucide-react';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  const [mostRequestedServices, setMostRequestedServices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    citasHoy: 0,
    citasMes: 0,
    trabajadores: 0,
    serviciosDisponibles: 0,
  });

  const empresaId = localStorage.getItem('id_empresa') || '';

  const fetchStats = async () => {
    if (!empresaId) return;

    try {
      const { data: citasHoy } = await supabase
        .from('vista_citas_dia')
        .select('total')
        .eq('id_empresa', empresaId)
        .maybeSingle();

      const { data: citasMes } = await supabase
        .from('vista_citas_mes')
        .select('total')
        .eq('id_empresa', empresaId)
        .maybeSingle();

      const { data: trabajadores } = await supabase
        .from('vista_trabajadores_disponibles')
        .select('total')
        .eq('id_empresa', empresaId)
        .maybeSingle();

      const { data: serviciosDisponibles } = await supabase
        .from('vista_servicios_disponibles')
        .select('total')
        .eq('id_empresa', empresaId)
        .maybeSingle();

      setStats({
        citasHoy: citasHoy?.total || 0,
        citasMes: citasMes?.total || 0,
        trabajadores: trabajadores?.total || 0,
        serviciosDisponibles: serviciosDisponibles?.total || 0,
      });
    } catch (error) {
      console.error('Error al cargar métricas:', error);
    }
  };

  const fetchTopServices = async () => {
    if (!empresaId) return;

    try {
      const { data } = await supabase
        .from('vista_servicios_mas_solicitados_mes')
        .select('nombre, total')
        .eq('id_empresa', empresaId);

      const formated =
        data?.map((item: any) => ({
          name: item.nombre,
          total: item.total,
        })) || [];

      setMostRequestedServices(formated);
    } catch (error) {
      console.error('Error al cargar servicios más solicitados:', error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTopServices()]);
      setLoading(false);
    };

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Citas del día"
          value={stats.citasHoy}
          icon={<CalendarDays className="w-6 h-6 text-blue-500" />}
        />
        <MetricCard
          title="Citas del mes"
          value={stats.citasMes}
          icon={<ClipboardList className="w-6 h-6 text-indigo-500" />}
        />
        <MetricCard
          title="Trabajadores disponibles"
          value={stats.trabajadores}
          icon={<Users className="w-6 h-6 text-green-500" />}
        />
        <MetricCard
          title="Servicios disponibles"
          value={stats.serviciosDisponibles}
          icon={<Briefcase className="w-6 h-6 text-purple-500" />}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Servicios más solicitados del mes
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              layout="vertical"
              data={mostRequestedServices}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={160} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="total" position="right" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

type MetricCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
};

const MetricCard = ({ title, value, icon }: MetricCardProps) => (
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

export default Dashboard;
