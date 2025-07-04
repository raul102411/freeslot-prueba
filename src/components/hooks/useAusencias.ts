/* src/components/hooks/useAusencias.ts */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import type { AusenciaDB, DiaAusencia } from '@/components/types/typeCalendar';

/**
 * Hook para obtener los días de ausencia aprobados por usuario y empresa.
 */
export function useAusenciasPorUsuario(
  idUsuario: string | null,
  idEmpresa: string
) {
  const [ausencias, setAusencias] = useState<DiaAusencia[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_ausencias')
        .select('*')
        .eq('id_usuario', idUsuario)
        .eq('id_empresa', idEmpresa)
        .eq('estado_ausencia', 'aprobado');

      if (error) {
        toast.error('Error al cargar ausencias por usuario');
        return;
      }

      const raw = (data as AusenciaDB[]) || [];
      const dias: DiaAusencia[] = [];

      raw.forEach((a) => {
        const start = new Date(a.fecha_inicio);
        const end = new Date(a.fecha_fin);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dias.push({
            fecha: d.toISOString().split('T')[0],
            estado: a.estado_ausencia,
          });
        }
      });

      setAusencias(dias);
    };

    if (!idUsuario || !idEmpresa) return;
    fetch();
  }, [idUsuario, idEmpresa]);

  return ausencias;
}

/**
 * Hook para obtener todas las ausencias de una empresa.
 */
export function useAusenciasPorEmpresa(idEmpresa: string) {
  const [ausencias, setAusencias] = useState<AusenciaDB[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('vista_ausencias')
        .select('*')
        .eq('id_empresa', idEmpresa);

      if (error) {
        toast.error('Error al cargar ausencias de empresa');
      } else {
        setAusencias(data as AusenciaDB[]);
      }
    };

    if (!idEmpresa) return;
    fetch();
  }, [idEmpresa]);

  return ausencias;
}

/**
 * Hook para obtener los tipos de ausencia disponibles.
 */
export function useTiposAusencia() {
  const [tipos, setTipos] = useState<
    { id_tipo_ausencia: string; tipo: string }[]
  >([]);

  useEffect(() => {
    const fetchTipos = async () => {
      const { data, error } = await supabase
        .from('vista_tipo_ausencia')
        .select('id_tipo_ausencia, tipo');

      if (error) {
        toast.error('Error al cargar tipos de ausencia');
      } else {
        setTipos(data as { id_tipo_ausencia: string; tipo: string }[]);
      }
    };

    fetchTipos();
  }, []);

  return tipos;
}

/**
 * Hook para obtener los estados de ausencia disponibles.
 */
export function useEstadosAusencia() {
  const [estados, setEstados] = useState<
    { id_estado_ausencia: string; estado: string }[]
  >([]);

  useEffect(() => {
    const fetchEstados = async () => {
      const { data, error } = await supabase
        .from('estado_ausencia')
        .select('id_estado_ausencia, estado');

      if (error) {
        toast.error('Error al cargar estados de ausencia');
      } else {
        setEstados(data as { id_estado_ausencia: string; estado: string }[]);
      }
    };

    fetchEstados();
  }, []);

  return estados;
}

/**
 * Hook para obtener las solicitudes de ausencia realizadas por usuario y empresa.
 */
export function useAusenciasSolicitadas(idUsuario: string, idEmpresa: string) {
  const [solicitudes, setSolicitudes] = useState<
    {
      id_solicitud: number;
      id_tipo_ausencia: string;
      id_estado_ausencia: string;
      fecha_inicio: string;
      fecha_fin: string;
      usuario_creacion: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchSolicitudes = async () => {
      const { data, error } = await supabase
        .from('ausencias_solicitadas')
        .select('*')
        .eq('id_usuario', idUsuario)
        .eq('id_empresa', idEmpresa);

      if (error) {
        toast.error('Error al cargar solicitudes de ausencia');
      } else {
        setSolicitudes(data as any[]);
      }
    };

    if (idUsuario && idEmpresa) fetchSolicitudes();
  }, [idUsuario, idEmpresa]);

  return solicitudes;
}
