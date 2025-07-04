import { Step } from 'react-joyride';

const WorkersTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección de <strong>Trabajadores</strong>. Desde aquí
        puedes añadir, gestionar o editar a los miembros de tu equipo. Es
        esencial tenerlos bien configurados para que puedan recibir citas
        correctamente.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-add-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para <strong>añadir un nuevo trabajador</strong>. Podrás
        asignarle servicios, configurar su horario y establecer si está activo o
        no para recibir citas.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-filter-input',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este buscador para <strong>filtrar rápidamente</strong> por nombre o
        correo electrónico del trabajador.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-table',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí verás una tabla con todos los trabajadores registrados y detalles
        como su email, estado de activación, intervalo de cita, servicios, etc.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-edit-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic en este botón para <strong>editar los datos</strong> de un
        trabajador ya existente: modificar servicios, horarios, o desactivarlo
        si es necesario.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-dialog',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este es el formulario de creación o edición de un trabajador. Aquí
        podrás:
        <br />
        <br />• Seleccionar los <strong>servicios</strong> que podrá ofrecer.
        <br />• Definir su <strong>horario de atención</strong> por cada día de
        la semana.
        <br />• Indicar el <strong>intervalo de cita</strong>: el tiempo mínimo
        entre una cita y la siguiente (ejemplo: 15 minutos).
        <br />• Marcar si está <strong>activo</strong> para aparecer como
        disponible en la agenda.
        <br />
        <br />
        <strong>Importante:</strong> al crear un trabajador, se le enviará
        automáticamente un correo electrónico para que{' '}
        <strong>active su cuenta y configure su contraseña</strong>.
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si tienes muchos trabajadores registrados, aquí puedes navegar entre
        páginas para visualizar todos los registros.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default WorkersTourSteps;
