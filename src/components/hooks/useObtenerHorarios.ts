import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para obtener horarios disponibles de un usuario (trabajador) en una fecha y servicio específicos
 */
export const useObtenerHorariosPorUsuario = (
  id_usuario: string | undefined,
  fecha: string | undefined,
  servicio_uuid: string | undefined
) => {
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHorarios = useCallback(async () => {
    if (!id_usuario || !fecha || !servicio_uuid) {
      setHorarios([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc(
      'obtener_horarios_trabajador',
      {
        fecha_consulta: fecha,
        usuario_uuid: id_usuario,
        servicio_uuid: servicio_uuid,
      }
    );

    if (rpcError) {
      console.error('Error al obtener horarios disponibles:', rpcError);
      setError('Error al obtener horarios disponibles');
      toast.error('Error al obtener horarios disponibles');
      setHorarios([]);
    } else {
      const disponibles = (data || [])
        .filter((h: any) => h.estado === 'disponible')
        .map((h: any) => h.hora_inicio as string);
      setHorarios(disponibles);
    }

    setLoading(false);
  }, [id_usuario, fecha, servicio_uuid]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  return { horarios, loading, error, refetchHorarios: fetchHorarios };
};

/**
 * Hook principal que agrupa funcionalidades relacionadas a obtención de horarios
 */
export const useObtenerHorarios = () => {
  return {
    useObtenerHorariosPorUsuario,
  };
};
