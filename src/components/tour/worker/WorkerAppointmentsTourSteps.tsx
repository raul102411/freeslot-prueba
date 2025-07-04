import { Step } from 'react-joyride';

const WorkerAppointmentsTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        En esta sección puedes <strong>ver todas tus citas</strong>. Filtra por
        fecha, estado o servicio, y exporta tus resultados fácilmente si lo
        necesitas.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-date-range',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Usa este selector para <strong>elegir un rango de fechas</strong> y ver
        únicamente las citas programadas en ese período.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-export',
    content: (
      <div style={{ textAlign: 'justify' }}>
        ¿Necesitas llevar un registro? Aquí puedes{' '}
        <strong>exportar tus citas</strong> a formato Excel o PDF para imprimir
        o guardar.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-search-legend',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Filtra los resultados buscando por{' '}
        <strong>nombre de servicio, teléfono</strong> del cliente o
        seleccionando el <strong>estado de la cita</strong> (pendiente,
        finalizada, cancelada...).
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-table',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí se muestran todas tus <strong>citas detalladas</strong> según los
        filtros aplicados: hora, cliente, servicio, estado y más.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-pagination',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Si tienes muchas citas en la lista,{' '}
        <strong>usa los botones de navegación</strong> para pasar de una página
        a otra.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default WorkerAppointmentsTourSteps;
