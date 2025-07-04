// hooks/useQrGenerados.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface UseQrGeneradosReturn {
  qrUrl: string;
  bookingUrl: string;
  loading: boolean;
  loadQr: (empresaId?: string) => Promise<void>;
}

export const useQrGenerados = (): UseQrGeneradosReturn => {
  const [qrUrl, setQrUrl] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const loadQr = useCallback(async (providedIdEmpresa?: string) => {
    setLoading(true);

    const idEmpresa = providedIdEmpresa ?? localStorage.getItem('id_empresa');

    if (!idEmpresa) {
      toast.error('No se encontró el ID de la empresa');
      setLoading(false);
      return;
    }

    const url = `${window.location.origin}/client-booking/${idEmpresa}`;
    setBookingUrl(url);

    const { data, error } = await supabase
      .from('vista_qr_generados')
      .select('*')
      .eq('id_empresa', idEmpresa)
      .maybeSingle();

    if (error || !data?.url_archivo) {
      toast.error('No se encontró ningún QR generado');
    } else {
      setQrUrl(data.url_archivo);
    }

    setLoading(false);
  }, []);

  return {
    qrUrl,
    bookingUrl,
    loading,
    loadQr,
  };
};
