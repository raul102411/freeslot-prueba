import { Step } from 'react-joyride';

const WorkerCalendarTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a tu <strong>Calendario de trabajador</strong>. Aquí puedes
        ver todas tus citas organizadas por día, semana o mes.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-view-selector',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa estos botones para <strong>cambiar la vista</strong> del calendario.
        Puedes ver tus citas en formato diario, semanal o mensual.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-nav-buttons',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Navega fácilmente al <strong>día anterior</strong>, vuelve a{' '}
        <strong>hoy</strong>, o avanza al siguiente día con estos controles.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-legend',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta leyenda te ayuda a <strong>interpretar los colores</strong> de cada
        cita según su estado (pendiente, finalizada, cancelada, etc.).
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-calendar',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí verás todas tus <strong>citas programadas</strong> según el rango y
        la vista seleccionados. También puedes ver los huecos disponibles en tu
        horario.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-event-click',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic en cualquier cita del calendario para{' '}
        <strong>ver sus detalles</strong> o realizar acciones como marcarla como
        completada o cancelarla.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default WorkerCalendarTourSteps;
