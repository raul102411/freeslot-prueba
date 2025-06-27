import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

const GenerateQR = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [reservasOnline, setReservasOnline] = useState<boolean>(false);
  const [empresaCargada, setEmpresaCargada] = useState(false);

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

    // Cargar estado de reservas_online
    const fetchEmpresa = async () => {
      const { data, error } = await supabase
        .from('vista_empresa_detalle')
        .select('reservas_online')
        .eq('id_empresa', idEmpresa)
        .single();

      if (!error && data) {
        setReservasOnline(data.reservas_online);
        setEmpresaCargada(true);
      }
    };

    fetchEmpresa();
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

  const handleDeleteQR = async () => {
    if (!empresaId || !qrUrl) return;

    const filePath = `qr_codes/${empresaId}.png`;

    try {
      const { error: deleteFileError } = await supabase.storage
        .from('reservas')
        .remove([filePath]);

      if (deleteFileError) {
        toast.error('Error al eliminar el archivo QR');
        return;
      }

      const { error: deleteRecordError } = await supabase
        .from('qr_generados')
        .delete()
        .eq('id_empresa', empresaId);

      if (deleteRecordError) {
        toast.error('Error al eliminar el registro de QR');
        return;
      }

      // ⚠️ NUEVO: desactiva reservas_online
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ reservas_online: false })
        .eq('id_empresa', empresaId);

      if (updateError) {
        toast.warning(
          'QR eliminado, pero no se pudo desactivar reservas online'
        );
      } else {
        setReservasOnline(false);
      }

      setQrUrl('');
      toast.success('QR eliminado correctamente');
      setConfirmDeleteOpen(false);
    } catch (err) {
      toast.error('Error inesperado al eliminar el QR');
      console.error(err);
    }
  };

  const toggleReservasOnline = async () => {
    if (!empresaId) return;

    const nuevoValor = !reservasOnline;
    setReservasOnline(nuevoValor);

    const { error } = await supabase
      .from('empresas')
      .update({ reservas_online: nuevoValor })
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al actualizar reservas online');
      setReservasOnline(!nuevoValor);
    } else {
      toast.success(
        `Reservas online ${nuevoValor ? 'activadas' : 'desactivadas'}`
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Código QR para reservas
      </h1>

      {empresaCargada && qrUrl && (
        <div className="mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Reservas online
          </label>
          <div className="flex items-center gap-2">
            <Switch
              checked={reservasOnline}
              onCheckedChange={toggleReservasOnline}
            />
            <span
              className={`text-sm font-medium ${
                reservasOnline ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {reservasOnline ? 'Activadas' : 'Desactivadas'}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
        </div>
      ) : qrUrl ? (
        <div className="relative bg-white shadow-xl rounded-2xl p-6 w-full max-w-md flex flex-col items-center space-y-4 border">
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="absolute top-2 right-2 text-red-600 hover:text-red-800"
            title="Eliminar QR"
          >
            <Trash className="w-5 h-5" />
          </button>

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

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar QR?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            Esta acción eliminará el código QR generado y no se podrá deshacer.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="bg-red-600 text-white" onClick={handleDeleteQR}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenerateQR;
