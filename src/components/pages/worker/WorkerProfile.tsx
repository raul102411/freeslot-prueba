// src/components/WorkerProfile.tsx

import { useState, useMemo, useCallback } from 'react';
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
import { Clock } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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

const diasSemana = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
];

const normalizarDia = (dia: string) =>
  dia
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const formatearTelefono = (telefono: string) => {
  const limpio = telefono.replace(/\D/g, '');
  return limpio.length === 9
    ? `${limpio.slice(0, 3)} ${limpio.slice(3, 6)} ${limpio.slice(6)}`
    : telefono;
};

const toFechaISO = (fecha: Date) => fecha.toLocaleDateString('sv-SE');

export default function WorkerProfile() {
  const userId = localStorage.getItem('id_usuario') || '';
  const empresaId = localStorage.getItem('id_empresa') || '';

  // Datos maestros
  const { perfil, loading } = useTrabajadorDetalles(userId, empresaId);
  const ausencias = useAusenciasPorUsuario(userId, empresaId);
  const tiposAusencia = useTiposAusencia();
  const estadosAusencia = useEstadosAusencia();
  const diasFestivos = useDiasFestivos(empresaId);
  const diasNoLaborables = useDiasNoLaborablesPorUsuario(userId);
  const servicios = useServiciosPorUsuario(userId, empresaId);
  const rawHorarios = useHorariosPorUsuario(userId, empresaId);

  // UI state
  const [rangoSeleccionado, setRangoSeleccionado] = useState<
    [Date, Date] | null
  >(null);
  const [solicitarAbierto, setSolicitarAbierto] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
  const [serviciosAbierto, setServiciosAbierto] = useState(false);

  // Inicializar tipo seleccionado
  useMemo(() => {
    if (tiposAusencia.length > 0 && !tipoSeleccionado) {
      setTipoSeleccionado(tiposAusencia[0].id_tipo_ausencia);
    }
  }, [tiposAusencia, tipoSeleccionado]);

  // Organizar horarios por día de la semana
  const horarios = useMemo(() => {
    return rawHorarios.reduce<
      Record<string, { hora_inicio: string; hora_fin: string }[]>
    >((acc, h) => {
      const dia = normalizarDia(h.dia_semana);
      if (!acc[dia]) acc[dia] = [];
      acc[dia].push({
        hora_inicio: h.hora_inicio.slice(0, 5),
        hora_fin: h.hora_fin.slice(0, 5),
      });
      return acc;
    }, {});
  }, [rawHorarios]);

  // Validador de rango de fechas
  const esRangoValido = useCallback(
    (inicio: Date, fin: Date) => {
      let current = new Date(inicio);
      while (current <= fin) {
        const fechaStr = toFechaISO(current);
        const esFestivo = diasFestivos.includes(fechaStr);
        const esNoLaboral = diasNoLaborables.includes(fechaStr);
        const hayAusencia = ausencias.some((a) => a.fecha === fechaStr);
        if (esFestivo || esNoLaboral || hayAusencia) return false;
        current.setDate(current.getDate() + 1);
      }
      return true;
    },
    [ausencias, diasFestivos, diasNoLaborables]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
      </div>
    );
  }

  if (!perfil) {
    return <div className="p-6 text-red-600">No se pudo cargar el perfil.</div>;
  }

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Perfil del Trabajador</h1>

      {/* Card: Perfil, Horario y Servicios */}
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-6">
          {/* Datos personales */}
          <div className="flex flex-wrap justify-between items-start gap-6">
            <div className="flex items-center gap-4">
              {perfil.foto ? (
                <img
                  src={perfil.foto}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
                  {perfil.nombre_completo.charAt(0) || '?'}
                </div>
              )}
              <div>
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

            {/* Acciones: Horario y Servicios */}
            <div className="flex flex-col gap-3">
              {/* Horario */}
              {Object.keys(horarios).length > 0 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow">
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
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-300 text-gray-500 rounded-md"
                >
                  <Clock className="w-4 h-4" /> Horario
                </button>
              )}

              {/* Servicios */}
              <Dialog
                open={serviciosAbierto}
                onOpenChange={setServiciosAbierto}
              >
                <DialogTrigger asChild>
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow">
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
            </div>
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-medium text-gray-600">
                Intervalo de cita (min)
              </label>
              <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-800">
                {perfil.intervalo_cita ?? 'No definido'}
              </div>
            </div>
            <div>
              <label className="block font-medium text-gray-600">Estado</label>
              <div
                className={`px-3 py-2 border rounded-md bg-gray-50 font-semibold ${
                  perfil.activo ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {perfil.activo ? 'Activo' : 'Inactivo'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario y solicitud de ausencia */}
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Calendario {new Date().getFullYear()}
          </h2>

          {/* Leyenda */}
          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
            <Legend color="red-100" label="No laborable" />
            <Legend color="gray-200" label="Festivo" />
            <Legend color="purple-200" label="Ausencia aprobada" />
            <Legend color="yellow-100" label="Ausencia pendiente" />
          </div>

          {/* Vista mensual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, idx) => {
              const monthStart = new Date(new Date().getFullYear(), idx, 1);
              return (
                <div
                  key={idx}
                  className="scale-[0.9] origin-top bg-white rounded-xl border border-gray-300 shadow-md p-2"
                >
                  <Calendar
                    value={null}
                    activeStartDate={monthStart}
                    selectRange
                    onChange={(value) => {
                      if (
                        Array.isArray(value) &&
                        value.length === 2 &&
                        value[0] instanceof Date &&
                        value[1] instanceof Date
                      ) {
                        const [inicio, fin] = value;
                        if (!esRangoValido(inicio, fin)) {
                          toast.error('El rango contiene días no disponibles.');
                          return;
                        }
                        setRangoSeleccionado([inicio, fin]);
                        setSolicitarAbierto(true);
                      }
                    }}
                    tileClassName={({ date }) => {
                      const fechaStr = toFechaISO(date);
                      if (diasFestivos.includes(fechaStr))
                        return 'bg-gray-200 text-gray-700';
                      const aus = ausencias.find((a) => a.fecha === fechaStr);
                      if (aus) {
                        return aus.estado === 'pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-200 text-purple-700';
                      }
                      if (diasNoLaborables.includes(fechaStr))
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
                </div>
              );
            })}
          </div>

          {/* Diálogo de solicitud */}
          <Dialog open={solicitarAbierto} onOpenChange={setSolicitarAbierto}>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Solicitar ausencia</DialogTitle>
              </DialogHeader>
              <select
                value={tipoSeleccionado ?? ''}
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
                    <strong>{rangoSeleccionado[0].toLocaleDateString()}</strong>
                  </p>
                  <p>
                    Hasta:{' '}
                    <strong>{rangoSeleccionado[1].toLocaleDateString()}</strong>
                  </p>
                  <button
                    onClick={async () => {
                      const [inicio, fin] = rangoSeleccionado;
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
                      const idEstado = estadoObj?.id_estado_ausencia ?? null;

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
                      if (error) {
                        toast.error('No se pudo enviar la solicitud');
                      } else {
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
    </div>
  );
}

// Auxiliar: leyenda de colores
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-4 bg-${color} border border-gray-400`} />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
