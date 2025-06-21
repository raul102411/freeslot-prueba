import { useEffect, useState } from 'react';
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
import 'react-calendar/dist/Calendar.css'; // opcional, si no tienes estilos

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

const WorkerProfile = () => {
  const [perfil, setPerfil] = useState<any>(null);
  const [horarios, setHorarios] = useState<
    Record<string, { hora_inicio: string; hora_fin: string }[]>
  >({});

  const [diasNoLaborables, setDiasNoLaborables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [diasFestivos, setDiasFestivos] = useState<string[]>([]);
  const [ausencias, setAusencias] = useState<
    { fecha: string; estado: string }[]
  >([]);
  const [rangoSeleccionado, setRangoSeleccionado] = useState<
    [Date, Date] | null
  >(null);
  const [solicitarAbierto, setSolicitarAbierto] = useState(false);
  const [tiposAusencia, setTiposAusencia] = useState<
    { id_tipo_ausencia: string; tipo: string }[]
  >([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string | null>(null);
  const [servicios, setServicios] = useState<any[]>([]);
  const [serviciosAbierto, setServiciosAbierto] = useState(false);

  const userId = localStorage.getItem('id_usuario');
  const empresaId = localStorage.getItem('id_empresa');

  useEffect(() => {
    if (userId && empresaId) {
      Promise.all([
        fetchPerfil(),
        fetchHorarios(),
        fetchDiasNoLaborables(),
        fetchDiasFestivos(),
        fetchAusencias(),
        fetchTiposAusencia(),
      ]).finally(() => setLoading(false));
    }
  }, [userId, empresaId]);

  const fetchPerfil = async () => {
    const { data, error } = await supabase
      .from('vista_trabajadores_detalles')
      .select('*')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId)
      .maybeSingle();

    if (error || !data) {
      toast.error('Error al cargar el perfil del trabajador');
      return;
    }

    setPerfil(data);
  };

  const fetchHorarios = async () => {
    const { data, error } = await supabase
      .from('vista_horario_trabajador')
      .select('*')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar los horarios');
      return;
    }

    const agrupados: Record<
      string,
      { hora_inicio: string; hora_fin: string }[]
    > = {};

    data.forEach((h) => {
      const dia = normalizarDia(h.dia_semana);
      if (!agrupados[dia]) agrupados[dia] = [];
      agrupados[dia].push({
        hora_inicio: h.hora_inicio?.slice(0, 5) || '',
        hora_fin: h.hora_fin?.slice(0, 5) || '',
      });
    });

    setHorarios(agrupados);
  };

  const fetchServicios = async () => {
    const { data, error } = await supabase
      .from('vista_cb_servicios')
      .select('*')
      .eq('id_usuario', userId);

    if (error) {
      toast.error('Error al cargar los servicios');
      return;
    }

    setServicios(data);
  };

  const fetchDiasNoLaborables = async () => {
    const year = new Date().getFullYear();
    const fechaInicio = `${year}-01-01`;
    const fechaFin = `${year}-12-31`;

    const { data, error } = await supabase.rpc('obtener_dias_no_laborables', {
      p_id_usuario: userId,
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin,
    });

    if (error) {
      toast.error('Error al cargar los días no laborables');
      console.error('Error RPC:', error);
      return;
    }

    const fechasNoLaborables = Array.isArray(data)
      ? data.map((item) => item.fecha)
      : [];

    setDiasNoLaborables(fechasNoLaborables);
  };

  const fetchDiasFestivos = async () => {
    const { data, error } = await supabase
      .from('vista_dias_festivos')
      .select('fecha')
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar los días festivos');
      return;
    }

    const fechas = data.map((f) => f.fecha); // formato: 'YYYY-MM-DD'
    setDiasFestivos(fechas);
  };

  const fetchAusencias = async () => {
    const { data, error } = await supabase
      .from('vista_ausencias')
      .select('fecha_inicio, fecha_fin, estado_ausencia')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar las ausencias');
      return;
    }

    const fechas: { fecha: string; estado: string }[] = [];

    data.forEach((a) => {
      const inicio = new Date(a.fecha_inicio);
      const fin = new Date(a.fecha_fin);
      for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().split('T')[0];
        fechas.push({ fecha: fechaStr, estado: a.estado_ausencia });
      }
    });

    setAusencias(fechas);
  };

  const fetchTiposAusencia = async () => {
    const { data, error } = await supabase
      .from('vista_tipo_ausencia')
      .select('id_tipo_ausencia, tipo');

    if (error) {
      toast.error('Error al cargar los tipos de ausencia');
      return;
    }

    setTiposAusencia(data);
    if (data.length > 0) {
      setTipoSeleccionado(data[0].id_tipo_ausencia); // selecciona el primero por defecto
    }
  };

  const toFechaISO = (fecha: Date) => fecha.toLocaleDateString('sv-SE');

  const esRangoValido = (inicio: Date, fin: Date) => {
    const current = new Date(inicio.getTime());

    while (current <= fin) {
      const fechaStr = toFechaISO(current); // formato 'YYYY-MM-DD'

      const esFestivo = diasFestivos.includes(fechaStr);
      const hayAusencia = ausencias.some((a) => a.fecha === fechaStr);
      const esNoLaborable = diasNoLaborables.includes(fechaStr); // ← ACTUALIZADO

      if (esFestivo || hayAusencia || esNoLaborable) {
        return false;
      }

      current.setDate(current.getDate() + 1);
    }

    return true;
  };

  const obtenerIdEstadoAusencia = async (
    estado: string
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from('estado_ausencia')
      .select('id_estado_ausencia')
      .eq('estado', estado)
      .maybeSingle();

    return error ? null : data?.id_estado_ausencia || null;
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const fechaStr = toFechaISO(date); // YYYY-MM-DD

    if (diasFestivos.includes(fechaStr)) {
      return 'bg-gray-200 text-gray-700';
    }

    const ausencia = ausencias.find((a) => a.fecha === fechaStr);
    if (ausencia) {
      return ausencia.estado === 'aprobado'
        ? 'bg-purple-200 text-purple-700'
        : ausencia.estado === 'pendiente'
        ? 'bg-yellow-100 text-yellow-800'
        : '';
    }

    if (diasNoLaborables.includes(fechaStr)) {
      return 'bg-red-100 text-red-700';
    }

    return '';
  };

  if (loading) return <div className="p-6 text-gray-600">Cargando...</div>;
  if (!perfil)
    return <div className="p-6 text-red-600">No se pudo cargar el perfil.</div>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Perfil del Trabajador</h1>

      <Card className="shadow-md">
        <CardContent className="p-6 space-y-6">
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
                  {perfil.nombre_completo?.charAt(0) || '?'}
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

            <div className="flex flex-col gap-3">
              {/* Botón Horario */}
              {Object.keys(horarios).length > 0 ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow transition"
                      title="Ver horario semanal"
                    >
                      <Clock className="w-4 h-4" />
                      Horario
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Horario semanal</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4">
                      {diasSemana.map((dia) => {
                        const franjas = horarios[dia];
                        if (!franjas || franjas.length === 0) return null;
                        return (
                          <div key={dia}>
                            <label className="block font-medium text-gray-600 capitalize mb-1">
                              {dia}
                            </label>
                            {franjas.map((franja, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-2 border rounded-md bg-gray-50 text-gray-800 mb-1"
                              >
                                {franja.hora_inicio} – {franja.hora_fin}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md text-sm text-yellow-800 mt-6">
                      Si deseas modificar tus datos o tu horario, contacta con
                      tu responsable o administrador de empresa.
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
                  title="Horario no disponible"
                >
                  <Clock className="w-4 h-4" />
                  Horario
                </button>
              )}

              {/* Botón Servicios con diálogo funcional */}
              <Dialog
                open={serviciosAbierto}
                onOpenChange={setServiciosAbierto}
              >
                <DialogTrigger asChild>
                  <button
                    onClick={fetchServicios}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow transition"
                    title="Ver servicios asignados"
                  >
                    🛠️ Servicios
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Servicios asignados</DialogTitle>
                  </DialogHeader>

                  {servicios.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {servicios.map((servicio) => (
                        <div
                          key={servicio.id_servicio}
                          className="border rounded-md p-3 bg-gray-50"
                        >
                          <p className="font-semibold text-gray-800">
                            {servicio.nombre_servicio}
                          </p>
                          <p className="text-gray-600">
                            💶 {servicio.precio} €
                          </p>
                          <p className="text-gray-600">
                            🕒 {servicio.duracion_minutos} min
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block font-medium text-gray-600">
                Intervalo de cita (min)
              </label>
              <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-800">
                {perfil.intervalo_cita || 'No definido'}
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

      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Cabecera calendario */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Calendario {new Date().getFullYear()}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300" />
                  <span className="text-red-700">No laborable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 border border-gray-400" />
                  <span className="text-gray-700">Festivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-200 border border-purple-400" />
                  <span className="text-purple-700">
                    Vacaciones / Enfermedad / Otros
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-400" />
                  <span className="text-yellow-700">Vacaciones pendiente</span>
                </div>
              </div>
            </div>

            {/* Rejilla calendario */}
            {/* Calendario solo mes actual en móvil */}
            <div className="block md:hidden">
              <div className="scale-[0.95] bg-white rounded-xl border border-gray-300 shadow-md p-2">
                <Calendar
                  value={null}
                  onChange={(value) => {
                    if (
                      Array.isArray(value) &&
                      value.length === 2 &&
                      value[0] instanceof Date &&
                      value[1] instanceof Date
                    ) {
                      const [inicio, fin] = value;
                      if (!esRangoValido(inicio, fin)) {
                        toast.error(
                          'El rango contiene días no disponibles (festivos, ausencias o no laborables).'
                        );
                        return;
                      }

                      setRangoSeleccionado([inicio, fin]);
                      setSolicitarAbierto(true);
                    }
                  }}
                  tileClassName={tileClassName}
                  showNeighboringMonth={false}
                  selectRange
                  prevLabel={null}
                  nextLabel={null}
                  prev2Label={null}
                  next2Label={null}
                  minDetail="month"
                  maxDetail="month"
                  onClickMonth={() => {}}
                  onClickYear={() => {}}
                />
              </div>
            </div>

            {/* 12 calendarios en escritorio */}
            <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => {
                const year = new Date().getFullYear();
                const monthDate = new Date(year, index, 1);

                return (
                  <div
                    key={index}
                    className="scale-[0.9] origin-top bg-white rounded-xl border border-gray-300 shadow-md p-2"
                  >
                    <Calendar
                      value={null}
                      onChange={(value) => {
                        if (
                          Array.isArray(value) &&
                          value.length === 2 &&
                          value[0] instanceof Date &&
                          value[1] instanceof Date
                        ) {
                          const [inicio, fin] = value;

                          if (!esRangoValido(inicio, fin)) {
                            toast.error(
                              'El rango contiene días no disponibles (festivos, ausencias o no laborables).'
                            );
                            return;
                          }

                          setRangoSeleccionado([inicio, fin]);
                          setSolicitarAbierto(true);
                        }
                      }}
                      tileClassName={tileClassName}
                      activeStartDate={monthDate}
                      showNeighboringMonth={false}
                      selectRange
                      prevLabel={null}
                      nextLabel={null}
                      prev2Label={null}
                      next2Label={null}
                      minDetail="month"
                      maxDetail="month"
                      onClickMonth={() => {}}
                      onClickYear={() => {}}
                    />
                  </div>
                );
              })}
            </div>

            {/* Modal para solicitud de ausencia */}
            <Dialog open={solicitarAbierto} onOpenChange={setSolicitarAbierto}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Solicitar</DialogTitle>
                </DialogHeader>

                <select
                  value={tipoSeleccionado || ''}
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
                >
                  {tiposAusencia.map((tipo) => (
                    <option
                      key={tipo.id_tipo_ausencia}
                      value={tipo.id_tipo_ausencia}
                    >
                      {tipo.tipo}
                    </option>
                  ))}
                </select>

                {rangoSeleccionado && (
                  <div className="text-sm text-gray-700 space-y-2">
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
                        const tipo = tiposAusencia.find(
                          (t) => t.id_tipo_ausencia === tipoSeleccionado
                        );
                        const estadoNombre =
                          tipo?.tipo.toLowerCase() === 'enfermedad'
                            ? 'aprobado'
                            : 'pendiente';

                        if (!rangoSeleccionado) return;
                        const [inicio, fin] = rangoSeleccionado;

                        if (!esRangoValido(inicio, fin)) {
                          toast.error(
                            'El rango incluye días no disponibles (festivos, ausencias o días no laborables).'
                          );
                          return;
                        }

                        const idEstadoAusencia = await obtenerIdEstadoAusencia(
                          estadoNombre
                        );
                        const { error } = await supabase
                          .from('ausencias_solicitadas')
                          .insert({
                            id_usuario: userId,
                            id_empresa: empresaId,
                            id_tipo_ausencia: tipoSeleccionado,
                            id_estado_ausencia: idEstadoAusencia,
                            fecha_inicio: inicio.toLocaleDateString('sv-SE'),
                            fecha_fin: fin.toLocaleDateString('sv-SE'),
                            usuario_creacion: userId,
                          });

                        if (error) {
                          toast.error('No se pudo enviar la solicitud');
                        } else {
                          toast.success('Solicitud enviada');
                          setSolicitarAbierto(false);
                          fetchAusencias();
                        }
                      }}
                      className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md text-sm font-medium"
                    >
                      Confirmar solicitud
                    </button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerProfile;
