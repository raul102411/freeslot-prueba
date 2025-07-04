import { Step } from 'react-joyride';

const DisplayQRTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta pantalla te muestra el <strong>código QR</strong> que puedes usar
        para que tus clientes reserven de forma rápida y sencilla.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-qr-container',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí se muestra la <strong>imagen del código QR</strong>. Tus clientes
        pueden escanearlo con su móvil para acceder directamente al sistema de
        reservas online.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-link-text',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este es el <strong>enlace directo de reservas</strong>. Puedes
        compartirlo por WhatsApp, redes sociales, o incluirlo en tu sitio web.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-download-button',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Pulsa este botón para <strong>descargar el QR</strong> como imagen
        (formato PNG). Ideal para imprimirlo o usarlo en materiales físicos.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-copy-button',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este botón para <strong>copiar el enlace</strong> de reservas al
        portapapeles y pegarlo donde lo necesites.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default DisplayQRTourSteps;
