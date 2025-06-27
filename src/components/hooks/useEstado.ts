// src/components/hooks/useEstado.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Hook para obtener el id_estado de un nombre de estado dado.
 *
 * @param estadoName El nombre exacto del estado en la tabla `estados` (p.ej. "confirmado", "completado").
 * @returns idEstado El identificador numérico del estado, o null mientras se carga/no existe.
 */
export function useEstadoId(estadoName: string): number | null {
  const [idEstado, setIdEstado] = useState<number | null>(null);

  useEffect(() => {
    if (!estadoName) {
      setIdEstado(null);
      return;
    }

    let isMounted = true;

    supabase
      .from('vista_estados')
      .select('id_estado')
      .eq('estado', estadoName)
      .single()
      .then(({ data, error }) => {
        if (isMounted) {
          if (!error && data) {
            setIdEstado(data.id_estado);
          } else {
            console.error(`Error fetching estado "${estadoName}":`, error);
            setIdEstado(null);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [estadoName]);

  return idEstado;
}
