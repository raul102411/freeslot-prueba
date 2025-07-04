import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export const usePromociones = (empresaId: string | null) => {
  const [tiposPromocion, setTiposPromocion] = useState<any[]>([]);
  const [promociones, setPromociones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTipos = async () => {
    if (!empresaId) return;
    const { data, error } = await supabase
      .from('tipo_promocion')
      .select('*')
      .eq('id_empresa', empresaId);
    if (error) toast.error('Error al cargar tipos');
    else setTiposPromocion(data || []);
  };

  const fetchPromociones = async () => {
    if (!empresaId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('promociones')
      .select('*, tipo_promocion(*)')
      .eq('id_empresa', empresaId);
    if (error) toast.error('Error al cargar promociones');
    else setPromociones(data || []);
    setLoading(false);
  };

  const crearTipoPromocion = async (tipo: string, descripcion: string) => {
    const { error } = await supabase.from('tipo_promocion').insert({
      id_empresa: empresaId,
      tipo,
      descripcion,
    });
    if (error) toast.error('Error al crear tipo');
    else {
      toast.success('Tipo creado');
      fetchTipos();
    }
  };

  const crearPromocion = async (nueva: any) => {
    const { error } = await supabase.from('promociones').insert(nueva);
    if (error) toast.error('Error al crear promoción');
    else {
      toast.success('Promoción creada');
      fetchPromociones();
    }
  };

  useEffect(() => {
    fetchTipos();
    fetchPromociones();
  }, [empresaId]);

  return {
    tiposPromocion,
    promociones,
    loading,
    crearTipoPromocion,
    crearPromocion,
    fetchTipos,
    fetchPromociones,
  };
};
