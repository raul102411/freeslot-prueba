import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  exportAppointmentsToExcel,
  exportAppointmentsToPDF,
} from '@/lib/exportHelpers';
import { FileText, FileSpreadsheet } from 'lucide-react';

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

type Appointment = {
  id_cita: string;
  nombre_servicio: string;
  estado_cita: string;
  fecha_cita: string;
  hora_cita: string;
  hora_fin: string;
  tipo_pago: string;
  telefono: string;
  precio: number;
};

const PAGE_SIZE = 15;

const WorkerAppointments = () => {
  const today = new Date();
  const formatDate = (date: Date) => date.toLocaleDateString('en-CA');

  const firstDay = formatDate(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const lastDay = formatDate(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
  );

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [activeStates, setActiveStates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchAppointments = async () => {
    const idUsuario = localStorage.getItem('id_usuario');
    if (!idUsuario) return;

    setLoading(true);

    let query = supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_usuario', idUsuario);

    if (startDate) query = query.gte('fecha_cita', startDate);
    if (endDate) query = query.lte('fecha_cita', endDate);
    if (activeStates.length > 0) query = query.in('estado_cita', activeStates);

    const { data, error } = await query
      .order('fecha_cita', { ascending: false })
      .order('hora_cita', { ascending: false });

    if (!error) setAppointments(data || []);
    setPage(1);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [startDate, endDate, activeStates]);

  const toggleEstado = (estado: string) => {
    setActiveStates((prev) =>
      prev.includes(estado)
        ? prev.filter((e) => e !== estado)
        : [...prev, estado]
    );
  };

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
  const fromItem = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toItem = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Mis citas</h1>

      {/* Filtros y acciones */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap justify-between gap-4">
          {/* Fechas */}
          <div className="flex flex-wrap gap-2 items-center">
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
          </div>

          {/* Exportar */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => exportAppointmentsToExcel(appointments)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
            </Button>
            <Button onClick={() => exportAppointmentsToPDF(appointments)}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
          </div>
        </div>

        {/* Buscador + Leyenda */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Input
            type="text"
            placeholder="Buscar por teléfono, servicio o estado"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80"
          />

          <div className="flex flex-wrap justify-end gap-3">
            {ESTADOS.map((estado) => (
              <label
                key={estado.estado}
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
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando citas...</p>
      ) : currentData.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          No se encontraron citas.
        </p>
      ) : (
        <>
          <div className="w-full overflow-x-auto bg-white rounded-md shadow border">
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

          {/* Paginación */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 text-sm">
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
        </>
      )}
    </div>
  );
};

export default WorkerAppointments;
