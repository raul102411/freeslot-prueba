import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
  RawAppointment,
  DiaAusencia,
  CalendarEvent,
} from '@/components/types/typeCalendar';
import {
  mapearCitas,
  buildEventosAusencias,
  buildEventosFestivos,
  buildEventosNoLaborables,
} from '@/components/utils/calendarUtils';

export function useCalendarEventsPorTrabajador(
  idUsuario: string,
  idEmpresa: string,
  fechaInicio: string | null,
  fechaFin: string | null,
  diasNoLaborables: string[],
  diasFestivos: string[],
  ausencias: DiaAusencia[],
  reloadKey: number
) {
  const [citasEvt, setCitasEvt] = useState<CalendarEvent[]>([]);

  // 1. Fetch inicial
  useEffect(() => {
    if (!idUsuario || idUsuario === 'skip' || !fechaInicio || !fechaFin) return;
    let mounted = true;

    supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_usuario', idUsuario)
      .eq('id_empresa', idEmpresa)
      .gte('fecha_cita', fechaInicio)
      .lte('fecha_cita', fechaFin)
      .then(({ data, error }) => {
        if (mounted && !error && data) {
          // forzamos el tipo aquí:
          const rows = data as RawAppointment[];
          setCitasEvt(mapearCitas(rows));
        }
      });

    return () => {
      mounted = false;
    };
  }, [idUsuario, idEmpresa, fechaInicio, fechaFin, reloadKey]);

  // 2. Realtime
  useEffect(() => {
    if (!idUsuario || idUsuario === 'skip' || !fechaInicio || !fechaFin) return;

    const channel = supabase
      .channel(`citas-realtime-${idUsuario}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'citas' },
        async (payload) => {
          console.log('[Realtime]', payload);
          const id_cita =
            payload.eventType === 'DELETE'
              ? payload.old.id_cita
              : payload.new.id_cita;

          const { data, error } = await supabase
            .from('vista_citas_detalle')
            .select('*')
            .eq('id_cita', id_cita)
            .single();

          if (payload.eventType === 'DELETE') {
            setCitasEvt((prev) =>
              prev.filter((evt) => evt.groupId !== id_cita)
            );
          } else if (!error && data) {
            // data es any, casteamos:
            const row = data as RawAppointment;
            const updatedEvt = mapearCitas([row]);
            setCitasEvt((prev) => {
              const sinAntiguo = prev.filter((evt) => evt.groupId !== id_cita);
              return [...sinAntiguo, ...updatedEvt];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idUsuario, fechaInicio, fechaFin]);

  // 3. Eventos estáticos
  const noLabEvt = useMemo(
    () => buildEventosNoLaborables(diasNoLaborables),
    [diasNoLaborables]
  );
  const festivosEvt = useMemo(
    () => buildEventosFestivos(diasFestivos),
    [diasFestivos]
  );
  const ausenciasEvt = useMemo(
    () => buildEventosAusencias(ausencias),
    [ausencias]
  );

  // 4. Combina todo
  const events = useMemo(
    () => [...noLabEvt, ...ausenciasEvt, ...festivosEvt, ...citasEvt],
    [noLabEvt, ausenciasEvt, festivosEvt, citasEvt]
  );

  return events;
}

export function useCalendarEventsPorEmpresa(
  idEmpresa: string,
  fechaInicio: string | null,
  fechaFin: string | null,
  diasNoLaborables: string[],
  diasFestivos: string[],
  reloadKey: number
) {
  const [citasEvt, setCitasEvt] = useState<CalendarEvent[]>([]);

  // 1. Fetch inicial
  useEffect(() => {
    if (!fechaInicio || !fechaFin) return;
    let mounted = true;

    supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .gte('fecha_cita', fechaInicio)
      .lte('fecha_cita', fechaFin)
      .then(({ data, error }) => {
        if (mounted && !error && data) {
          const rows = data as RawAppointment[];
          setCitasEvt(mapearCitas(rows));
        }
      });

    return () => {
      mounted = false;
    };
  }, [idEmpresa, fechaInicio, fechaFin, reloadKey]);

  // 2. Realtime
  useEffect(() => {
    if (!fechaInicio || !fechaFin) return;

    const channel = supabase
      .channel(`citas-realtime-${idEmpresa}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'citas' },
        async (payload) => {
          console.log('[Realtime]', payload);
          const id_cita =
            payload.eventType === 'DELETE'
              ? payload.old.id_cita
              : payload.new.id_cita;

          const { data, error } = await supabase
            .from('vista_citas_detalle')
            .select('*')
            .eq('id_cita', id_cita)
            .single();

          if (payload.eventType === 'DELETE') {
            setCitasEvt((prev) =>
              prev.filter((evt) => evt.groupId !== id_cita)
            );
          } else if (!error && data) {
            const row = data as RawAppointment;
            const updatedEvt = mapearCitas([row]);
            setCitasEvt((prev) => {
              const sinAntiguo = prev.filter((evt) => evt.groupId !== id_cita);
              return [...sinAntiguo, ...updatedEvt];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [idEmpresa, fechaInicio, fechaFin]);

  // 3. Eventos estáticos
  const noLabEvt = useMemo(
    () => buildEventosNoLaborables(diasNoLaborables),
    [diasNoLaborables]
  );
  const festivosEvt = useMemo(
    () => buildEventosFestivos(diasFestivos),
    [diasFestivos]
  );

  // 4. Combina todo
  const events = useMemo(
    () => [...noLabEvt, ...festivosEvt, ...citasEvt],
    [noLabEvt, festivosEvt, citasEvt]
  );

  return events;
}
