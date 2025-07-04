import { Step } from 'react-joyride';

const GenerateQRTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido al <strong>generador de Código QR</strong>. Aquí podrás
        habilitar reservas online y compartir un enlace para que tus clientes
        puedan agendar citas fácilmente desde su móvil.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-toggle-online',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este switch te permite <strong>activar o desactivar</strong> las
        reservas online. Si está apagado, los clientes no podrán acceder a tu
        agenda.
      </div>
    ),
    placement: 'right',
    disableBeacon: true,
  },
  {
    target: '.tour-generate-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Haz clic aquí para <strong>generar un nuevo Código QR</strong>. Este
        código estará vinculado a tu empresa y solo funcionará si las reservas
        online están activas.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-qr-display',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí se muestra el <strong>QR generado</strong>. Puedes usarlo para
        imprimirlo, compartirlo o colocarlo en tu local para que los clientes
        escaneen y reserven directamente.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-download-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Descarga la imagen del Código QR en formato PNG para poder usarla en
        carteles, redes sociales o folletos.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-copy-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Copia el <strong>enlace directo de reservas</strong> para compartirlo
        por WhatsApp, email o redes.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-delete-btn',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si ya no quieres usar este código, puedes eliminarlo aquí. Se solicitará
        una confirmación antes de borrarlo.
      </div>
    ),
    placement: 'left',
    disableBeacon: true,
  },
  {
    target: '.tour-dialog',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este es el <strong>diálogo de confirmación</strong>. Asegúrate de que
        realmente deseas eliminar el Código QR, ya que se perderá el enlace
        generado.
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

export default GenerateQRTourSteps;
