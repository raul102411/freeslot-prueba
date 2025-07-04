// src/components/hooks/useTrabajadorDetalles.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface TrabajadorDetalles {
  id_usuario: string;
  id_empresa: string;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  foto?: string;
  intervalo_cita?: number;
  activo: boolean;
  // añade aquí más campos según la vista
}

export function useTrabajadorDetalles(idUsuario: string, idEmpresa: string) {
  const [perfil, setPerfil] = useState<TrabajadorDetalles | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!idUsuario || !idEmpresa) {
      setLoading(false);
      return;
    }

    const fetchPerfil = async () => {
      const { data, error } = await supabase
        .from('vista_trabajadores_detalles')
        .select('*')
        .eq('id_usuario', idUsuario)
        .eq('id_empresa', idEmpresa)
        .maybeSingle();

      if (error) {
        toast.error('Error al cargar los detalles del trabajador');
      } else {
        setPerfil(data);
      }

      setLoading(false);
    };

    fetchPerfil();
  }, [idUsuario, idEmpresa]);

  return { perfil, loading };
}

export interface TrabajadorCombo {
  id_usuario: string;
  id_empresa: string;
  nombre: string;
}

export function useTrabajadoresPorEmpresa(idEmpresa: string) {
  const [trabajadores, setTrabajadores] = useState<TrabajadorCombo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idEmpresa) {
      setLoading(false);
      return;
    }

    const fetchTrabajadores = async () => {
      const { data, error } = await supabase
        .from('vista_cb_trabajadores')
        .select('*')
        .eq('id_empresa', idEmpresa)
        .order('nombre', { ascending: true });

      if (error) {
        toast.error('Error al cargar los trabajadores');
      } else {
        setTrabajadores(data || []);
      }

      setLoading(false);
    };

    fetchTrabajadores();
  }, [idEmpresa]);

  return { trabajadores, loading };
}
