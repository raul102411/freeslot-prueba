import { Step } from 'react-joyride';

const WorkerProfileTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta es la vista de tu <strong>perfil de trabajador</strong>, donde
        puedes consultar tu información personal, servicios asignados y
        calendario.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-foto',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí aparece tu <strong>foto de perfil</strong>. Si no has subido una
        imagen, se mostrarán tus iniciales.
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.tour-contacto',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Tus <strong>datos de contacto</strong>: el correo electrónico asociado a
        tu cuenta y tu número de teléfono.
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.tour-horario-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para ver tu <strong>horario semanal</strong>, es decir,
        los días y horas en los que puedes recibir citas.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-servicios-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí puedes consultar los{' '}
        <strong>servicios que tienes asignados</strong>. Solo podrás recibir
        citas de esos servicios.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-calendario-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Desde el calendario podrás <strong>solicitar ausencias</strong> en los
        días que no puedas trabajar y también ver los{' '}
        <strong>días festivos</strong> definidos por la empresa.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
];

export default WorkerProfileTourSteps;
