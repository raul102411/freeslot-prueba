// hooks/useHorarios.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { Horario } from '@/components/types/typeCalendar';

/**
 * Devuelve los horarios de trabajo para un usuario y empresa dados
 * usando la vista `vista_horario_trabajador`.
 */
export function useHorariosPorUsuario(
  idUsuario: string | null,
  idEmpresa: string
) {
  const [horarios, setHorarios] = useState<Horario[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_horario_trabajador')
        .select('id_horario, dia_semana, hora_inicio, hora_fin')
        .eq('id_usuario', idUsuario)
        .eq('id_empresa', idEmpresa);

      if (error) {
        toast.error('Error al cargar horarios por usuario');
      } else {
        // Hacemos cast seguro a Horario[]
        setHorarios(data as Horario[]);
      }
    };

    if (idUsuario && idEmpresa) {
      fetch();
    }
  }, [idUsuario, idEmpresa]);

  return horarios;
}

/**
 * Devuelve los horarios de empresa usando la vista `vista_horario_empresa`.
 */
export function useHorariosPorEmpresa(idEmpresa: string) {
  const [horarios, setHorarios] = useState<Horario[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_horario_empresa')
        // También aquí incluimos `id_horario`
        .select('id_horario, dia_semana, hora_inicio, hora_fin')
        .eq('id_empresa', idEmpresa);

      if (error) {
        toast.error('Error al cargar horarios por empresa');
      } else {
        setHorarios(data as Horario[]);
      }
    };

    if (idEmpresa) {
      fetch();
    }
  }, [idEmpresa]);

  return horarios;
}
