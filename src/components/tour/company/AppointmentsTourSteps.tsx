import { Step } from 'react-joyride';

const AppointmentsTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido a la sección de <strong>Citas</strong>. Aquí podrás
        consultar, filtrar, buscar y exportar todas las reservas que han
        realizado tus clientes.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-date-filters',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa estos campos para <strong>elegir un rango de fechas</strong> y ver
        solo las citas que se realizaron entre esos días.
        <br />
        Por ejemplo: del 1 al 15 de este mes.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-export-buttons',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si necesitas guardar o compartir la información, puedes{' '}
        <strong>exportar el listado de citas</strong> en formato Excel o PDF.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-search-input',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí puedes <strong>buscar citas</strong> por nombre del trabajador,
        servicio prestado o número de teléfono del cliente.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-state-filters',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Filtra las citas según su <strong>estado actual</strong>: confirmadas,
        anuladas, completadas, canceladas, etc. Marca o desmarca las casillas
        según lo que desees ver.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-appointments-table',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Esta tabla muestra todas las{' '}
        <strong>citas que coinciden con los filtros</strong> que hayas aplicado.
        Incluye información como cliente, servicio, hora, precio y estado.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si hay muchas citas, usa estos botones para{' '}
        <strong>cambiar de página</strong> y ver el resto de los resultados.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default AppointmentsTourSteps;
