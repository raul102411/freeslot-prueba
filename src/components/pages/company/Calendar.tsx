import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { DateSelectArg } from '@fullcalendar/core';
import AppointmentDetailDialog from '@/components/pages/dialogs/AppointmentDetailDialog';
import CancellationReasonDialog from '@/components/pages/dialogs/CancellationReasonDialog';
import PaymentTypeDialog from '@/components/pages/dialogs/PaymentTypeDialog';
import AnulationReasonDialog from '@/components/pages/dialogs/AnulationReasonDialog';

const Appointments = () => {
  const [events, setEvents] = useState([]);
  const [trabajadores, setTrabajadores] = useState<
    { id_usuario: string; nombre: string }[]
  >([]);

  const [servicios, setServicios] = useState<
    { id_servicio: string; nombre_servicio: string; precio: number }[]
  >([]);

  const [selectedTrabajador, setSelectedTrabajador] = useState('');
  const [calendarView, setCalendarView] = useState('timeGridDay');
  const [customTitle, setCustomTitle] = useState('');
  const calendarRef = useRef<FullCalendar | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<any>(null);
  const [verDialogoCita, setVerDialogoCita] = useState(false);
  const [mostrarDialogoPago, setMostrarDialogoPago] = useState(false);
  const [mostrarDialogoCancelacion, setMostrarDialogoCancelacion] =
    useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] = useState('tarjeta');
  const [newCita, setNewCita] = useState({
    trabajador: '',
    servicio: '',
    telefono: '',
    email: '',
    observaciones: '',
    fecha: '',
    hora: '',
    precio: '',
  });
  const [mostrarDialogoAnulacion, setMostrarDialogoAnulacion] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const fetchTrabajadores = async () => {
    const id_empresa = localStorage.getItem('id_empresa');
    const { data, error } = await supabase
      .from('vista_cb_trabajadores')
      .select('id_usuario, nombre')
      .eq('id_empresa', id_empresa);

    if (error) {
      toast.error('Error al cargar trabajadores');
      return;
    }

    setTrabajadores(data ?? []);
  };

  const fetchServicios = async () => {
    const id_empresa = localStorage.getItem('id_empresa');
    const { data, error } = await supabase
      .from('vista_cb_servicios')
      .select('id_servicio, nombre_servicio, precio')
      .eq('id_empresa', id_empresa);

    if (error) {
      toast.error('Error al cargar servicios');
      return;
    }

    setServicios(data ?? []);
  };

  const fetchCitas = async (
    startDate: string,
    endDate: string
  ): Promise<void> => {
    if (!startDate || !endDate) return;

    const id_empresa = localStorage.getItem('id_empresa');

    let query = supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_empresa', id_empresa)
      .gte('fecha_cita', startDate)
      .lte('fecha_cita', endDate);

    if (selectedTrabajador) {
      query = query.eq('id_usuario', selectedTrabajador);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Error al cargar citas');
      return;
    }

    const formatted = (data || []).map((cita) => {
      const [hStart, mStart] = cita.hora_cita.split(':');
      const start = new Date(cita.fecha_cita);
      start.setHours(parseInt(hStart, 10), parseInt(mStart, 10), 0, 0);

      const end = new Date(cita.fecha_cita);

      if (cita.hora_fin) {
        const [hEnd, mEnd] = cita.hora_fin.split(':');
        end.setHours(parseInt(hEnd, 10), parseInt(mEnd, 10), 0, 0);
      } else {
        // Estimar 1 hora si no se indica hora_fin
        end.setTime(start.getTime() + 60 * 60 * 1000);
      }

      return {
        id: cita.id_cita,
        title: `${cita.nombre_completo}`,
        start,
        end,
        extendedProps: {
          observaciones: cita.observaciones,
          estado: cita.estado_cita,
          telefono: cita.telefono,
          email: cita.email,
          servicio: cita.nombre_servicio,
          motivo_cancelacion: cita.motivo_cancelacion || null,
          motivo_anulado: cita.motivo_anulado || '',
          tipo_pago: cita.tipo_pago || null,
        },
      };
    });

    setEvents(formatted as any);
  };

  const handleSelect = (info: DateSelectArg) => {
    const fecha = info.startStr.split('T')[0];
    const hora = info.startStr.split('T')[1].substring(0, 5);
    setNewCita((prev) => ({ ...prev, fecha, hora }));
    setDialogOpen(true);
  };

  const handleServicioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const servicioSeleccionado = servicios.find(
      (s) => s.id_servicio === e.target.value
    );

    setNewCita({
      ...newCita,
      servicio: e.target.value,
      precio: servicioSeleccionado ? String(servicioSeleccionado.precio) : '',
    });
  };

  const handleGuardarCita = async () => {
    if (!newCita.trabajador) {
      toast.error('Selecciona un trabajador');
      return;
    }
    if (!newCita.servicio) {
      toast.error('Selecciona un servicio');
      return;
    }
    const id_estado = await getIdEstadoPorNombre('confirmado');
    if (!id_estado) {
      toast.error('No se pudo obtener el estado inicial');
      return;
    }

    const telefonoSinEspacios = newCita.telefono.replace(/\s/g, '');
    if (telefonoSinEspacios.length !== 9) {
      toast.error('El teléfono debe tener 9 dígitos');
      return;
    }

    const { error } = await supabase.from('citas').insert([
      {
        id_usuario: newCita.trabajador,
        id_servicio: newCita.servicio,
        id_estado,
        fecha_cita: newCita.fecha,
        hora_cita: newCita.hora,
        telefono: newCita.telefono || null,
        email: newCita.email || null,
        observaciones: newCita.observaciones || null,
      },
    ]);

    if (error) {
      toast.error('Error al guardar cita');
      return;
    }

    toast.success('Cita guardada correctamente');
    setDialogOpen(false);
    setNewCita({
      trabajador: '',
      servicio: '',
      telefono: '',
      email: '',
      observaciones: '',
      fecha: '',
      hora: '',
      precio: '',
    });

    if (fechaInicio && fechaFin) {
      fetchCitas(fechaInicio, fechaFin);
    }
  };

  const handleActualizarEstado = async (
    idCita: string,
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

  const getIdEstadoPorNombre = async (
    estadoNombre: string
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from('estados')
      .select('id_estado')
      .eq('estado', estadoNombre)
      .single();

    if (error || !data) return null;
    return data.id_estado;
  };

  const formatearTelefono = (valor: string): string => {
    return valor
      .replace(/\D/g, '') // Quita todo lo que no sea dígito
      .slice(0, 9) // Limita a 9 dígitos
      .replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3') // Formatea como 600 123 456
      .trim();
  };

  const generateTitle = (start: Date, end: Date, viewType: string): string => {
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
      const visibleDate = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        15
      );
      const month = visibleDate.getMonth();
      const year = visibleDate.getFullYear();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      const startDay = startOfMonth.getDate().toString().padStart(2, '0');
      const endDay = endOfMonth.getDate().toString().padStart(2, '0');
      return `${startDay}–${endDay} de ${months[month]} de ${year}`;
    }

    const startDay = start.getDate().toString().padStart(2, '0');
    const endAdjusted = new Date(end.getTime() - 1);
    const endDay = endAdjusted.getDate().toString().padStart(2, '0');
    const month = months[endAdjusted.getMonth()];
    const year = endAdjusted.getFullYear();
    return `${startDay}–${endDay} de ${month} de ${year}`;
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

  useEffect(() => {
    fetchTrabajadores();
    fetchServicios();
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchCitas(fechaInicio, fechaFin);
    }
  }, [selectedTrabajador, fechaInicio, fechaFin]);

  return (
    <div>
      <div className="flex flex-col h-full min-h-screen space-y-6">
        <h1 className="text-2xl font-bold">Calendario</h1>

        <div className="w-full bg-white border rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1" htmlFor="trabajador">
              Filtrar por trabajador
            </label>
            <select
              id="trabajador"
              value={selectedTrabajador}
              onChange={(e) => setSelectedTrabajador(e.target.value)}
              className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Todos los trabajadores</option>
              {trabajadores.map((trabajador) => (
                <option
                  key={trabajador.id_usuario}
                  value={trabajador.id_usuario}
                >
                  {trabajador.nombre}
                </option>
              ))}
            </select>
          </div>

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

        <div className="flex-1 overflow-hidden rounded-xl border bg-white shadow-sm">
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
              <span className="w-4 h-4 bg-blue-500"></span>
              <span className="text-sm text-gray-700">Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-500"></span>
              <span className="text-sm text-gray-700">Cancelado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-500"></span>
              <span className="text-sm text-gray-700">Completado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-yellow-500 "></span>
              <span className="text-sm text-gray-700">Anulado</span>
            </div>
          </div>

          <div className="max-h-[700px] overflow-y-scroll">
            <FullCalendar
              key={calendarView}
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={calendarView}
              allDaySlot={false}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              scrollTime={new Date().toTimeString().substring(0, 8)}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              dayMaxEvents={3} // ← muestra hasta 3 eventos, el resto se oculta con "+X más"
              eventOrder="start" // opcional: ordena eventos por hora
              slotEventOverlap={false}
              locale={esLocale}
              events={events}
              height={700}
              nowIndicator
              selectable
              select={handleSelect}
              eventClick={({ event }) => {
                setCitaSeleccionada({
                  id_cita: event.id, // <- Añade esta línea
                  trabajador: event.title,
                  fecha: event.start
                    ? new Date(event.start).toLocaleDateString()
                    : '',
                  horaInicio: event.start
                    ? new Date(event.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '',
                  horaFin: event.end?.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  observaciones: event.extendedProps?.observaciones || '',
                  motivo_cancelacion:
                    event.extendedProps?.motivo_cancelacion || '',
                  motivo_anulado: event.extendedProps.motivo_anulado || '',
                  estado: event.extendedProps?.estado || '',
                  telefono: event.extendedProps?.telefono || '',
                  email: event.extendedProps?.email || '',
                  servicio: event.extendedProps?.servicio || '',
                  tipo_pago: event.extendedProps?.tipo_pago || '',
                });
                setVerDialogoCita(true);
              }}
              headerToolbar={{ left: '', center: '', right: '' }}
              datesSet={({ start, end, view }) => {
                setCustomTitle(generateTitle(start, end, view.type));

                const startISO = start.toISOString().split('T')[0];
                const endISO = new Date(end.getTime() - 1)
                  .toISOString()
                  .split('T')[0];

                setFechaInicio(startISO);
                setFechaFin(endISO);
              }}
              buttonText={{ today: 'Hoy' }}
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
              eventContent={({ event, view }) => {
                const estado = event.extendedProps.estado?.toLowerCase();
                let bgColor = 'bg-blue-500'; // confirmado por defecto
                const tipoPago = event.extendedProps.tipo_pago?.toLowerCase();

                if (estado === 'cancelado') bgColor = 'bg-red-500';
                if (estado === 'completado') bgColor = 'bg-green-500';
                if (estado === 'anulado') bgColor = 'bg-yellow-500';

                const horaInicio =
                  event.start instanceof Date
                    ? event.start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                    : '';

                const horaFin = event.end?.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                });

                // Concatenar título y servicio si estamos en vista diaria
                const texto =
                  view.type === 'timeGridDay'
                    ? `${horaInicio} - ${horaFin} ${event.title} - ${
                        event.extendedProps.servicio || ''
                      }`
                    : `${horaInicio} - ${horaFin} ${event.title}`;

                // 🎯 Mapea iconos según el tipo de pago
                const iconosPago = {
                  tarjeta: '💳',
                  efectivo: '💵',
                  bizum: '📲',
                  otros: '💼',
                };

                return (
                  <div
                    className={`text-[11px] px-1 py-0.5 truncate text-white rounded ${bgColor} flex items-center gap-1`}
                  >
                    {estado === 'completado' &&
                      ['tarjeta', 'efectivo', 'bizum', 'otros'].includes(
                        tipoPago
                      ) && (
                        <span title={tipoPago}>
                          {
                            iconosPago[
                              tipoPago as
                                | 'tarjeta'
                                | 'efectivo'
                                | 'bizum'
                                | 'otros'
                            ]
                          }
                        </span>
                      )}

                    <span>{`${texto}`}</span>
                  </div>
                );
              }}
            />
          </div>
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
          onAnular={() => {
            setMostrarDialogoAnulacion(true);
            setVerDialogoCita(false);
          }}
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
            {/* Botón cerrar */}
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
              {/* Trabajador */}
              <div>
                <label className="block font-medium">Trabajador</label>
                <select
                  value={newCita.trabajador}
                  onChange={(e) =>
                    setNewCita({ ...newCita, trabajador: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Seleccionar</option>
                  {trabajadores.map((t) => (
                    <option key={t.id_usuario} value={t.id_usuario}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Servicio */}
              <div>
                <label className="block font-medium">Servicio</label>
                <select
                  value={newCita.servicio}
                  onChange={handleServicioChange}
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

              {/* Teléfono */}
              <div>
                <label className="block font-medium">Teléfono</label>
                <input
                  type="text"
                  value={newCita.telefono}
                  onChange={(e) =>
                    setNewCita({
                      ...newCita,
                      telefono: formatearTelefono(e.target.value),
                    })
                  }
                  maxLength={11}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* Email */}
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

              {/* Observaciones */}
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

              {/* Precio */}
              {newCita.precio && (
                <div className="text-sm text-gray-600">
                  <strong>Precio:</strong> {newCita.precio} €
                </div>
              )}

              {/* Fecha y hora */}
              <div className="pt-2 text-sm text-gray-600">
                <p>
                  <strong>Fecha:</strong> {newCita.fecha}
                </p>
                <p>
                  <strong>Hora:</strong> {newCita.hora}
                </p>
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

export default Appointments;
