import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import Joyride from 'react-joyride';
import DisplayQRTourSteps from '@/components/tour/worker/DisplayQRTourSteps';
import { useQrGenerados } from '@/components/hooks/useQrGenerados';
import { useEmpresa } from '@/components/hooks/useEmpresa';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DisplayQR = () => {
  const idEmpresa =
    typeof window !== 'undefined'
      ? localStorage.getItem('id_empresa') ?? undefined
      : undefined;

  const { qrUrl, bookingUrl, loading, loadQr } = useQrGenerados();
  const { empresa, loadingEmpresa, errorEmpresa } = useEmpresa(idEmpresa);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    loadQr();
  }, [loadQr]);

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
    <motion.div
      className="flex flex-col items-center justify-center py-12 px-4 space-y-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Título + Empresa */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tour-title">
          {empresa?.empresa || 'Código QR para reservas'}
        </h1>
        <HelpCircle
          className="w-6 h-6 text-blue-500 cursor-pointer"
          onClick={() => setRunTour(true)}
        />
      </motion.div>

      {/* Tour */}
      <motion.div variants={itemVariants}>
        <Joyride
          steps={DisplayQRTourSteps}
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
            if (status === 'finished' || status === 'skipped') {
              setRunTour(false);
            }
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {/* Contenido */}
      {loading || loadingEmpresa ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
        </motion.div>
      ) : errorEmpresa ? (
        <motion.p variants={itemVariants} className="text-red-500">
          {errorEmpresa}
        </motion.p>
      ) : qrUrl ? (
        <motion.div
          variants={itemVariants}
          className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md flex flex-col items-center space-y-4 border tour-qr-container"
        >
          <img src={qrUrl} alt="QR generado" className="w-48 h-48" />
          <p className="text-center text-sm text-gray-600 break-all tour-link-text">
            {bookingUrl}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center">
            <Button
              onClick={handleDownloadQR}
              className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto tour-download-button"
            >
              Descargar QR
            </Button>
            <Button
              onClick={handleCopyLink}
              className="bg-gray-600 text-white hover:bg-gray-700 w-full sm:w-auto tour-copy-button"
            >
              Copiar enlace
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.p variants={itemVariants} className="text-gray-500">
          No hay ningún QR generado aún.
        </motion.p>
      )}
    </motion.div>
  );
};

export default DisplayQR;
