// src/components/hooks/useEmpresa.ts

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface EmpresaDetalle {
  empresa: string;
  logo: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  reservas_online: boolean;
}

export const useEmpresa = (id_empresa: string | undefined) => {
  const [empresa, setEmpresa] = useState<EmpresaDetalle | null>(null);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [errorEmpresa, setErrorEmpresa] = useState<string | null>(null);

  const fetchEmpresa = useCallback(async () => {
    if (!id_empresa) return;

    setLoadingEmpresa(true);
    setErrorEmpresa(null);

    // Llamada sin genéricos → evitamos el error TS2589
    const res = await supabase
      .from('vista_empresa_detalle')
      .select('*')
      .eq('id_empresa', id_empresa)
      .single();

    if (res.error) {
      console.error('Error al cargar los datos de la empresa:', res.error);
      setErrorEmpresa('Error al cargar los datos de la empresa');
      toast.error('Error al cargar los datos de la empresa');
    } else if (res.data) {
      // Aquí hacemos el cast manual al tipo que conocemos
      setEmpresa(res.data as EmpresaDetalle);
    }

    setLoadingEmpresa(false);
  }, [id_empresa]);

  useEffect(() => {
    fetchEmpresa();
  }, [fetchEmpresa]);

  return {
    empresa,
    loadingEmpresa,
    errorEmpresa,
    refetchEmpresa: fetchEmpresa,
  };
};
