// src/components/utils/calendarUtils.ts

import type {
  RawAppointment,
  FaseServicio,
  Horario,
  CalendarEvent,
  DiaAusencia,
} from '@/components/types/typeCalendar';

// 1. Mapeo de RawAppointment a CalendarEvent
export function mapearCitas(data: RawAppointment[]): CalendarEvent[] {
  const eventos: CalendarEvent[] = [];

  data.forEach((cita) => {
    const [hStart, mStart] = cita.hora_cita.split(':').map(Number);
    let inicio = new Date(cita.fecha_cita);
    inicio.setHours(hStart, mStart, 0, 0);

    const commonProps = {
      estado: cita.estado_cita,
      tipo_pago: cita.tipo_pago,
      observaciones: cita.observaciones,
      telefono: cita.telefono,
      email: cita.email,
      email_contacto: cita.email_contacto,
      motivo_cancelacion: cita.motivo_cancelacion || '',
      motivo_anulado: cita.motivo_anulado || '',
      duracion_minutos: cita.duracion_minutos,
      nombre_completo: cita.nombre_completo,
      precio: cita.precio,
    };

    if (
      cita.estado_cita === 'confirmado' &&
      Array.isArray(cita.fases_servicio)
    ) {
      cita.fases_servicio.forEach((fase: FaseServicio, idx: number) => {
        const duracion = fase.duracion_minutos || 0;
        const fin = new Date(inicio.getTime() + duracion * 60000);
        const tipoFase = fase.requiere_atencion ? 'atencion' : 'descanso';

        eventos.push({
          id: `${cita.id_cita}-${tipoFase}-${idx}`,
          groupId: cita.id_cita,
          title:
            tipoFase === 'atencion'
              ? `${cita.nombre_servicio} - ${fase.nombre_fase}`
              : fase.nombre_fase,
          start: inicio.toISOString(),
          end: fin.toISOString(),
          classNames: [`fase-${tipoFase}`],
          display: tipoFase === 'descanso' ? 'background' : 'auto',
          backgroundColor: colorPorId(cita.id_cita),
          borderColor: colorPorId(cita.id_cita),
          extendedProps: {
            ...commonProps,
            tipo_fase: tipoFase,
            id_cita: cita.id_cita,
          },
        });

        inicio = fin;
      });
    } else {
      const fin = cita.hora_fin
        ? (() => {
            const [hEnd, mEnd] = cita.hora_fin!.split(':').map(Number);
            const d = new Date(cita.fecha_cita);
            d.setHours(hEnd, mEnd, 0, 0);
            return d;
          })()
        : new Date(inicio.getTime() + 60 * 60000);

      eventos.push({
        id: cita.id_cita,
        groupId: cita.id_cita,
        title: cita.nombre_servicio,
        start: inicio.toISOString(),
        end: fin.toISOString(),
        classNames: ['fase-atencion'],
        backgroundColor: colorPorId(cita.id_cita),
        borderColor: colorPorId(cita.id_cita),
        extendedProps: {
          ...commonProps,
          tipo_fase: 'atencion',
          id_cita: cita.id_cita,
        },
      });
    }
  });

  return eventos;
}

// 2. Obtener horarios por día de la seman
function normalizeDayName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function obtenerHorariosPorDia(
  horarios: Horario[]
): Record<number, { hora_inicio: string; hora_fin: string }[]> {
  const nameToIndex: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
  };

  const byDia: Record<number, { hora_inicio: string; hora_fin: string }[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  horarios.forEach(({ dia_semana, hora_inicio, hora_fin }) => {
    const key = normalizeDayName(dia_semana);
    const idx = nameToIndex[key];
    if (idx === undefined) {
      console.warn(`Horario: día desconocido "${dia_semana}"`);
      return;
    }
    byDia[idx].push({ hora_inicio, hora_fin });
  });

  return byDia;
}

// 3. Generar eventos bloqueados según horarios
export function generarEventosBloqueados(
  startWeek: Date,
  horariosPorDia: Record<string, { hora_inicio: string; hora_fin: string }[]>,
  diasNoLaborables: string[]
): CalendarEvent[] {
  const eventos: CalendarEvent[] = [];
  const dias = [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ];
  const diasLower = diasNoLaborables.map((d) => d.toLowerCase());

  dias.forEach((dia, idx) => {
    if (!diasLower.includes(dia)) {
      const fecha = new Date(startWeek);
      fecha.setDate(fecha.getDate() + idx);

      const franjas = horariosPorDia[dia] || [];
      let inicio = '00:00';

      franjas
        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
        .forEach(({ hora_inicio, hora_fin }) => {
          if (inicio < hora_inicio) {
            eventos.push(createBloqueoEvent(fecha, inicio, hora_inicio));
          }
          inicio = hora_fin > inicio ? hora_fin : inicio;
        });

      if (inicio < '23:59') {
        eventos.push(createBloqueoEvent(fecha, inicio, '23:59'));
      }
    }
  });

  return eventos;
}

function createBloqueoEvent(
  fecha: Date,
  startTime: string,
  endTime: string
): CalendarEvent {
  const s = new Date(fecha);
  const [hs, ms] = startTime.split(':').map(Number);
  s.setHours(hs, ms, 0, 0);

  const e = new Date(fecha);
  const [he, me] = endTime.split(':').map(Number);
  e.setHours(he, me, 0, 0);

  return {
    start: s.toISOString(),
    end: e.toISOString(),
    display: 'background',
    // le damos un color concreto en vez de confiar en la clase CSS
    backgroundColor: '#f0f0f0',
    borderColor: '#f0f0f0',
    extendedProps: { tipo: 'bloqueado' },
  };
}

// 4. Eventos de ausencias (por día)
export function buildEventosAusencias(
  ausencias: DiaAusencia[]
): CalendarEvent[] {
  return ausencias.map(({ fecha }) => {
    const start = new Date(fecha);
    const end = new Date(fecha);
    end.setDate(end.getDate() + 1);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      display: 'background',
      classNames: ['ausencia-aprobada-bg'],
      allDay: true,
      extendedProps: { tipo: 'bloqueado' },
    };
  });
}

// 5. Eventos de festivos
export function buildEventosFestivos(
  fechasFestivos: string[]
): CalendarEvent[] {
  return fechasFestivos.map((fecha) => {
    const start = new Date(fecha);
    const end = new Date(fecha);
    end.setDate(end.getDate() + 1);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      display: 'background',
      classNames: ['bloqueado-bg'],
      allDay: true,
      extendedProps: { tipo: 'bloqueado' },
    };
  });
}

// 6. Eventos de no laborables personalizados
export function buildEventosNoLaborables(
  fechasNoLaborables: string[]
): CalendarEvent[] {
  return fechasNoLaborables.map((fecha) => ({
    start: fecha,
    end: fecha,
    display: 'background',
    classNames: ['no-laborable-bg'],
    allDay: true,
  }));
}

// 7. Generación de color basado en ID
export function colorPorId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return '#' + ((hash >> 0) & 0xffffff).toString(16).padStart(6, '0');
}
