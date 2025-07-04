// hooks/useServicios.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Devuelve los servicios filtrados por usuario y empresa.
 */
export function useServiciosPorUsuario(idUsuario: string, idEmpresa: string) {
  const [servicios, setServicios] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_servicios')
        .select('id_servicio, nombre_servicio, precio, duracion_minutos')
        .eq('id_empresa', idEmpresa)
        .eq('id_usuario', idUsuario);
      if (error) {
        toast.error('Error al cargar servicios por usuario');
      } else {
        setServicios(data || []);
      }
    };
    if (idUsuario && idEmpresa) fetch();
  }, [idUsuario, idEmpresa]);

  return servicios;
}
