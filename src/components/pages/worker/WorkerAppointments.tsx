import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  exportAppointmentsToExcel,
  exportAppointmentsToPDF,
} from '@/lib/exportHelpers';
import { FileText, FileSpreadsheet, HelpCircle } from 'lucide-react';
import Joyride from 'react-joyride';
import WorkerAppointmentsTourSteps from '@/components/tour/worker/WorkerAppointmentsTourSteps';
import { useCitasDetallesPorUsuario } from '@/components/hooks/useCitasDetalles';
import { motion } from 'framer-motion';

const ESTADOS = [
  {
    estado: 'confirmado',
    color: 'bg-blue-500',
    label: 'Confirmado',
    short: 'Conf.',
  },
  {
    estado: 'cancelado',
    color: 'bg-red-500',
    label: 'Cancelado',
    short: 'Canc.',
  },
  {
    estado: 'completado',
    color: 'bg-green-500',
    label: 'Completado',
    short: 'Compl.',
  },
  {
    estado: 'anulado',
    color: 'bg-yellow-500',
    label: 'Anulado',
    short: 'Anul.',
  },
];

const iconosPago: Record<string, string> = {
  tarjeta: '💳',
  efectivo: '💵',
  bizum: '📲',
  otros: '💼',
};

const PAGE_SIZE = 15;

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const WorkerAppointments = () => {
  const idEmpresa = localStorage.getItem('id_empresa');
  const idUsuario = localStorage.getItem('id_usuario');

  const today = new Date();
  const formatDate = (date: Date) => date.toLocaleDateString('en-CA');
  const firstDay = formatDate(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const lastDay = formatDate(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [activeStates, setActiveStates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [runTour, setRunTour] = useState(false);

  const { appointments, loading } = useCitasDetallesPorUsuario(
    idEmpresa,
    idUsuario,
    startDate,
    endDate,
    activeStates
  );

  const toggleEstado = (estado: string) =>
    setActiveStates((prev) =>
      prev.includes(estado)
        ? prev.filter((e) => e !== estado)
        : [...prev, estado]
    );

  const getEstadoColor = (estado: string) =>
    ESTADOS.find((e) => e.estado === estado)?.color || 'bg-gray-400';

  const getIconoPago = (tipo: string) =>
    tipo ? iconosPago[tipo.toLowerCase()] || '❓' : null;

  const filtered = appointments.filter(
    (appt) =>
      appt.nombre_servicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.estado_cita.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const fromItem = filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const toItem = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <motion.div
      className="flex flex-col h-screen space-y-4 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">Mis citas</h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      {/* Tour */}
      <motion.div variants={itemVariants}>
        <Joyride
          steps={WorkerAppointmentsTourSteps}
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
            if (status === 'finished' || status === 'skipped')
              setRunTour(false);
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {/* Filters & Actions */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap justify-between gap-4">
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2 items-center tour-date-range"
          >
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36"
            />
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2 tour-export"
          >
            <Button onClick={() => exportAppointmentsToExcel(appointments)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={() => exportAppointmentsToPDF(appointments)}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </motion.div>
        </div>
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-between items-center gap-4 tour-search-legend"
        >
          <Input
            type="text"
            placeholder="Buscar por teléfono, servicio o estado"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-80"
          />
          <div className="flex flex-wrap justify-end gap-3">
            {ESTADOS.map((estado) => (
              <motion.label
                key={estado.estado}
                variants={itemVariants}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeStates.includes(estado.estado)}
                  onChange={() => toggleEstado(estado.estado)}
                  className="accent-blue-600"
                />
                <span className={`w-4 h-4 rounded-sm ${estado.color}`} />
                <span className="text-sm text-gray-700">
                  <span className="hidden sm:inline">{estado.label}</span>
                  <span className="inline sm:hidden">{estado.short}</span>
                </span>
              </motion.label>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Table */}
      {loading ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
        </motion.div>
      ) : currentData.length === 0 ? (
        <motion.p
          variants={itemVariants}
          className="text-center text-gray-500 py-10"
        >
          No se encontraron citas.
        </motion.p>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="w-full overflow-x-auto bg-white rounded-md shadow border tour-table">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Servicio</th>
                  <th className="px-4 py-2 text-left">Teléfono</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Hora inicio</th>
                  <th className="px-4 py-2 text-left">Hora fin</th>
                  <th className="px-4 py-2 text-left">Tipo de pago</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((appt) => (
                  <tr key={appt.id_cita} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{appt.nombre_servicio}</td>
                    <td className="px-4 py-2">{appt.telefono || '-'}</td>
                    <td className="px-4 py-2 capitalize">
                      <span
                        className={`text-white text-xs font-semibold px-2 py-1 rounded ${getEstadoColor(
                          appt.estado_cita
                        )}`}
                      >
                        {appt.estado_cita}
                      </span>
                    </td>
                    <td className="px-4 py-2">{appt.fecha_cita}</td>
                    <td className="px-4 py-2">{appt.hora_cita.slice(0, 5)}</td>
                    <td className="px-4 py-2">{appt.hora_fin.slice(0, 5)}</td>
                    <td className="px-4 py-2 text-sm">
                      {appt.tipo_pago ? (
                        <span
                          title={appt.tipo_pago}
                          className="flex items-center gap-1"
                        >
                          <span className="text-xl">
                            {getIconoPago(appt.tipo_pago)}
                          </span>
                          {appt.precio != null && (
                            <span className="text-gray-600">
                              - {appt.precio.toFixed(2)} €
                            </span>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 text-sm tour-pagination">
            <span className="text-gray-600">
              Mostrando {fromItem}–{toItem} de {filtered.length}{' '}
              {filtered.length === 1 ? 'resultado' : 'resultados'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default WorkerAppointments;
