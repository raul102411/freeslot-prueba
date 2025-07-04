import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

/**
 * Devuelve los días festivos para una empresa dada.
 */
export function useDiasFestivos(idEmpresa: string) {
  const [diasFestivos, setDiasFestivos] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_dias_festivos')
        .select('fecha')
        .eq('id_empresa', idEmpresa);
      if (error) {
        toast.error('Error al cargar días festivos');
      } else {
        setDiasFestivos(data.map((f) => f.fecha));
      }
    };
    if (idEmpresa) fetch();
  }, [idEmpresa]);

  return diasFestivos;
}
