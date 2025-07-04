import { useState, useEffect } from 'react';
import { useDashboard } from '@/components/hooks/useDashboard';
import {
  CalendarDays,
  Users,
  ClipboardList,
  Briefcase,
  HelpCircle,
  Smartphone,
  XCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import Joyride from 'react-joyride';
import { motion } from 'framer-motion';
import DashboardTourSteps from '@/components/tour/company/DashboardTourSteps';

const COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#8B5CF6',
  '#F472B6',
  '#06B6D4',
];

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Dashboard: React.FC = () => {
  const [runTour, setRunTour] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const empresaId = localStorage.getItem('id_empresa') || '';
  const { loading, stats, mostRequestedServices } = useDashboard(empresaId);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );

  return (
    <motion.div
      className="space-y-6 px-4 md:px-8 lg:px-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      <Joyride
        steps={DashboardTourSteps}
        run={runTour}
        continuous
        showSkipButton
        spotlightClicks
        locale={{
          back: 'Atrás',
          close: 'Cerrar',
          last: 'Finalizar',
          next: 'Siguiente',
          skip: 'Saltar',
        }}
        callback={({ status }) => {
          if (['finished', 'skipped'].includes(status)) {
            setRunTour(false);
          }
        }}
        styles={{ options: { zIndex: 10000 } }}
      />

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {[
          {
            title: 'Citas del día',
            value: stats.citasHoy,
            icon: <CalendarDays className="w-6 h-6 text-blue-500" />,
          },
          {
            title: 'Citas del mes',
            value: stats.citasMes,
            icon: <ClipboardList className="w-6 h-6 text-indigo-500" />,
          },
          {
            title: 'Trabajadores disponibles',
            value: stats.trabajadores,
            icon: <Users className="w-6 h-6 text-green-500" />,
          },
          {
            title: 'Servicios disponibles',
            value: stats.serviciosDisponibles,
            icon: <Briefcase className="w-6 h-6 text-purple-500" />,
          },
          {
            title: 'Facturado del mes',
            value: stats.facturadoMes,
            icon: <span className="text-yellow-500 text-xl">€</span>,
          },
          {
            title: 'Tasa de ocupación',
            value: stats.tasaOcupacion,
            icon: <span className="text-cyan-600 text-xl">📊</span>,
          },
          {
            title: 'Clientes únicos del mes',
            value: stats.clientesUnicos,
            icon: <Smartphone className="w-6 h-6 text-pink-500" />,
          },
          {
            title: 'Cancelaciones del mes',
            value: stats.cancelacionesMes,
            icon: <XCircle className="w-6 h-6 text-red-500" />,
          },
        ].map((metric, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="w-full">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">
              Servicios más solicitados del mes
            </h2>
            <div className="w-full h-64 sm:h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mostRequestedServices}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 40 : 50}
                    outerRadius={isMobile ? 60 : 80}
                    paddingAngle={4}
                    label={({ name, percent }) =>
                      isMobile
                        ? `${percent.toFixed(2)}%`
                        : `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {mostRequestedServices.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout={isMobile ? 'horizontal' : 'vertical'}
                    verticalAlign={isMobile ? 'bottom' : 'middle'}
                    align={isMobile ? 'center' : 'right'}
                    wrapperStyle={isMobile ? { bottom: -10 } : {}}
                    formatter={(value) => (
                      <span className="text-gray-700 text-sm">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  className = '',
}) => (
  <Card className={`shadow-md ${className}`}>
    <CardContent className="flex flex-col gap-2 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-xs sm:text-sm font-medium text-gray-500">
          {title}
        </h2>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800">
        {title.includes('Facturado')
          ? `${value.toFixed(2)} €`
          : title.includes('ocupación')
          ? `${value.toFixed(1)} %`
          : value}
      </p>
    </CardContent>
  </Card>
);

export default Dashboard;
