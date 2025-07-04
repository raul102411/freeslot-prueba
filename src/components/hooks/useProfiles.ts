import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Perfil {
  nombre_perfil: string;
  id_perfil: string;
  id_empresa: string;
  ruta_panel: string | null;
  logo?: string;
  descripcion?: string;
  inicio_automatico?: boolean;
  id_usuario?: string;
}

export function useProfiles() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    setError('');

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('Usuario no autenticado.');
      setLoading(false);
      return;
    }

    const { data, error: perfilesError } = await supabase
      .from('vista_usuarios_detalle')
      .select('*')
      .eq('id_usuario', user.id)
      .order('empresa', { ascending: true })
      .order('perfil', { ascending: true });

    if (perfilesError || !data) {
      setError('No se pudieron obtener los perfiles.');
      setPerfiles([]);
    } else {
      setPerfiles(data as Perfil[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  return { perfiles, loading, error, refetch: fetchPerfiles };
}
