import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export type BlacklistItem = {
  id_lista_negra: string;
  telefono: string;
  email: string;
  motivo: string;
  fecha_creacion: string;
  activo: boolean;
};

export const useListaNegraPorEmpresa = (empresaId: string) => {
  const [registros, setRegistros] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListaNegra = async () => {
    if (!empresaId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('vista_lista_negra')
      .select('*')
      .eq('id_empresa', empresaId)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      toast.error('Error al cargar la lista negra');
    } else {
      setRegistros(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchListaNegra();
  }, [empresaId]);

  return {
    registros,
    loading,
    refetch: fetchListaNegra,
  };
};
