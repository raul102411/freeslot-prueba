import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const DisplayQR = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idEmpresa = localStorage.getItem('id_empresa');
    if (!idEmpresa) {
      toast.error('No se encontró el ID de la empresa');
      setLoading(false);
      return;
    }

    const url = `${window.location.origin}/client-booking/${idEmpresa}`;
    setBookingUrl(url);

    fetchQR(idEmpresa);
  }, []);

  const fetchQR = async (empresaId: string) => {
    const { data, error } = await supabase
      .from('vista_qr_generados')
      .select('*')
      .eq('id_empresa', empresaId)
      .maybeSingle();

    if (error || !data?.url_archivo) {
      toast.error('No se encontró ningún QR generado');
    } else {
      setQrUrl(data.url_archivo);
    }

    setLoading(false);
  };

  const handleDownloadQR = async () => {
    if (!qrUrl) return;

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'codigo_qr.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success('QR descargado correctamente');
    } catch (error) {
      toast.error('No se pudo descargar el QR');
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast.success('Enlace copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Código QR para reservas
      </h1>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : qrUrl ? (
        <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md flex flex-col items-center space-y-4 border">
          <img src={qrUrl} alt="QR generado" className="w-48 h-48" />
          <p className="text-center text-sm text-gray-600 break-all">
            {bookingUrl}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center">
            <Button
              onClick={handleDownloadQR}
              className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto"
            >
              Descargar QR
            </Button>
            <Button
              onClick={handleCopyLink}
              className="bg-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto"
            >
              Copiar enlace
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No hay ningún QR generado aún.</p>
      )}
    </div>
  );
};

export default DisplayQR;
