import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  exportAppointmentsToExcelWithWorker,
  exportAppointmentsToPDFWithWorker,
} from '@/lib/exportHelpers';
import { FileText, FileSpreadsheet, HelpCircle } from 'lucide-react';
import Joyride, { Step } from 'react-joyride';
import AppointmentsTourSteps from '@/components/tour/company/AppointmentsTourSteps';
import { motion } from 'framer-motion';
import { useCitasDetallesPorEmpresa } from '@/components/hooks/useCitasDetalles';

const ESTADOS = [
  {
    estado: 'confirmado',
    color: 'bg-blue-500',
    label: 'Confirmado',
    short: 'Con.',
  },
  {
    estado: 'cancelado',
    color: 'bg-red-500',
    label: 'Cancelado',
    short: 'Can.',
  },
  {
    estado: 'completado',
    color: 'bg-green-500',
    label: 'Completado',
    short: 'Comp.',
  },
  {
    estado: 'anulado',
    color: 'bg-yellow-500',
    label: 'Anulado',
    short: 'Anu.',
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Appointments = () => {
  const today = new Date();
  const formatDate = (d: Date) => d.toLocaleDateString('en-CA');
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

  const { appointments, loading } = useCitasDetallesPorEmpresa(
    startDate,
    endDate,
    activeStates
  );
  const steps: Step[] = AppointmentsTourSteps;

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
      appt.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.telefono.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appt.nombre_servicio.toLowerCase().includes(searchTerm.toLowerCase())
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
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">Mis citas</h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      <Joyride
        steps={steps}
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
          if (status === 'finished' || status === 'skipped') setRunTour(false);
        }}
        styles={{ options: { zIndex: 10000 } }}
      />

      {/* Filtros y acciones */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap justify-between gap-4">
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap gap-2 items-center tour-date-filters"
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
            className="flex flex-wrap gap-2 tour-export-buttons"
          >
            <Button
              onClick={() => exportAppointmentsToExcelWithWorker(appointments)}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button
              onClick={() => exportAppointmentsToPDFWithWorker(appointments)}
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </motion.div>
        </div>
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-between items-center gap-4"
        >
          <Input
            type="text"
            placeholder="Buscar por trabajador, servicio o teléfono"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-80 tour-search-input"
          />
          <div className="flex flex-wrap justify-end gap-3 tour-state-filters">
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

      {/* Tabla */}
      {loading ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
        </motion.div>
      ) : currentData.length === 0 ? (
        <motion.p
          variants={itemVariants}
          className="text-center text-gray-500 py-10"
        >
          No se encontraron citas.
        </motion.p>
      ) : (
        <>
          <motion.div
            variants={itemVariants}
            className="w-full overflow-x-auto bg-white rounded-md shadow border tour-appointments-table"
          >
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Trabajador</th>
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
                  <motion.tr
                    key={appt.id_cita}
                    variants={itemVariants}
                    className="border-t hover:bg-gray-50"
                  >
                    <td
                      className="px-4 py-2 whitespace-nowrap max-w-xs truncate"
                      title={appt.nombre_completo}
                    >
                      {appt.nombre_completo || '-'}
                    </td>
                    <td
                      className="px-4 py-2 whitespace-nowrap max-w-xs truncate"
                      title={appt.nombre_servicio}
                    >
                      {appt.nombre_servicio}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {appt.telefono || '-'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap capitalize">
                      <span
                        className={`text-white text-xs font-semibold px-2 py-1 rounded ${getEstadoColor(
                          appt.estado_cita
                        )}`}
                      >
                        {appt.estado_cita}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {appt.fecha_cita}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {appt.hora_cita.slice(0, 5)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {appt.hora_fin.slice(0, 5)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 text-sm tour-pagination"
          >
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
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default Appointments;
