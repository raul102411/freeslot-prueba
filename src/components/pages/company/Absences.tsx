import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';
import Joyride, { Step } from 'react-joyride';
import { motion } from 'framer-motion';
import AbsencesTourSteps from '@/components/tour/company/AbsencesTourSteps';

interface Ausencia {
  id_ausencia: string;
  id_usuario: string;
  id_empresa: string;
  nombre_completo: string;
  email: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_ausencia: string;
  estado_ausencia: string;
}

const PAGE_SIZE = 10;

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Absences = () => {
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rechazoMotivo, setRechazoMotivo] = useState('');
  const [rechazoId, setRechazoId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [runTour, setRunTour] = useState(false);

  const steps: Step[] = AbsencesTourSteps;
  const empresaId = localStorage.getItem('id_empresa');

  useEffect(() => {
    fetchAusencias();
  }, []);

  const fetchAusencias = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vista_ausencias')
      .select('*')
      .eq('id_empresa', empresaId);
    if (error) toast.error('Error al cargar ausencias');
    else setAusencias(data || []);
    setLoading(false);
  };

  const actualizarEstado = async (
    id_ausencia: string,
    estado: 'aprobado' | 'rechazado',
    motivo?: string
  ) => {
    const { data: estadoData, error: estadoError } = await supabase
      .from('estado_ausencia')
      .select('id_estado_ausencia')
      .eq('estado', estado)
      .single();
    if (estadoError || !estadoData) return;
    const updateData: any = {
      id_estado_ausencia: estadoData.id_estado_ausencia,
      fecha_respuesta: new Date(),
    };
    if (estado === 'rechazado' && motivo) updateData.motivo = motivo;
    const { error } = await supabase
      .from('ausencias_solicitadas')
      .update(updateData)
      .eq('id_ausencia', id_ausencia);
    if (error) toast.error('Error al actualizar estado');
    else {
      toast.success(`Ausencia ${estado}`);
      fetchAusencias();
    }
  };

  const formatearFecha = (fecha: string) => {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = d.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  const calcularDiasAusencia = (inicio: string, fin: string) => {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const diffTime = fechaFin.getTime() - fechaInicio.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleAbrirRechazo = (id: string) => {
    setRechazoId(id);
    setRechazoMotivo('');
    setDialogOpen(true);
  };

  const handleConfirmarRechazo = async () => {
    if (!rechazoMotivo.trim()) {
      toast.error('Debes ingresar un motivo.');
      return;
    }
    if (rechazoId)
      await actualizarEstado(rechazoId, 'rechazado', rechazoMotivo.trim());
    setDialogOpen(false);
    setRechazoMotivo('');
    setRechazoId(null);
  };

  const pendientes = ausencias.filter((a) => a.estado_ausencia === 'pendiente');
  const historico = ausencias.filter((a) => a.estado_ausencia !== 'pendiente');
  const filtradoHistorico = historico
    .filter((a) => {
      const texto = filtroTexto.toLowerCase();
      return (
        a.nombre_completo.toLowerCase().includes(texto) ||
        a.email.toLowerCase().includes(texto) ||
        a.tipo_ausencia.toLowerCase().includes(texto)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime()
    );

  const totalPages = Math.ceil(filtradoHistorico.length / PAGE_SIZE);
  const currentData = filtradoHistorico.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800 tour-title">
          Ausencias / Vacaciones
        </h1>
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

      <motion.section
        variants={itemVariants}
        className="tour-pendientes-section"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Ausencias pendientes
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
          </div>
        ) : pendientes.length === 0 ? (
          <p className="text-gray-500">No hay ausencias pendientes.</p>
        ) : (
          <div className="grid gap-4">
            {pendientes.map((a) => (
              <motion.div
                key={a.id_ausencia}
                variants={itemVariants}
                className="border rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-center"
              >
                <div className="space-y-1">
                  <p className="font-medium text-gray-800">
                    {a.nombre_completo}
                  </p>
                  <p className="text-sm text-gray-500">{a.email}</p>
                  <p className="text-sm text-gray-600">
                    {a.tipo_ausencia} | {formatearFecha(a.fecha_inicio)} -{' '}
                    {formatearFecha(a.fecha_fin)}
                  </p>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white tour-aprobar-btn"
                    onClick={() => actualizarEstado(a.id_ausencia, 'aprobado')}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="tour-rechazar-btn"
                    onClick={() => handleAbrirRechazo(a.id_ausencia)}
                  >
                    Rechazar
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.hr
        variants={itemVariants}
        className="my-8 border-t border-gray-200"
      />

      <motion.section
        variants={itemVariants}
        className="tour-historico-section space-y-4"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Historial de ausencias
        </h2>
        <Input
          type="text"
          placeholder="Filtrar por nombre, correo o tipo"
          className="w-full tour-historico-input"
          value={filtroTexto}
          onChange={(e) => {
            setFiltroTexto(e.target.value);
            setPage(1);
          }}
        />

        {currentData.length === 0 ? (
          <p className="text-gray-500">
            No hay ausencias que coincidan con el filtro.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-md shadow border tour-table">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 text-left">Correo</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-left">Fechas</th>
                    <th className="px-4 py-2 text-left">Días de ausencia</th>
                    <th className="px-4 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((a) => (
                    <motion.tr
                      key={a.id_ausencia}
                      variants={itemVariants}
                      className="border-t"
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {a.nombre_completo}
                      </td>
                      <td className="px-4 py-2">{a.email}</td>
                      <td className="px-4 py-2">{a.tipo_ausencia}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatearFecha(a.fecha_inicio)} -{' '}
                        {formatearFecha(a.fecha_fin)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {calcularDiasAusencia(a.fecha_inicio, a.fecha_fin)}
                      </td>
                      <td className="px-4 py-2">
                        {a.estado_ausencia === 'aprobado' ? (
                          <span className="text-green-600 font-medium capitalize">
                            Aprobado
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium capitalize">
                            Rechazado
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-end items-center mt-4 gap-2 text-sm tour-pagination">
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
            )}
          </>
        )}
      </motion.section>

      <motion.div variants={itemVariants} className="tour-rechazo-dialog">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Motivo del rechazo</DialogTitle>
            </DialogHeader>
            <textarea
              className="w-full border px-3 py-2 rounded text-sm mt-2"
              rows={3}
              placeholder="Escribe el motivo del rechazo..."
              value={rechazoMotivo}
              onChange={(e) => setRechazoMotivo(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleConfirmarRechazo}
              >
                Rechazar ausencia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
};

export default Absences;
