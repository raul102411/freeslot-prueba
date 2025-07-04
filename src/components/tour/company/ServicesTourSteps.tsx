import { Step } from 'react-joyride';

const ServicesTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección de <strong>Servicios</strong>. Aquí puedes
        gestionar todos los servicios que ofrece tu empresa a los clientes. Es
        fundamental tenerlos configurados correctamente para que puedan
        reservarse online o asignarse a trabajadores.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-add-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Pulsa aquí para crear un nuevo servicio. Podrás introducir:
        <br />
        <br />• El <strong>nombre</strong> del servicio.
        <br />• Una <strong>descripción</strong> opcional.
        <br />• El <strong>precio</strong> en euros.
        <br />• La <strong>duración</strong> estimada en minutos.
        <br />• Y decidir si el servicio está <strong>activo</strong> o no.
        <br />
        <br />
        Importante: las fases del servicio solo se pueden añadir después de
        crearlo.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-filter-input',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este campo para buscar entre tus servicios por nombre, descripción,
        precio o duración. Es útil si tienes muchos registrados.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-table',
    content: (
      <div style={{ textAlign: 'justify' }}>
        En esta tabla puedes ver el listado completo de servicios con sus datos
        clave: nombre, precio, duración, descripción y estado (activo o no).
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-edit-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Pulsa este botón para editar los detalles del servicio. Si ya ha sido
        creado, también tendrás acceso para editar sus <strong>fases</strong>.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si tienes muchos servicios, puedes navegar por las páginas con estos
        botones.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-dialog',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este es el formulario para <strong>crear o editar un servicio</strong>.
        <br />
        <br />
        Una vez creado, podrás añadir <strong>fases</strong> al servicio. Las
        fases permiten dividirlo en partes más pequeñas, indicando cuánto dura
        cada una y si requiere atención directa del trabajador.
        <br />
        <br />
        <strong>Ejemplo:</strong>
        <br />
        Para un servicio de <em>"Tinte de pelo"</em>, podrías configurar estas
        fases:
        <br />
        • Aplicación del tinte (15 min, requiere atención)
        <br />
        • Tiempo de actuación del producto (30 min, sin atención)
        <br />
        • Lavado y secado (20 min, requiere atención)
        <br />
        <br />
        Esto permite optimizar la agenda, dejando huecos para otras citas
        mientras el cliente espera.
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

export default ServicesTourSteps;
