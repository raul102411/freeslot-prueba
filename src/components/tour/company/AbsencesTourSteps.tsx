import { Step } from 'react-joyride';

const AbsencesTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección de <strong>Ausencias</strong>. Aquí puedes
        gestionar solicitudes de ausencia de tus trabajadores y consultar el
        histórico de ausencias aprobadas o rechazadas.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-pendientes-section',
    content: (
      <div style={{ textAlign: 'justify' }}>
        En esta sección aparecen todas las{' '}
        <strong>solicitudes de ausencia pendientes</strong>, que aún no han sido
        aprobadas ni rechazadas.
        <br />
        Puedes gestionarlas manualmente.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-aprobar-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para <strong>aprobar una solicitud de ausencia</strong>.
        El trabajador será notificado automáticamente.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-rechazar-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic para <strong>rechazar una solicitud</strong>. Se te pedirá que
        ingreses un motivo, el cual también verá el trabajador.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-historico-section',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí puedes consultar el{' '}
        <strong>histórico de todas las ausencias</strong>, ya sean aprobadas,
        rechazadas o en cualquier estado anterior.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-historico-input',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este campo para <strong>filtrar ausencias</strong> por nombre del
        trabajador, email o tipo de ausencia (por ejemplo: vacaciones, baja
        médica, etc.).
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si hay muchas ausencias, puedes{' '}
        <strong>navegar entre las páginas</strong> con estos controles.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-rechazo-dialog',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este es el <strong>formulario donde debes indicar el motivo</strong> del
        rechazo. Es importante que el mensaje sea claro para el trabajador.
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

export default AbsencesTourSteps;
