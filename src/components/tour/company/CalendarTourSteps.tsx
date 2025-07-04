import { Step } from 'react-joyride';

const CalendarTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido al <strong>Calendario</strong>. Aquí puedes ver, gestionar y
        crear citas de forma visual, navegando entre días, semanas o el mes
        completo.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-view-selector',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este selector para <strong>cambiar la vista</strong> del calendario.
        Puedes ver tus citas por día, semana o mes, según prefieras.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-prev-today-next',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa estos botones para <strong>navegar entre fechas</strong>: ir al día
        anterior, volver a hoy o avanzar al siguiente periodo.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-title-display',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta área muestra el <strong>intervalo de tiempo actual</strong>, como
        "Semana del 10 al 16 de junio".
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-event-grid',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí verás tus <strong>citas y eventos programados</strong>. Cada bloque
        representa una cita según su horario. Pasa el cursor o haz clic para más
        detalles.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-new-appointment',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Puedes <strong>crear una nueva cita</strong> arrastrando en el
        calendario o seleccionando un rango de tiempo.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-event-click',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic sobre una cita para <strong>ver los detalles completos</strong>{' '}
        y acceder a opciones como modificar, completar o cancelar.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-dialog',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Desde estos diálogos podrás <strong>gestionar acciones</strong> como
        marcar una cita como completada, cancelarla o anularla con un motivo.
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

export default CalendarTourSteps;
