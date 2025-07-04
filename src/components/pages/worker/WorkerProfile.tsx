// src/components/WorkerProfile.tsx
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, HelpCircle } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Joyride, { Step } from 'react-joyride';
import WorkerProfileTourSteps from '@/components/tour/worker/WorkerProfileTourSteps';

import { useTrabajadorDetalles } from '@/components/hooks/useTrabajadorDetalles';
import {
  useAusenciasPorUsuario,
  useTiposAusencia,
  useEstadosAusencia,
} from '@/components/hooks/useAusencias';
import { useDiasFestivos } from '@/components/hooks/useDiasFestivos';
import { useDiasNoLaborablesPorUsuario } from '@/components/hooks/useDiasNoLaborables';
import { useServiciosPorUsuario } from '@/components/hooks/useServicios';
import { useHorariosPorUsuario } from '@/components/hooks/useHorarios';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const diasSemana = [
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo',
];
const toFechaISO = (fecha: Date) => fecha.toLocaleDateString('sv-SE');
const formatearTelefono = (t: string) => {
  const n = t.replace(/\D/g, '');
  return n.length === 9 ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : t;
};

export default function WorkerProfile() {
  const [loading, setLoading] = useState(true);
  const [runTour, setRunTour] = useState(false);

  const userId = localStorage.getItem('id_usuario') || '';
  const empresaId = localStorage.getItem('id_empresa') || '';

  const { perfil, loading: ld } = useTrabajadorDetalles(userId, empresaId);
  const ausencias = useAusenciasPorUsuario(userId, empresaId);
  const tiposAusencia = useTiposAusencia();
  const estadosAusencia = useEstadosAusencia();
  const diasFestivos = useDiasFestivos(empresaId);
  const diasNoLaborables = useDiasNoLaborablesPorUsuario(userId, empresaId);
  const servicios = useServiciosPorUsuario(userId, empresaId);
  const rawHorarios = useHorariosPorUsuario(userId, empresaId);

  const [rangoSeleccionado, setRangoSeleccionado] = useState<
    [Date, Date] | null
  >(null);
  const [solicitarAbierto, setSolicitarAbierto] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
  const [serviciosAbierto, setServiciosAbierto] = useState(false);

  useMemo(() => {
    if (tiposAusencia.length > 0 && !tipoSeleccionado) {
      setTipoSeleccionado(tiposAusencia[0].id_tipo_ausencia);
    }
  }, [tiposAusencia, tipoSeleccionado]);

  const horarios = useMemo(() => {
    return rawHorarios.reduce<
      Record<string, { hora_inicio: string; hora_fin: string }[]>
    >((acc, h) => {
      const d = h.dia_semana.toLowerCase();
      acc[d] = acc[d] || [];
      acc[d].push({
        hora_inicio: h.hora_inicio.slice(0, 5),
        hora_fin: h.hora_fin.slice(0, 5),
      });
      return acc;
    }, {});
  }, [rawHorarios]);

  const esRangoValido = useCallback(
    (inicio: Date, fin: Date) => {
      let cur = new Date(inicio);
      while (cur <= fin) {
        const s = toFechaISO(cur);
        if (
          diasFestivos.includes(s) ||
          diasNoLaborables.includes(s) ||
          ausencias.some((a) => a.fecha === s)
        )
          return false;
        cur.setDate(cur.getDate() + 1);
      }
      return true;
    },
    [ausencias, diasFestivos, diasNoLaborables]
  );

  useEffect(() => setLoading(ld), [ld]);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 rounded-full" />
      </div>
    );
  }
  if (!perfil) {
    return <div className="p-6 text-red-600">No se pudo cargar el perfil.</div>;
  }

  const steps: Step[] = WorkerProfileTourSteps;

  return (
    <motion.div
      className="space-y-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">Perfil del Trabajador</h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      {/* Tour */}
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
            if (status === 'finished' || status === 'skipped')
              setRunTour(false);
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {/* Datos y foto */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap justify-between items-start gap-6">
              <div className="flex items-center gap-4">
                {perfil.foto ? (
                  <img
                    src={perfil.foto}
                    alt="Foto"
                    className="w-20 h-20 rounded-full object-cover border tour-foto"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold tour-foto">
                    {perfil.nombre_completo.charAt(0) || '?'}
                  </div>
                )}
                <div className="tour-contacto">
                  <p className="text-lg font-semibold text-gray-800">
                    {perfil.nombre_completo}
                  </p>
                  {perfil.email && (
                    <p className="text-sm text-gray-500">
                      📧{' '}
                      <a
                        href={`mailto:${perfil.email}`}
                        className="hover:underline text-blue-600"
                      >
                        {perfil.email}
                      </a>
                    </p>
                  )}
                  {perfil.telefono && (
                    <p className="text-sm text-gray-500">
                      📞{' '}
                      <a
                        href={`tel:${perfil.telefono}`}
                        className="hover:underline text-blue-600"
                      >
                        {formatearTelefono(perfil.telefono)}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* Botones horario y servicios */}
              <div className="flex flex-col gap-3">
                {/* Horario */}
                <motion.div variants={itemVariants}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md tour-horario-btn">
                        <Clock className="w-4 h-4" /> Horario
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[90vw] sm:max-w-xl max-h-[90vh] overflow-y-auto mx-auto p-4 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Horario semanal</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                        {diasSemana.map((dia) => {
                          const franjas = horarios[dia];
                          if (!franjas) return null;
                          return (
                            <div key={dia}>
                              <label className="block font-medium text-gray-600 capitalize mb-1">
                                {dia}
                              </label>
                              {franjas.map((f, i) => (
                                <div
                                  key={i}
                                  className="px-3 py-2 border rounded-md bg-gray-50 text-gray-800 mb-1"
                                >
                                  {f.hora_inicio} – {f.hora_fin}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>

                {/* Servicios */}
                <motion.div variants={itemVariants}>
                  <Dialog
                    open={serviciosAbierto}
                    onOpenChange={setServiciosAbierto}
                  >
                    <DialogTrigger asChild>
                      <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md tour-servicios-btn">
                        🛠️ Servicios
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-auto p-4 rounded-2xl">
                      <DialogHeader>
                        <DialogTitle>Servicios asignados</DialogTitle>
                      </DialogHeader>
                      {servicios.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {servicios.map((s) => (
                            <div
                              key={s.id_servicio}
                              className="border rounded-md p-3 bg-gray-50"
                            >
                              <p className="font-semibold text-gray-800">
                                {s.nombre_servicio}
                              </p>
                              <p className="text-gray-600">💶 {s.precio} €</p>
                              <p className="text-gray-600">
                                🕒 {s.duracion_minutos} min
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 mt-4">
                          No tienes servicios asignados.
                        </p>
                      )}
                    </DialogContent>
                  </Dialog>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendario anual */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800 tour-calendario-title">
              Calendario {new Date().getFullYear()}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
              <Legend color="red-100" label="No laborable" />
              <Legend color="gray-200" label="Festivo" />
              <Legend color="purple-200" label="Ausencia aprobada" />
              <Legend color="yellow-100" label="Ausencia pendiente" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, idx) => {
                const monthStart = new Date(new Date().getFullYear(), idx, 1);
                return (
                  <motion.div
                    variants={itemVariants}
                    key={idx}
                    className="scale-[0.9] origin-top bg-white rounded-xl border border-gray-300 shadow-md p-2"
                  >
                    <Calendar
                      value={null}
                      activeStartDate={monthStart}
                      selectRange
                      onChange={(value) => {
                        if (Array.isArray(value) && value.length === 2) {
                          const [inicio, fin] = value as [Date, Date];
                          if (!esRangoValido(inicio, fin)) {
                            toast.error(
                              'El rango contiene días no disponibles.'
                            );
                            return;
                          }
                          setRangoSeleccionado([inicio, fin]);
                          setSolicitarAbierto(true);
                        }
                      }}
                      tileClassName={({ date }) => {
                        const s = toFechaISO(date);
                        if (diasFestivos.includes(s))
                          return 'bg-gray-200 text-gray-700';
                        const a = ausencias.find((a) => a.fecha === s);
                        if (a)
                          return a.estado === 'pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-purple-200 text-purple-700';
                        if (diasNoLaborables.includes(s))
                          return 'bg-red-100 text-red-700';
                        return '';
                      }}
                      showNeighboringMonth={false}
                      prevLabel={null}
                      nextLabel={null}
                      prev2Label={null}
                      next2Label={null}
                      minDetail="month"
                      maxDetail="month"
                    />
                  </motion.div>
                );
              })}
            </div>

            {/* Solicitar ausencia */}
            <Dialog open={solicitarAbierto} onOpenChange={setSolicitarAbierto}>
              <DialogContent className="max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle>Solicitar ausencia</DialogTitle>
                </DialogHeader>
                <select
                  value={tipoSeleccionado || ''}
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 text-sm"
                >
                  {tiposAusencia.map((t) => (
                    <option key={t.id_tipo_ausencia} value={t.id_tipo_ausencia}>
                      {t.tipo}
                    </option>
                  ))}
                </select>
                {rangoSeleccionado && (
                  <div className="space-y-2 text-sm">
                    <p>
                      Desde:{' '}
                      <strong>
                        {rangoSeleccionado[0].toLocaleDateString()}
                      </strong>
                    </p>
                    <p>
                      Hasta:{' '}
                      <strong>
                        {rangoSeleccionado[1].toLocaleDateString()}
                      </strong>
                    </p>
                    <button
                      onClick={async () => {
                        const [inicio, fin] = rangoSeleccionado!;
                        const tipoObj = tiposAusencia.find(
                          (t) => t.id_tipo_ausencia === tipoSeleccionado
                        );
                        const estadoName =
                          tipoObj?.tipo.toLowerCase() === 'enfermedad'
                            ? 'aprobado'
                            : 'pendiente';
                        const estadoObj = estadosAusencia.find(
                          (e) => e.estado === estadoName
                        );
                        const idEstado = estadoObj?.id_estado_ausencia || null;
                        const { error } = await supabase
                          .from('ausencias_solicitadas')
                          .insert({
                            id_usuario: userId,
                            id_empresa: empresaId,
                            id_tipo_ausencia: tipoSeleccionado,
                            id_estado_ausencia: idEstado,
                            fecha_inicio: toFechaISO(inicio),
                            fecha_fin: toFechaISO(fin),
                            usuario_creacion: userId,
                          });
                        if (error)
                          toast.error('No se pudo enviar la solicitud');
                        else {
                          toast.success('Solicitud enviada');
                          setSolicitarAbierto(false);
                        }
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-medium"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        style={{ backgroundColor: color }}
        className="w-4 h-4 border border-gray-400"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
