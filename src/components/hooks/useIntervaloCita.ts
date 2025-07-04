import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Devuelve el intervalo de cita para un usuario y empresa dados.
 */
export function useIntervaloCitaPorUsuario(
  idUsuario: string,
  idEmpresa: string
) {
  const [intervaloCita, setIntervaloCita] = useState('00:30:00');

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_intervalo_cita')
        .select('intervalo_cita')
        .eq('id_empresa', idEmpresa)
        .eq('id_usuario', idUsuario)
        .single();

      if (error) {
        toast.error('Error al cargar intervalo de cita');
        return;
      }

      if (data?.intervalo_cita) {
        const minutos = data.intervalo_cita;
        const horas = String(Math.floor(minutos / 60)).padStart(2, '0');
        const mins = String(minutos % 60).padStart(2, '0');
        setIntervaloCita(`${horas}:${mins}:00`);
      }
    };

    if (idUsuario && idEmpresa) fetch();
  }, [idUsuario, idEmpresa]);

  return intervaloCita;
}
