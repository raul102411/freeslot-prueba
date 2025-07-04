import { Step } from 'react-joyride';

const BlacklistTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección de <strong>Lista Negra</strong>. Aquí puedes
        bloquear números de teléfono o correos electrónicos de clientes que ya
        no desees que reserven en tu negocio.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-add-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para <strong>añadir un nuevo registro</strong> a la lista
        negra.
        <br />
        Deberás introducir el teléfono o email y, si lo deseas, un motivo.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-filter-input',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este campo para <strong>buscar rápidamente</strong> un registro por
        número o correo electrónico.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-table',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta tabla muestra todos los registros que{' '}
        <strong>han sido bloqueados</strong>, con sus detalles: motivo, fecha y
        estado.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-edit-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para <strong>editar los datos de un registro</strong>,
        como el motivo o el email.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-delete-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si deseas <strong>eliminar un registro</strong> de la lista negra, haz
        clic en este botón. Se te pedirá una confirmación.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-dialog',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí puedes <strong>confirmar o cancelar la eliminación</strong>. Una
        vez eliminado, ese cliente podrá volver a reservar.
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si tienes muchos registros en la lista negra, usa estos botones para{' '}
        <strong>navegar entre las páginas</strong>.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default BlacklistTourSteps;
