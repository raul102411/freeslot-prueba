import { Step } from 'react-joyride';

const ProfilesTourSteps: Step[] = [
  {
    target: '.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección de <strong>Seleccionar perfil</strong>. Aquí
        verás todos los perfiles que tienes disponibles en diferentes empresas o
        roles.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-switch',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Puedes activar el <strong>inicio automático</strong> para un perfil
        concreto. Esto hará que al iniciar sesión se te redirija directamente a
        ese panel sin tener que seleccionarlo manualmente.
        <br />
        <br />
        Solo se puede tener uno activo.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-login-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Pulsa este botón para <strong>iniciar sesión con ese perfil</strong>. Se
        te llevará directamente al panel correspondiente.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-logout-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Desde aquí puedes cerrar tu sesión y salir de la aplicación de forma
        segura.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default ProfilesTourSteps;
