import { Step } from 'react-joyride';

const CompanyProfileTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección <strong>Perfil de la Empresa</strong>. Aquí
        podrás configurar toda la información general de tu negocio, desde el
        nombre y el logo, hasta el horario de atención.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-logo',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para <strong>subir o cambiar el logo</strong> de tu
        empresa. Este logo se mostrará en la interfaz pública y en algunos
        documentos como el QR o citas.
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.tour-schedule-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí puedes <strong>configurar el horario de atención</strong> semanal
        de tu empresa. Define qué días y horas estás disponible para que los
        clientes puedan reservar.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-holiday-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        En este botón puedes <strong>añadir días festivos</strong> o excepciones
        en las que tu empresa no atenderá, como vacaciones o cierres especiales.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-inputs',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí puedes <strong>editar los datos principales</strong> de tu empresa
        como el nombre, dirección, provincia, teléfono o email de contacto.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-save-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Una vez hayas realizado cambios, haz clic aquí para{' '}
        <strong>guardarlos</strong> y actualizar tu perfil.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
];

export default CompanyProfileTourSteps;
