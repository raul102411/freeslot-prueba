// src/components/pages/worker/WorkerCalendar.tsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import Joyride from 'react-joyride';
import WorkerCalendarTourSteps from '@/components/tour/worker/WorkerCalendarTourSteps';

import FullCalendar from '@fullcalendar/react';
import { DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import esLocale from '@fullcalendar/core/locales/es';

import { useIntervaloCitaPorUsuario } from '@/components/hooks/useIntervaloCita';
import { useHorariosPorUsuario } from '@/components/hooks/useHorarios';
import { useDiasNoLaborablesPorUsuario } from '@/components/hooks/useDiasNoLaborables';
import { useDiasFestivos } from '@/components/hooks/useDiasFestivos';
import { useAusenciasPorUsuario } from '@/components/hooks/useAusencias';
import { useCalendarEventsPorTrabajador } from '@/components/hooks/useCalendarEvents';
import { useEstadoId } from '@/components/hooks/useEstado';

import { obtenerHorariosPorDia } from '@/components/utils/calendarUtils';

import AppointmentDetailDialog from '@/components/pages/dialogs/AppointmentDetailDialog';
import AnulationReasonDialog from '@/components/pages/dialogs/AnulationReasonDialog';
import CancellationReasonDialog from '@/components/pages/dialogs/CancellationReasonDialog';
import NewAppointmentDialog from '@/components/pages/dialogs/NewAppointmentDialog';
import PaymentTypeDialog from '@/components/pages/dialogs/PaymentTypeDialog';

import type { RawAppointment, TipoPago } from '@/components/types/typeCalendar';

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const WorkerCalendar = () => {
  const idUsuario = localStorage.getItem('id_usuario') || '';
  const idEmpresa = localStorage.getItem('id_empresa') || '';

  const [loading, setLoading] = useState(true);
  const [runTour, setRunTour] = useState(false);
  const [calendarView, setCalendarView] = useState<
    'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'
  >('timeGridDay');
  const [customTitle, setCustomTitle] = useState('');
  const calendarRef = useRef<FullCalendar | null>(null);

  const views = ['timeGridDay', 'timeGridWeek', 'dayGridMonth'] as const;

  const [fechaInicio, setFechaInicio] = useState<string | null>(null);
  const [fechaFin, setFechaFin] = useState<string | null>(null);

  const [verDialogoCita, setVerDialogoCita] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] =
    useState<RawAppointment | null>(null);
  const [mostrarDialogoCancelacion, setMostrarDialogoCancelacion] =
    useState(false);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mostrarDialogoPago, setMostrarDialogoPago] = useState(false);
  const [tipoPagoSeleccionado, setTipoPagoSeleccionado] =
    useState<TipoPago>('tarjeta');
  const [newCita, setNewCita] = useState({
    trabajador: idUsuario,
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  const [reloadKey, setReloadKey] = useState(0);

  const intervaloCita = useIntervaloCitaPorUsuario(idUsuario, idEmpresa);
  const horariosUsuario = useHorariosPorUsuario(idUsuario, idEmpresa);
  const diasNoLaborables = useDiasNoLaborablesPorUsuario(idUsuario, idEmpresa);
  const diasFestivos = useDiasFestivos(idEmpresa);
  const ausencias = useAusenciasPorUsuario(idUsuario, idEmpresa);

  const idEstadoCompletado = useEstadoId('completado');

  const events = useCalendarEventsPorTrabajador(
    idUsuario,
    idEmpresa,
    fechaInicio,
    fechaFin,
    diasNoLaborables,
    diasFestivos,
    ausencias,
    reloadKey
  );

  const scrollTime = useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours() - 2, 0, 0, 0);
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}:00`;
  }, []);

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
      return `${months[start.getMonth()]} de ${start.getFullYear()}`;
    }
    if (viewType === 'timeGridDay') {
      const d = String(start.getDate()).padStart(2, '0');
      return `${d} de ${months[start.getMonth()]} de ${start.getFullYear()}`;
    }
    const sd = String(start.getDate()).padStart(2, '0');
    const edDate = new Date(end.getTime() - 1);
    const ed = String(edDate.getDate()).padStart(2, '0');
    return `${sd}–${ed} de ${
      months[edDate.getMonth()]
    } de ${edDate.getFullYear()}`;
  };

  const handleSelect = (info: DateSelectArg) => {
    const [fecha, hora] = info.startStr.split('T');
    setNewCita((prev) => ({
      ...prev,
      fecha,
      hora: hora.slice(0, 5),
      trabajador: idUsuario,
    }));
    setDialogOpen(true);
  };

  const franjasPorDia = useMemo(
    () => obtenerHorariosPorDia(horariosUsuario),
    [horariosUsuario]
  );
  const businessHours = useMemo(
    () =>
      Object.entries(franjasPorDia).flatMap(([diaIndex, franjas]) =>
        franjas.map(({ hora_inicio, hora_fin }) => ({
          daysOfWeek: [Number(diaIndex)],
          startTime: hora_inicio,
          endTime: hora_fin,
        }))
      ),
    [franjasPorDia]
  );

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.scrollToTime({
        hours: new Date().getHours() - 1,
        minutes: 0,
        seconds: 0,
      });
    }
  }, [events]);

  useEffect(() => setLoading(false), []);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col h-screen space-y-6 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">Calendario</h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Joyride
          steps={WorkerCalendarTourSteps}
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
            if (status === 'finished' || status === 'skipped') {
              setRunTour(false);
            }
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {!isMobile && (
        <motion.div
          variants={itemVariants}
          className="w-full bg-white border rounded-xl shadow-sm p-4 flex items-center justify-center tour-view-selector"
        >
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setCalendarView(v)}
              className={`px-4 py-2 text-sm rounded-md transition ${
                calendarView === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {v === 'timeGridDay'
                ? 'Día'
                : v === 'timeGridWeek'
                ? 'Semana'
                : 'Mes'}
            </button>
          ))}
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="flex-1 flex flex-col rounded-xl border bg-white shadow-sm overflow-hidden"
      >
        {/* navigation */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50 tour-nav-buttons">
          <div className="flex gap-2">
            <button
              onClick={() => calendarRef.current?.getApi().prev()}
              className="text-sm px-3 py-1 rounded hover:bg-gray-200"
            >
              &lt;
            </button>
            <button
              onClick={() => {
                const api = calendarRef.current?.getApi();
                api?.today();
                api?.changeView(calendarView);
              }}
              className="text-sm px-3 py-1 rounded hover:bg-gray-200"
            >
              Hoy
            </button>
            <button
              onClick={() => calendarRef.current?.getApi().next()}
              className="text-sm px-3 py-1 rounded hover:bg-gray-200"
            >
              &gt;
            </button>
          </div>
          <div className="flex-1 text-center font-semibold text-gray-700 truncate">
            {customTitle}
          </div>
          <div style={{ width: 88 }} />
        </div>

        <div className="flex items-center gap-4 px-4 py-2 tour-legend">
          {[
            ['bg-blue-500', 'Confirmado'],
            ['bg-red-500', 'Cancelado'],
            ['bg-green-500', 'Completado'],
            ['bg-yellow-500', 'Anulado'],
          ].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={`w-4 h-4 ${bg}`}></span>
              <span className="text-sm text-gray-700">
                {isMobile ? label.slice(0, 4) : label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden tour-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            businessHours={businessHours}
            initialView={calendarView}
            key={calendarView}
            locale={esLocale}
            selectable
            select={handleSelect}
            slotDuration={intervaloCita}
            events={events}
            scrollTime={scrollTime}
            allDaySlot={false}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            nowIndicator
            headerToolbar={false}
            dayMaxEvents
            slotEventOverlap={false}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            height="100%"
            selectAllow={() => true}
            dateClick={({ dateStr }) => {
              if (!isMobile) return;
              const [fecha, hora] = dateStr.split('T');
              setNewCita((prev) => ({
                ...prev,
                fecha,
                hora: hora.slice(0, 5),
              }));
              setDialogOpen(true);
            }}
            eventClick={({ event }) => {
              if (
                event.display === 'background' ||
                event.extendedProps.tipo === 'bloqueado'
              )
                return;
              const fecha_cita = event.startStr.split('T')[0];
              const hora_cita = event.startStr.split('T')[1].slice(0, 5);
              const hora_fin = event.end?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              setCitaSeleccionada({
                id_cita: event.extendedProps.id_cita!,
                fecha_cita,
                hora_cita,
                hora_fin,
                estado_cita: event.extendedProps.estado || 'confirmado',
                tipo_pago: event.extendedProps.tipo_pago,
                observaciones: event.extendedProps.observaciones,
                telefono: event.extendedProps.telefono,
                email: event.extendedProps.email,
                email_contacto: event.extendedProps.email_contacto,
                motivo_cancelacion: event.extendedProps.motivo_cancelacion,
                motivo_anulado: event.extendedProps.motivo_anulado,
                fases_servicio: event.extendedProps.fases_servicio,
                nombre_servicio: event.title,
                duracion_minutos: event.extendedProps.duracion_minutos,
                nombre_completo: event.extendedProps.nombre_completo,
                precio: event.extendedProps.precio,
              });
              setVerDialogoCita(true);
            }}
            eventContent={({ event }) => {
              if (event.display === 'background') return null;
              const est = event.extendedProps.estado?.toLowerCase();
              const fase = event.extendedProps.tipo_fase;
              let bg = 'bg-blue-500',
                tc = 'text-white';
              if (est === 'cancelado') bg = 'bg-red-500';
              if (est === 'completado') bg = 'bg-green-500';
              if (est === 'anulado') bg = 'bg-yellow-500';
              if (fase === 'descanso') {
                bg = 'bg-gray-200';
                tc = 'text-gray-700';
              }
              const hi = event.start?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const hf = event.end?.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const icons: Record<string, string> = {
                tarjeta: '💳',
                efectivo: '💵',
                bizum: '📲',
                otros: '💼',
              };
              const icon = icons[event.extendedProps.tipo_pago!];
              return (
                <div
                  className={`text-[11px] px-1 py-0.5 truncate rounded ${bg} ${tc} flex items-center gap-1`}
                >
                  {(est === 'completado' || est === 'anulado') && icon && (
                    <span title={event.extendedProps.tipo_pago}>{icon}</span>
                  )}
                  <span>
                    {`${hi} - ${hf} ${event.title}`}
                    {calendarView === 'timeGridDay' &&
                    event.extendedProps.telefono
                      ? ` - 📞 ${event.extendedProps.telefono}`
                      : ''}
                  </span>
                </div>
              );
            }}
            eventDidMount={(info) => {
              const t = info.event.extendedProps.tipo;
              if (t) info.el.setAttribute('data-tipo', t);
              info.el.classList.add('tour-event-click');
            }}
            datesSet={({ start, end, view }) => {
              let s = start,
                e = new Date(end.getTime() - 1);
              if (view.type === 'dayGridMonth' && firstTimeMonthView) {
                const today = new Date();
                s = new Date(today.getFullYear(), today.getMonth(), 1);
                e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setFirstTimeMonthView(false);
              } else if (view.type === 'dayGridMonth') {
                const cur = calendarRef.current?.getApi().getDate();
                if (cur) {
                  s = new Date(cur.getFullYear(), cur.getMonth(), 1);
                  e = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
                }
              }
              setCustomTitle(generateTitle(s, e, view.type));
              setFechaInicio(s.toISOString().split('T')[0]);
              setFechaFin(e.toISOString().split('T')[0]);
            }}
          />
        </div>
      </motion.div>

      {/* Dialogs */}
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
          onReabrir={() => setVerDialogoCita(false)}
          onAnular={() => {
            setMostrarDialogoAnulacion(true);
            setVerDialogoCita(false);
          }}
          incrementReload={() => setReloadKey((k) => k + 1)}
        />
      )}
      {mostrarDialogoCancelacion && citaSeleccionada && (
        <CancellationReasonDialog
          idCita={citaSeleccionada.id_cita}
          motivo={motivoCancelacion}
          setMotivo={setMotivoCancelacion}
          onCancel={() => {
            setMostrarDialogoCancelacion(false);
            setVerDialogoCita(true);
          }}
          onCloseAll={() => {
            setMostrarDialogoCancelacion(false);
            setVerDialogoCita(false);
          }}
          incrementReload={() => setReloadKey((k) => k + 1)}
        />
      )}
      {mostrarDialogoAnulacion && citaSeleccionada && (
        <AnulationReasonDialog
          idCita={citaSeleccionada.id_cita}
          motivo={motivoAnulacion}
          setMotivo={setMotivoAnulacion}
          onCancel={() => {
            setMostrarDialogoAnulacion(false);
            setVerDialogoCita(true);
          }}
          onCloseAll={() => {
            setMostrarDialogoAnulacion(false);
            setVerDialogoCita(false);
          }}
          incrementReload={() => setReloadKey((k) => k + 1)}
        />
      )}
      {mostrarDialogoPago && (
        <PaymentTypeDialog
          idCita={citaSeleccionada!.id_cita}
          tipoPago={tipoPagoSeleccionado}
          setTipoPago={(v) => setTipoPagoSeleccionado(v as TipoPago)}
          onCancel={() => {
            setMostrarDialogoPago(false);
            setVerDialogoCita(true);
          }}
          onCloseAll={() => {
            setMostrarDialogoPago(false);
            setVerDialogoCita(false);
          }}
          incrementReload={() => setReloadKey((k) => k + 1)}
          idEstadoCompletado={idEstadoCompletado!}
          precio={citaSeleccionada!.precio}
        />
      )}
      {dialogOpen && (
        <NewAppointmentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCitaCreada={() => {
            setDialogOpen(false);
            setReloadKey((k) => k + 1);
          }}
          incluirTrabajador={false}
          initialData={newCita}
          onChangeCita={setNewCita}
          idEmpresa={idEmpresa}
          idUsuario={idUsuario}
        />
      )}
    </motion.div>
  );
};

export default WorkerCalendar;
