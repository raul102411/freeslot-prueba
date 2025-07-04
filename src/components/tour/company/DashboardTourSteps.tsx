import { Step } from 'react-joyride';

const DashboardTourSteps: Step[] = [
  {
    target: 'h1.tour-title',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Bienvenido al <strong>Dashboard</strong>. Aquí puedes ver un resumen
        general del funcionamiento de tu empresa: citas, ingresos, ocupación,
        trabajadores y más. Ideal para tomar decisiones rápidas.
      </div>
    ),
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-citasHoy',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Muestra el <strong>número total de citas programadas para hoy</strong>.
        Esto te ayuda a conocer la carga de trabajo diaria de tu equipo.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-citasMes',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí verás <strong>todas las citas realizadas en el mes actual</strong>,
        ya sean confirmadas o completadas. Es útil para hacer un seguimiento de
        la actividad mensual.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-trabajadores',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Indica la <strong>cantidad de trabajadores activos registrados</strong>{' '}
        en tu empresa. Son aquellos que pueden recibir reservas y tienen horario
        asignado.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-serviciosDisponibles',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Muestra el número de <strong>servicios que están activos</strong> y
        disponibles para ser reservados por tus clientes.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-facturadoMes',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Refleja el <strong>importe total facturado</strong> este mes por todas
        las citas completadas. Solo se cuentan las que han sido finalizadas con
        éxito.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-tasaOcupacion',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Representa el <strong>porcentaje de ocupación</strong> mensual. Se
        calcula comparando las horas reservadas con las horas disponibles en los
        horarios de tus trabajadores.
        <br />
        <br />
        Un valor alto indica una buena utilización de los recursos.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-clientesUnicos',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Total de <strong>clientes únicos</strong> que han reservado al menos una
        cita este mes. Se identifica por su número de teléfono.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-metric-cancelacionesMes',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Aquí se muestra el{' '}
        <strong>número total de citas canceladas o anuladas</strong> durante el
        mes. Un dato importante para detectar posibles incidencias o clientes no
        comprometidos.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '.tour-chart',
    content: (
      <div style={{ textAlign: 'justify' }}>
        Este gráfico muestra los <strong>servicios más demandados</strong> en lo
        que va del mes. Es útil para saber qué ofrece más valor a tus clientes y
        qué podría mejorarse o promocionarse.
      </div>
    ),
    placement: 'top',
    disableBeacon: true,
  },
];

export default DashboardTourSteps;
