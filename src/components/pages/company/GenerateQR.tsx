import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trash, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import Joyride, { Step } from 'react-joyride';
import GenerateQRTourSteps from '@/components/tour/company/GenerateQRTourSteps';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
  const [runTour, setRunTour] = useState(false);
  const steps: Step[] = GenerateQRTourSteps;

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

    (async () => {
      const { data, error } = await supabase
        .from('vista_empresa_detalle')
        .select('reservas_online')
        .eq('id_empresa', idEmpresa)
        .single();
      if (!error && data) {
        setReservasOnline(data.reservas_online);
        setEmpresaCargada(true);
      }
    })();
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
    if (error) toast.error('Error al consultar QR.');
    else if (data?.url_archivo) setQrUrl(data.url_archivo);
    setLoading(false);
  };

  const generateAndUploadQR = async () => {
    if (qrUrl) {
      toast.warning('Ya existe un QR generado.');
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
      const path = `qr_codes/${empresaId}.png`;
      const { error: uploadError } = await supabase.storage
        .from('reservas')
        .upload(path, blob, { cacheControl: '3600', upsert: true });
      if (uploadError) throw new Error('Error al subir QR');
      const { data: publicData } = supabase.storage
        .from('reservas')
        .getPublicUrl(path);
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
      toast.success('QR generado y guardado.');
      setQrUrl(publicUrl);
    } catch (err) {
      toast.error((err as Error).message || 'Error al generar QR');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'codigo_qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('QR descargado');
    } catch {
      toast.error('No se pudo descargar el QR');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleDeleteQR = async () => {
    if (!empresaId || !qrUrl) return;
    const path = `qr_codes/${empresaId}.png`;
    try {
      const { error: deleteErr } = await supabase.storage
        .from('reservas')
        .remove([path]);
      if (deleteErr) return toast.error('Error al eliminar archivo');
      const { error: recordErr } = await supabase
        .from('qr_generados')
        .delete()
        .eq('id_empresa', empresaId);
      if (recordErr) return toast.error('Error al eliminar registro');
      const { error: updateErr } = await supabase
        .from('empresas')
        .update({ reservas_online: false })
        .eq('id_empresa', empresaId);
      if (updateErr)
        toast.warning('QR eliminado, pero no se desactivó reservas');
      else setReservasOnline(false);
      setQrUrl('');
      toast.success('QR eliminado');
      setConfirmDeleteOpen(false);
    } catch {
      toast.error('Error al eliminar el QR');
    }
  };

  const toggleReservasOnline = async () => {
    if (!empresaId) return;
    const next = !reservasOnline;
    setReservasOnline(next);
    const { error } = await supabase
      .from('empresas')
      .update({ reservas_online: next })
      .eq('id_empresa', empresaId);
    if (error) {
      toast.error('Error al actualizar reservas');
      setReservasOnline(!next);
    } else {
      toast.success(`Reservas ${next ? 'activadas' : 'desactivadas'}`);
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4 space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">
          Código QR para reservas
        </h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Joyride
          steps={steps}
          run={runTour}
          continuous
          showSkipButton
          spotlightClicks
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            skip: 'Saltar',
          }}
          callback={({ status }) => {
            if (status === 'finished' || status === 'skipped')
              setRunTour(false);
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {empresaCargada && qrUrl && (
        <motion.div
          variants={itemVariants}
          className="mb-6 flex items-center gap-4 tour-toggle-online"
        >
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
        </motion.div>
      )}

      {loading ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
        </motion.div>
      ) : qrUrl ? (
        <motion.div
          variants={itemVariants}
          className="relative bg-white shadow-xl rounded-2xl p-6 w-full max-w-md flex flex-col items-center space-y-4 border tour-qr-display"
        >
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="absolute top-2 right-2 text-red-600 hover:text-red-800 tour-delete-btn"
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
              className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto tour-download-btn"
            >
              Descargar QR
            </Button>
            <Button
              onClick={handleCopyLink}
              className="bg-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto tour-copy-btn"
            >
              Copiar enlace
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center"
        >
          <canvas ref={canvasRef} className="hidden" />
          <Button
            onClick={generateAndUploadQR}
            disabled={generating}
            className="bg-blue-600 text-white hover:bg-blue-700 tour-generate-btn"
          >
            {generating ? 'Generando...' : 'Generar y guardar QR'}
          </Button>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="tour-dialog">
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>¿Eliminar QR?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600 mt-2">
              Esta acción eliminará el código QR generado y no se podrá
              deshacer.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 text-white"
                onClick={handleDeleteQR}
              >
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </motion.div>
  );
};

export default GenerateQR;
