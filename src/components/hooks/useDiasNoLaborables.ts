import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Devuelve los días no laborables (RPC) para un usuario dado.
 */
export function useDiasNoLaborablesPorUsuario(
  idUsuario: string | null,
  idEmpresa: string | null
) {
  const [diasNoLaborables, setDiasNoLaborables] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const year = new Date().getFullYear();
      const { data, error } = await supabase.rpc(
        'obtener_dias_no_laborables_trabajador',
        {
          p_id_usuario: idUsuario,
          p_id_empresa: idEmpresa,
          p_fecha_inicio: `${year}-01-01`,
          p_fecha_fin: `${year}-12-31`,
        }
      );
      if (error) {
        toast.error('Error al cargar días no laborables');
      } else {
        setDiasNoLaborables((data as any[]).map((d) => d.fecha));
      }
    };
    if (idUsuario) fetch();
  }, [idUsuario]);

  return diasNoLaborables;
}

/**
 * Devuelve los días no laborables (RPC) para un usuario dado.
 */
export function useDiasNoLaborablesPorEmpresa(idEmpresa: string) {
  const [diasNoLaborables, setDiasNoLaborables] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const year = new Date().getFullYear();
      const { data, error } = await supabase.rpc(
        'obtener_dias_no_laborables_empresa',
        {
          p_id_empresa: idEmpresa,
          p_fecha_inicio: `${year}-01-01`,
          p_fecha_fin: `${year}-12-31`,
        }
      );
      if (error) {
        toast.error('Error al cargar días no laborables');
      } else {
        setDiasNoLaborables((data as any[]).map((d) => d.fecha));
      }
    };
    if (idEmpresa) fetch();
  }, [idEmpresa]);

  return diasNoLaborables;
}
