import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type Appointment = {
  id_cita: string;
  nombre_completo: string;
  nombre_servicio: string;
  estado_cita: string;
  fecha_cita: string;
  hora_cita: string;
  hora_fin: string;
  tipo_pago: string;
  telefono: string;
  precio: number;
};

export const useCitasDetallesPorEmpresa = (
  startDate: string,
  endDate: string,
  activeStates: string[]
) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    const idEmpresa = localStorage.getItem('id_empresa');
    if (!idEmpresa) return;

    setLoading(true);

    let query = supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_empresa', idEmpresa);

    if (startDate) query = query.gte('fecha_cita', startDate);
    if (endDate) query = query.lte('fecha_cita', endDate);
    if (activeStates.length) query = query.in('estado_cita', activeStates);

    const { data, error } = await query
      .order('fecha_cita', { ascending: false })
      .order('hora_cita', { ascending: false });

    if (!error && data) {
      setAppointments(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [startDate, endDate, activeStates]);

  return { appointments, loading };
};

export const useCitasDetallesPorUsuario = (
  idEmpresa: string | null,
  idUsuario: string | null,
  startDate: string,
  endDate: string,
  activeStates: string[]
) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAppointments = async () => {
    if (!idUsuario || !idEmpresa) return;

    setLoading(true);

    let query = supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_usuario', idUsuario)
      .eq('id_empresa', idEmpresa);

    if (startDate) query = query.gte('fecha_cita', startDate);
    if (endDate) query = query.lte('fecha_cita', endDate);
    if (activeStates.length) query = query.in('estado_cita', activeStates);

    const { data, error } = await query
      .order('fecha_cita', { ascending: false })
      .order('hora_cita', { ascending: false });

    if (!error) setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [idEmpresa, startDate, endDate, activeStates]);

  return { appointments, loading };
};
