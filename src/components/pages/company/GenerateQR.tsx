import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const GenerateQR = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const idEmpresa = localStorage.getItem('id_empresa');
    const idUsuario = localStorage.getItem('id_usuario');

    if (!idEmpresa || !idUsuario) {
      toast.error('No se encontraron datos de empresa o usuario');
      setLoading(false);
      return;
    }

    const url = `${window.location.origin}/client-booking/${idEmpresa}`;
    setEmpresaId(idEmpresa);
    setUserId(idUsuario);
    setBookingUrl(url);
  }, []);

  useEffect(() => {
    if (empresaId) fetchQR();
  }, [empresaId]);

  const fetchQR = async () => {
    const { data, error } = await supabase
      .from('vista_qr_generados')
      .select('*')
      .eq('id_empresa', empresaId)
      .maybeSingle();

    if (error) {
      toast.error('Error al consultar QR.');
    } else if (data?.url_archivo) {
      setQrUrl(data.url_archivo);
    }

    setLoading(false);
  };

  const generateAndUploadQR = async () => {
    if (qrUrl) {
      toast.warning('Ya existe un QR generado. No se puede volver a generar.');
      return;
    }

    if (!empresaId || !userId || !bookingUrl) {
      toast.error('Datos incompletos para generar QR.');
      return;
    }

    setGenerating(true);

    try {
      if (!canvasRef.current) throw new Error('Canvas no disponible');
      await QRCode.toCanvas(canvasRef.current, bookingUrl, { width: 256 });

      const blob: Blob | null = await new Promise((resolve) =>
        canvasRef.current!.toBlob(resolve as BlobCallback, 'image/png')
      );
      if (!blob) throw new Error('Error al convertir canvas a imagen');

      const filePath = `qr_codes/${empresaId}.png`;

      const { error: uploadError } = await supabase.storage
        .from('reservas')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw new Error('Error al subir QR');

      const { data: publicData } = supabase.storage
        .from('reservas')
        .getPublicUrl(filePath);
      const publicUrl = publicData.publicUrl;

      const { error: insertError } = await supabase
        .from('qr_generados')
        .insert([
          {
            id_empresa: empresaId,
            url_archivo: publicUrl,
            usuario_creacion: userId,
          },
        ]);

      if (insertError) throw new Error('Error al guardar QR');

      toast.success('QR generado y guardado correctamente.');
      setQrUrl(publicUrl);
    } catch (err) {
      toast.error((err as Error).message || 'Error al generar QR');
      console.error(err);
    } finally {
      setGenerating(false);
    }
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
        <>
          <canvas ref={canvasRef} className="hidden" />
          <Button
            onClick={generateAndUploadQR}
            disabled={generating}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {generating ? 'Generando...' : 'Generar y guardar QR'}
          </Button>
        </>
      )}
    </div>
  );
};

export default GenerateQR;
