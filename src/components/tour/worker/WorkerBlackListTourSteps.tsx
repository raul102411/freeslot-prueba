import { Step } from 'react-joyride';

const WorkerBlackListTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        En esta sección puedes{' '}
        <strong>ver y gestionar tu lista negra personal</strong>, es decir, los
        teléfonos o emails bloqueados que no podrán reservar contigo.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-filter',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este campo para <strong>buscar rápidamente</strong> un registro
        específico por teléfono o correo electrónico.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-new-button',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Pulsa aquí para <strong>añadir un nuevo número o email</strong> a tu
        lista negra. Esto impedirá que esa persona pueda agendar citas contigo.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-table',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta tabla muestra los <strong>registros bloqueados actualmente</strong>{' '}
        que tú has agregado. Puedes ver su detalle o editarlos si es necesario.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si tienes muchos registros, <strong>usa la paginación</strong> para
        recorrerlos fácilmente.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default WorkerBlackListTourSteps;
