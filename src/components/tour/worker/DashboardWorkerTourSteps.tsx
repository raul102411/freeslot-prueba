import { Step } from 'react-joyride';

const DashboardWorkerTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a tu <strong>Dashboard de trabajador</strong>. Aquí puedes
        ver un resumen claro y rápido de tus citas, servicios asignados y
        cualquier alerta relevante del día.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-alert',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si hoy no tienes horario configurado, verás esta <strong>alerta</strong>
        . Esto significa que no puedes recibir citas hoy a menos que se ajuste
        tu disponibilidad.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-citasHoy',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí verás cuántas <strong>citas tienes programadas para hoy</strong>.
        Es útil para organizar tu jornada desde primera hora.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-citasPendientes',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Estas son las citas que están{' '}
        <strong>pendientes de confirmación o finalización</strong>. Revisa esta
        sección para mantener tu agenda al día.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-servicios',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Muestra el número de <strong>servicios que tienes asignados</strong>. Si
        necesitas añadir más, consulta con el administrador de tu empresa.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-notificaciones',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí verás las <strong>notificaciones pendientes</strong> que requieren
        tu atención, como cambios en citas o nuevas solicitudes.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: 'h2.tour-upcoming-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        En esta sección se listan <strong>tus próximas citas</strong>. Puedes
        ver todos los detalles importantes como hora, cliente y servicio.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default DashboardWorkerTourSteps;
