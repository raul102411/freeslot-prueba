// app/components/WorkerCalendar.tsx
import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useMemo } from 'react'; // asegúrate que esté importado
import AppointmentDetailDialog from '@/components/pages/dialogs/AppointmentDetailDialog';
import CancellationReasonDialog from '@/components/pages/dialogs/CancellationReasonDialog';
import PaymentTypeDialog from '@/components/pages/dialogs/PaymentTypeDialog';
import AnulationReasonDialog from '@/components/pages/dialogs/AnulationReasonDialog';
import { EventInput } from '@fullcalendar/core';
import { DateSelectArg } from '@fullcalendar/core';
import { useRef } from 'react';

const WorkerCalendar = () => {
  type TipoPago = 'tarjeta' | 'efectivo' | 'bizum' | 'otros';

  const [events, setEvents] = useState<EventInput[]>([]);
  const [calendarView, setCalendarView] = useState('timeGridDay');
  const [customTitle, setCustomTitle] = useState('');
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  const [verDialogoCita, setVerDialogoCita] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [mostrarDialogoCancelacion, setMostrarDialogoCancelacion] =
    useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [intervaloCita, setIntervaloCita] = useState('00:30:00'); // valor por defecto
  const [servicios, setServicios] = useState<
    {
      id_servicio: string;
      nombre_servicio: string;
      precio: number;
      duracion_minutos: number;
    }[]
  >([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mostrarDialogoPago, setMostrarDialogoPago] = useState(false);
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState('tarjeta');
  const [newCita, setNewCita] = useState({
    servicio: '',
    telefono: '',
    email: '',
    observaciones: '',
    fecha: '',
    hora: '',
    horaFin: '',
  });
  const [mostrarDialogoAnulacion, setMostrarDialogoAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const [firstTimeMonthView, setFirstTimeMonthView] = useState(true);
  const [diasNoLaborables, setDiasNoLaborables] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<
    { dia_semana: string; hora_inicio: string; hora_fin: string }[]
  >([]);

  const [diasFestivos, setDiasFestivos] = useState<string[]>([]);
  const [ausencias, setAusencias] = useState<
    { fecha: string; estado: string }[]
  >([]);

  const userId = localStorage.getItem('id_usuario') || '';
  const empresaId = localStorage.getItem('id_empresa');

  const fetchCitas = async (
    startDate: string,
    endDate: string,
    horariosParam?: any[] // puedes refinar el tipo si sabes la estructura
  ): Promise<void> => {
    if (!startDate || !endDate || !userId) return;

    const { data, error } = await supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_usuario', userId)
      .gte('fecha_cita', startDate)
      .lte('fecha_cita', endDate);

    if (error) {
      toast.error('Error al cargar citas');
      return;
    }

    const formatted = mapearCitas(data);
    const horariosPorDia = obtenerHorariosPorDia(horariosParam || []);

    const startWeek = new Date(startDate);
    startWeek.setDate(startWeek.getDate() - startWeek.getDay());

    const bloqueado = horariosParam?.length
      ? generarEventosBloqueados(
          startWeek,
          horariosPorDia,
          diasNoLaborables || []
        )
      : [];

    const eventosNoLaborables = (diasNoLaborables || []).map((fecha) => ({
      start: fecha,
      end: fecha,
      display: 'background',
      classNames: ['no-laborable-bg'], // clase CSS personalizada
      allDay: true,
    }));

    const eventosFestivos = (diasFestivos || []).map((fecha) => {
      const start = new Date(fecha);
      const end = new Date(fecha);
      end.setDate(end.getDate() + 1); // Para cubrir todo el día

      return {
        start: start.toISOString(),
        end: end.toISOString(),
        display: 'background',
        classNames: ['bloqueado-bg'],
        allDay: true,
        extendedProps: {
          tipo: 'bloqueado',
        },
      };
    });

    const eventosAusencias = (ausencias || []).map(({ fecha }) => {
      const start = new Date(fecha);
      const end = new Date(fecha);
      end.setDate(end.getDate() + 1); // cubrir todo el día

      return {
        start: start.toISOString(),
        end: end.toISOString(),
        display: 'background',
        classNames: ['ausencia-aprobada-bg'],
        allDay: true,
        extendedProps: {
          tipo: 'bloqueado',
        },
      };
    });

    setEvents([
      ...formatted,
      ...bloqueado,
      ...eventosNoLaborables,
      ...eventosFestivos,
      ...eventosAusencias,
    ]);
  };

  const mapearCitas = (data: any[]): EventInput[] => {
    const eventos: EventInput[] = [];

    data.forEach((cita) => {
      const [hStart, mStart] = cita.hora_cita.split(':').map(Number);
      let inicio = new Date(cita.fecha_cita);
      inicio.setHours(hStart, mStart, 0, 0);

      const commonProps = {
        estado: cita.estado_cita,
        tipo_pago: cita.tipo_pago,
        observaciones: cita.observaciones,
        telefono: cita.telefono,
        email: cita.email,
        motivo_cancelacion: cita.motivo_cancelacion || '',
        motivo_anulado: cita.motivo_anulado || '',
      };

      if (
        cita.estado_cita === 'confirmado' &&
        Array.isArray(cita.fases_servicio)
      ) {
        cita.fases_servicio.forEach((fase: any, idx: number) => {
          const duracion = fase.duracion_minutos || 0;
          const fin = new Date(inicio.getTime() + duracion * 60000);

          if (fase.requiere_atencion) {
            eventos.push({
              id: `${cita.id_cita}-${idx}`,
              groupId: cita.id_cita,
              title: `${cita.nombre_servicio} - ${fase.nombre_fase}`,
              start: new Date(inicio),
              end: fin,
              classNames: ['fase-atencion'],
              extendedProps: {
                ...commonProps,
                tipo_fase: 'atencion',
                id_cita: cita.id_cita,
              },
            });
          } else {
            eventos.push({
              id: `${cita.id_cita}-descanso-${idx}`,
              groupId: cita.id_cita,
              title: fase.nombre_fase,
              start: new Date(inicio),
              end: fin,
              display: 'background', // 🔴 renderizar como fondo
              classNames: ['fase-descanso'],
              extendedProps: {
                ...commonProps,
                tipo_fase: 'descanso',
                id_cita: cita.id_cita,
              },
            });
          }

          inicio = fin;
        });
      } else {
        // Cita sin fases
        const end = cita.hora_fin
          ? (() => {
              const [hEnd, mEnd] = cita.hora_fin.split(':').map(Number);
              const d = new Date(cita.fecha_cita);
              d.setHours(hEnd, mEnd, 0, 0);
              return d;
            })()
          : new Date(inicio.getTime() + 60 * 60000);

        eventos.push({
          id: cita.id_cita,
          groupId: cita.id_cita,
          title: cita.nombre_servicio,
          start: inicio,
          end,
          classNames: ['fase-atencion'],
          extendedProps: {
            ...commonProps,
            tipo_fase: 'atencion',
            id_cita: cita.id_cita,
          },
        });
      }
    });

    return eventos;
  };

  const obtenerHorariosPorDia = (
    horarios: { dia_semana: string; hora_inicio: string; hora_fin: string }[]
  ): Record<string, { hora_inicio: string; hora_fin: string }[]> => {
    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];

    const horariosPorDia = dias.reduce<
      Record<string, { hora_inicio: string; hora_fin: string }[]>
    >((acc, dia) => {
      acc[dia] = [];
      return acc;
    }, {});

    horarios.forEach((h) => {
      const dia = h.dia_semana.toLowerCase();
      horariosPorDia[dia].push({
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
      });
    });

    return horariosPorDia;
  };

  const generarEventosBloqueados = (
    startWeek: Date,
    horariosPorDia: Record<string, { hora_inicio: string; hora_fin: string }[]>,
    diasNoLaborables: string[]
  ) => {
    const eventos: EventInput[] = [];

    const dias = [
      'domingo',
      'lunes',
      'martes',
      'miércoles',
      'jueves',
      'viernes',
      'sábado',
    ];

    const diasLower = diasNoLaborables.map((d) => d.toLowerCase());

    dias.forEach((dia, idx) => {
      if (!diasLower.includes(dia.toLowerCase())) {
        const fecha = new Date(startWeek);
        fecha.setDate(fecha.getDate() + idx);

        const franjas = horariosPorDia[dia];
        let bloques = [];
        let inicio = '00:00';

        franjas
          .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
          .forEach(({ hora_inicio, hora_fin }) => {
            if (inicio < hora_inicio) {
              bloques.push({ start: inicio, end: hora_inicio });
            }
            inicio = hora_fin > inicio ? hora_fin : inicio;
          });

        if (inicio < '23:59') {
          bloques.push({ start: inicio, end: '23:59' });
        }

        bloques.forEach(({ start, end }) => {
          const s = new Date(fecha);
          const [hs, ms] = start.split(':');
          s.setHours(+hs, +ms);

          const e = new Date(fecha);
          const [he, me] = end.split(':');
          e.setHours(+he, +me);

          eventos.push({
            start: s.toISOString(),
            end: e.toISOString(),
            display: 'background',
            classNames: ['bloqueado-bg'],
            extendedProps: {
              tipo: 'bloqueado',
            },
          });
        });
      }
    });

    return eventos;
  };

  const fetchIntervaloCita = async () => {
    const { data, error } = await supabase
      .from('vista_intervalo_cita')
      .select('intervalo_cita')
      .eq('id_usuario', userId)
      .single();

    if (!error && data?.intervalo_cita) {
      const minutos = data.intervalo_cita;
      const horas = Math.floor(minutos / 60)
        .toString()
        .padStart(2, '0');
      const mins = (minutos % 60).toString().padStart(2, '0');
      setIntervaloCita(`${horas}:${mins}:00`);
    }
  };

  const fetchServicios = async () => {
    const id_empresa = localStorage.getItem('id_empresa');
    const { data, error } = await supabase
      .from('vista_cb_servicios')
      .select('id_servicio, nombre_servicio, precio, duracion_minutos')
      .eq('id_empresa', id_empresa);

    if (error) {
      toast.error('Error al cargar servicios');
      return;
    }

    setServicios(data || []);
  };

  const fetchHorarios = async () => {
    const { data, error } = await supabase
      .from('vista_horario_trabajador')
      .select('*')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar horarios');
      return;
    }

    setHorarios(data || []);
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

    // Guardar solo las fechas como strings en formato ISO
    const fechasNoLaborables = data.map(
      (item: { fecha: string }) => item.fecha
    );

    setDiasNoLaborables(fechasNoLaborables);
  };

  const fetchDiasFestivos = async () => {
    const empresaId = localStorage.getItem('id_empresa');

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
    const empresaId = localStorage.getItem('id_empresa');

    const { data, error } = await supabase
      .from('vista_ausencias')
      .select('fecha_inicio, fecha_fin, estado_ausencia')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId)
      .eq('estado_ausencia', 'aprobado');

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

  const handleSelect = (info: DateSelectArg) => {
    const fecha = info.startStr.split('T')[0];
    const hora = info.startStr.split('T')[1].substring(0, 5);
    setNewCita((prev) => ({ ...prev, fecha, hora }));
    setDialogOpen(true);
  };

  const handleGuardarCita = async () => {
    const id_usuario = localStorage.getItem('id_usuario');

    if (!newCita.servicio) {
      toast.error('Selecciona un servicio');
      return;
    }

    if (newCita.telefono.replace(/\s/g, '').length !== 9) {
      toast.error('Teléfono inválido');
      return;
    }

    const { data: estadoData, error: estadoError } = await supabase
      .from('estados')
      .select('id_estado')
      .eq('estado', 'confirmado')
      .single();

    if (estadoError || !estadoData) {
      toast.error('No se pudo obtener el estado');
      return;
    }

    const { error } = await supabase.from('citas').insert([
      {
        id_usuario,
        id_servicio: newCita.servicio,
        id_estado: estadoData.id_estado,
        fecha_cita: newCita.fecha,
        hora_cita: newCita.hora,
        hora_fin: newCita.horaFin || null,
        telefono: newCita.telefono,
        email: newCita.email,
        observaciones: newCita.observaciones,
      },
    ]);

    if (error) {
      toast.error('Error al guardar cita');
      return;
    }

    toast.success('Cita guardada correctamente');
    setDialogOpen(false);
    setNewCita({
      servicio: '',
      telefono: '',
      email: '',
      observaciones: '',
      fecha: '',
      hora: '',
      horaFin: '',
    });

    if (fechaInicio && fechaFin) {
      fetchCitas(fechaInicio, fechaFin);
    }
  };

  const handleActualizarEstado = async (
    idCita: number | string,
    nuevoEstado: string,
    motivo: string | null = null
  ) => {
    const { data, error } = await supabase
      .from('estados')
      .select('id_estado')
      .eq('estado', nuevoEstado)
      .single();

    if (error || !data) {
      toast.error('No se pudo obtener el estado');
      return;
    }

    let tipoPago = null;
    if (nuevoEstado === 'completado') {
      tipoPago = prompt(
        '¿Cuál fue el tipo de pago? (efectivo, tarjeta, bizum, otros)'
      )
        ?.toLowerCase()
        ?.trim();

      const opcionesValidas = ['efectivo', 'tarjeta', 'bizum', 'otros'];
      if (!tipoPago || !opcionesValidas.includes(tipoPago)) {
        toast.error('Tipo de pago no válido');
        return;
      }
    }

    const { error: updateError } = await supabase
      .from('citas')
      .update({
        id_estado: data.id_estado,
        tipo_pago: tipoPago,
        motivo_cancelacion: nuevoEstado === 'cancelado' ? motivo : null,
        motivo_anulado: nuevoEstado === 'anulado' ? motivo : null,
      })
      .eq('id_cita', idCita);

    if (updateError) {
      toast.error('Error al actualizar el estado');
      return;
    }

    toast.success(`Estado actualizado a ${nuevoEstado}`);
    setVerDialogoCita(false);
    setMostrarDialogoCancelacion(false);
    setMotivoCancelacion('');

    if (fechaInicio && fechaFin) {
      fetchCitas(fechaInicio, fechaFin);
    }
  };

  const confirmarCambioACompletado = async () => {
    const { data, error } = await supabase
      .from('estados')
      .select('id_estado')
      .eq('estado', 'completado')
      .single();

    if (error || !data) {
      toast.error('No se pudo obtener el estado');
      return;
    }

    if (!citaSeleccionada?.id_cita) return;

    const { error: updateError } = await supabase
      .from('citas')
      .update({
        id_estado: data.id_estado,
        tipo_pago: tipoPagoSeleccionado,
      })
      .eq('id_cita', citaSeleccionada.id_cita);

    if (updateError) {
      toast.error('Error al actualizar el estado');
      return;
    }

    toast.success('Estado actualizado a completado');
    setVerDialogoCita(false);
    setMostrarDialogoPago(false);
    setTipoPagoSeleccionado('tarjeta');

    if (fechaInicio && fechaFin) {
      fetchCitas(fechaInicio, fechaFin);
    }
  };

  const generateTitle = (start: Date, end: Date, viewType: string) => {
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];

    if (viewType === 'dayGridMonth') {
      const month = start.getMonth();
      const year = start.getFullYear();
      console.log(`${months[month]} de ${year}`);
      return `${months[month]} de ${year}`;
    }

    if (viewType === 'timeGridDay') {
      const day = start.getDate().toString().padStart(2, '0');
      const month = months[start.getMonth()];
      const year = start.getFullYear();
      return `${day} de ${month} de ${year}`;
    }

    // Vista Semana
    const startDay = start.getDate().toString().padStart(2, '0');
    const endAdjusted = new Date(end.getTime() - 1);
    const endDay = endAdjusted.getDate().toString().padStart(2, '0');
    const month = months[endAdjusted.getMonth()];
    const year = endAdjusted.getFullYear();

    return `${startDay}–${endDay} de ${month} de ${year}`;
  };

  const calcularHoraFin = (
    horaInicio: string,
    duracionMinutos: number
  ): string => {
    if (!horaInicio || !duracionMinutos) return '';
    const [h, m] = horaInicio.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, 0, 0);
    const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
    return fin.toTimeString().slice(0, 5);
  };

  const scrollTime = useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours() - 2); // 🔻 restar una hora
    now.setMinutes(0, 0, 0); // opcional: redondear a la hora en punto

    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');

    return `${h}:${m}:00`;
  }, []);

  useEffect(() => {
    fetchServicios();
    fetchIntervaloCita();
    fetchHorarios();
    fetchDiasNoLaborables();
    fetchDiasFestivos();
    fetchAusencias();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin && horarios.length > 0) {
      fetchCitas(fechaInicio, fechaFin, horarios);
    }
  }, [horarios, fechaInicio, fechaFin]);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const now = new Date();
      now.setHours(now.getHours() - 1, 0, 0, 0); // 🔻 una hora menos

      calendarApi.scrollToTime({
        hours: now.getHours(),
        minutes: 0,
        seconds: 0,
      });
    }
  }, [events]); // 👈 Solo cuando los eventos estén cargados

  return (
    <div className="flex flex-col h-screen space-y-6 overflow-hidden">
      <h1 className="text-2xl font-bold">Mis Citas</h1>

      {!isMobile && (
        <div className="w-full bg-white border rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalendarView('timeGridDay')}
              className={`px-4 py-2 text-sm rounded-md transition ${
                calendarView === 'timeGridDay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Día
            </button>
            <button
              onClick={() => setCalendarView('timeGridWeek')}
              className={`px-4 py-2 text-sm rounded-md transition ${
                calendarView === 'timeGridWeek'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setCalendarView('dayGridMonth')}
              className={`px-4 py-2 text-sm rounded-md transition ${
                calendarView === 'dayGridMonth'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="text-sm px-3 py-1 rounded hover:bg-gray-200 transition"
            >
              &lt;
            </button>
            <button
              onClick={() => {
                const api = calendarRef.current?.getApi();
                if (api) {
                  api.today();
                  api.changeView(calendarView);
                }
              }}
              className="text-sm px-3 py-1 rounded hover:bg-gray-200 transition"
            >
              Hoy
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="text-sm px-3 py-1 rounded hover:bg-gray-200 transition"
            >
              &gt;
            </button>
          </div>
          <div className="text-sm font-semibold text-gray-700 text-center flex-1">
            {customTitle}
          </div>
          <div className="w-[88px]" />
        </div>

        <div className="flex items-center gap-4 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-500 "></span>
            <span className="text-sm text-gray-700">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-500 "></span>
            <span className="text-sm text-gray-700">Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-500 "></span>
            <span className="text-sm text-gray-700">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-500 "></span>
            <span className="text-sm text-gray-700">Anulado</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <FullCalendar
            key={`${calendarView}-${scrollTime}`}
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView={calendarView}
            allDaySlot={false}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            nowIndicator
            selectable={true}
            select={handleSelect}
            locale={esLocale}
            slotDuration={intervaloCita}
            height={700}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            slotEventOverlap={false}
            eventOrder="start"
            events={events}
            headerToolbar={{ left: '', center: '', right: '' }}
            scrollTime={scrollTime}
            selectAllow={() => true}
            dayMaxEvents={true}
            eventClick={({ event }) => {
              if (
                event.display === 'background' ||
                event.extendedProps.tipo === 'bloqueado'
              )
                return;

              setCitaSeleccionada({
                id_cita: event.extendedProps.id_cita,
                servicio: event.title,
                fecha: event.start ? event.start.toLocaleDateString() : '',
                horaInicio: event.start
                  ? event.start.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '',
                horaFin: event.end
                  ? event.end.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '',
                estado: event.extendedProps.estado || '',
                telefono: event.extendedProps.telefono || '',
                email: event.extendedProps.email || '',
                observaciones: event.extendedProps.observaciones || '',
                tipo_pago: event.extendedProps.tipo_pago,
                motivo_cancelacion:
                  event.extendedProps.motivo_cancelacion || '',
                motivo_anulado: event.extendedProps.motivo_anulado || '', // ✅ AÑADIR
              });
              setVerDialogoCita(true);
            }}
            dayHeaderContent={
              calendarView === 'timeGridWeek'
                ? (args) => {
                    const date = args.date;
                    const day = date.getDate().toString().padStart(2, '0');
                    const weekday = date.toLocaleDateString('es-ES', {
                      weekday: 'long',
                    });
                    return {
                      html: `<div class="flex flex-col items-center"><span class="text-blue-600 font-semibold text-lg">${day}</span><span class="text-gray-700 text-sm capitalize">${weekday}</span></div>`,
                    };
                  }
                : undefined
            }
            datesSet={({ start, end, view }) => {
              const calendarApi = calendarRef.current?.getApi();
              const currentDate = calendarApi?.getDate();

              let titleStart = start;
              let titleEnd = new Date(end.getTime() - 1);

              // ✅ Si es la primera vez en vista de mes, usamos el mes actual
              if (view.type === 'dayGridMonth' && firstTimeMonthView) {
                const today = new Date();
                const visibleMonth = today.getMonth();
                const visibleYear = today.getFullYear();
                titleStart = new Date(visibleYear, visibleMonth, 1);
                titleEnd = new Date(visibleYear, visibleMonth + 1, 0);

                // Solo se usa una vez
                setFirstTimeMonthView(false);
              } else if (
                view.type === 'dayGridMonth' &&
                currentDate instanceof Date
              ) {
                const visibleMonth = currentDate.getMonth();
                const visibleYear = currentDate.getFullYear();
                titleStart = new Date(visibleYear, visibleMonth, 1);
                titleEnd = new Date(visibleYear, visibleMonth + 1, 0);
              }

              const startDate = start.toISOString().split('T')[0];
              const endDate = new Date(end.getTime() - 1)
                .toISOString()
                .split('T')[0];

              setCustomTitle(generateTitle(titleStart, titleEnd, view.type));
              setFechaInicio(startDate);
              setFechaFin(endDate);
            }}
            eventContent={({ event }) => {
              if (event.display === 'background') return null;

              const estado = event.extendedProps.estado?.toLowerCase();
              const tipoPago = event.extendedProps.tipo_pago?.toLowerCase();
              const telefono = event.extendedProps.telefono;
              const tipoFase = event.extendedProps?.tipo_fase;

              let bgColor = 'bg-blue-500';
              let textColor = 'text-white';

              if (estado === 'cancelado') bgColor = 'bg-red-500';
              if (estado === 'completado') bgColor = 'bg-green-500';
              if (estado === 'anulado') bgColor = 'bg-yellow-500';
              if (tipoFase === 'descanso') {
                bgColor = 'bg-gray-200';
                textColor = 'text-gray-700';
              }

              const horaInicio = event.start?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const horaFin = event.end?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              const iconosPago = {
                tarjeta: '💳',
                efectivo: '💵',
                bizum: '📲',
                otros: '💼',
              };

              const icon =
                iconosPago[event.extendedProps.tipo_pago as TipoPago];

              return (
                <div
                  className={`text-[11px] px-1 py-0.5 truncate rounded ${bgColor} ${textColor} flex items-center gap-1`}
                >
                  {estado === 'completado' && icon && (
                    <span title={tipoPago}>{icon}</span>
                  )}
                  <span>
                    {`${horaInicio} - ${horaFin} ${event.title}`}
                    {calendarView === 'timeGridDay' && telefono
                      ? ` - 📞 ${telefono}`
                      : ''}
                  </span>
                </div>
              );
            }}
            eventDidMount={(info) => {
              const tipo = info.event.extendedProps?.tipo;
              if (tipo) {
                info.el.setAttribute('data-tipo', tipo);
              }
            }}
          />
        </div>
      </div>

      {verDialogoCita && citaSeleccionada && (
        <AppointmentDetailDialog
          cita={citaSeleccionada}
          onClose={() => setVerDialogoCita(false)}
          onCancelar={() => {
            setMostrarDialogoCancelacion(true);
            setVerDialogoCita(false);
          }}
          onCompletar={() => {
            setMostrarDialogoPago(true);
            setVerDialogoCita(false);
          }}
          onReabrir={() =>
            handleActualizarEstado(citaSeleccionada.id_cita, 'confirmado')
          }
          onActualizarEstado={handleActualizarEstado}
          onAnular={() => {
            setVerDialogoCita(false);
            setMostrarDialogoAnulacion(true);
          }} // 👈 AÑADIDO
        />
      )}

      {mostrarDialogoCancelacion && (
        <CancellationReasonDialog
          motivo={motivoCancelacion}
          setMotivo={setMotivoCancelacion}
          onCancel={() => {
            setMostrarDialogoCancelacion(false);
            setMotivoCancelacion('');
          }}
          onConfirm={() =>
            handleActualizarEstado(
              citaSeleccionada.id_cita,
              'cancelado',
              motivoCancelacion
            )
          }
        />
      )}

      {mostrarDialogoAnulacion && (
        <AnulationReasonDialog
          motivo={motivoAnulacion}
          setMotivo={setMotivoAnulacion}
          onCancel={() => {
            setMostrarDialogoAnulacion(false);
            setMotivoAnulacion('');
            setVerDialogoCita(true);
          }}
          onConfirm={() => {
            handleActualizarEstado(
              citaSeleccionada.id_cita,
              'anulado',
              motivoAnulacion
            );
            setMostrarDialogoAnulacion(false);
            setMotivoAnulacion('');
          }}
        />
      )}

      {mostrarDialogoPago && (
        <PaymentTypeDialog
          tipoPago={tipoPagoSeleccionado}
          setTipoPago={setTipoPagoSeleccionado}
          onCancel={() => {
            setMostrarDialogoPago(false);
            setTipoPagoSeleccionado('tarjeta');
            setVerDialogoCita(true);
          }}
          onConfirm={confirmarCambioACompletado}
        />
      )}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <button
              onClick={() => setDialogOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              aria-label="Cerrar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-xl font-semibold mb-4">Nueva cita</h2>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-medium">Servicio</label>
                <select
                  value={newCita.servicio}
                  onChange={(e) => {
                    const id = e.target.value;
                    const servicioSeleccionado = servicios.find(
                      (s) => s.id_servicio === id
                    );
                    const duracion =
                      servicioSeleccionado?.duracion_minutos || 0;

                    setNewCita((prev) => ({
                      ...prev,
                      servicio: id,
                      horaFin: calcularHoraFin(prev.hora, duracion),
                    }));
                  }}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Seleccionar</option>
                  {servicios.map((s) => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre_servicio}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium">Teléfono</label>
                <input
                  type="text"
                  value={newCita.telefono}
                  onChange={(e) =>
                    setNewCita({
                      ...newCita,
                      telefono: e.target.value
                        .replace(/\D/g, '')
                        .replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3'),
                    })
                  }
                  maxLength={11}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium">Email (opcional)</label>
                <input
                  type="email"
                  value={newCita.email}
                  onChange={(e) =>
                    setNewCita({ ...newCita, email: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={newCita.observaciones}
                  onChange={(e) =>
                    setNewCita({ ...newCita, observaciones: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium">Fecha</label>
                <input
                  type="date"
                  value={newCita.fecha}
                  onChange={(e) =>
                    setNewCita({ ...newCita, fecha: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium">Hora de inicio</label>
                <input
                  type="time"
                  value={newCita.hora}
                  onChange={(e) => {
                    const nuevaHora = e.target.value;
                    const servicioSeleccionado = servicios.find(
                      (s) => s.id_servicio === newCita.servicio
                    );
                    const duracion =
                      servicioSeleccionado?.duracion_minutos || 0;

                    setNewCita((prev) => ({
                      ...prev,
                      hora: nuevaHora,
                      horaFin: calcularHoraFin(nuevaHora, duracion),
                    }));
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-medium">Hora de fin</label>
                <input
                  type="time"
                  value={newCita.horaFin}
                  onChange={(e) =>
                    setNewCita({ ...newCita, horaFin: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleGuardarCita}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerCalendar;
