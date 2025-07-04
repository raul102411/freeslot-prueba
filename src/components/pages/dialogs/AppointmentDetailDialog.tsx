// src/components/pages/dialogs/AppointmentDetailDialog.tsx

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useEstadoId } from '@/components/hooks/useEstado';
import type { RawAppointment } from '@/components/types/typeCalendar';
import MoveAppointmentDialog from '@/components/pages/dialogs/MoveAppointmentDialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  cita: RawAppointment | null;
  onClose: () => void;
  onCancelar: () => void;
  onCompletar: () => void;
  onReabrir: () => void;
  onAnular: () => void;
  incrementReload: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const dialogVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const AppointmentDetailDialog: React.FC<Props> = ({
  cita,
  onClose,
  onCancelar,
  onCompletar,
  onReabrir,
  onAnular,
  incrementReload,
}) => {
  const [loading, setLoading] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const idEstadoConfirmado = useEstadoId('confirmado');

  if (!cita) return null;

  const estado = cita.estado_cita.toLowerCase();

  const handleReabrir = async () => {
    if (!idEstadoConfirmado) return;

    setLoading(true);

    const { error } = await supabase
      .from('citas')
      .update({
        id_estado: idEstadoConfirmado,
        motivo_cancelacion: null,
        motivo_anulado: null,
      })
      .eq('id_cita', cita.id_cita);

    setLoading(false);

    if (error) {
      console.error('Error al reabrir cita:', error);
      toast.error('No se pudo reabrir la cita');
      return;
    }

    toast.success('Cita reabierta');
    onReabrir();
    incrementReload();
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
      >
        {/* Dialog */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-xl w-[90vw] max-w-md p-6 mx-auto"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={dialogVariants}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            aria-label="Cerrar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Title */}
          <h2 className="text-xl font-semibold mb-4">Detalle de la cita</h2>

          {/* Content */}
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <strong>Trabajador:</strong> {cita.nombre_completo}
            </div>
            <div>
              <strong>Servicio:</strong> {cita.nombre_servicio}
            </div>
            <div>
              <strong>Fecha:</strong> {cita.fecha_cita}
            </div>
            <div>
              <strong>Hora:</strong> {cita.hora_cita}
              {cita.hora_fin && ` – ${cita.hora_fin}`}
            </div>
            <div>
              <strong>Estado:</strong> {cita.estado_cita}
            </div>
            {cita.telefono && (
              <div>
                <strong>Teléfono:</strong> {cita.telefono}
              </div>
            )}
            {cita.email_contacto && (
              <div>
                <strong>Email de contacto:</strong> {cita.email_contacto}
              </div>
            )}
            {cita.observaciones && (
              <div>
                <strong>Observaciones:</strong> {cita.observaciones}
              </div>
            )}
            {cita.motivo_cancelacion && (
              <div>
                <strong>Motivo cancelación:</strong> {cita.motivo_cancelacion}
              </div>
            )}
            {cita.motivo_anulado && (
              <div>
                <strong>Motivo anulación:</strong> {cita.motivo_anulado}
              </div>
            )}
            {cita.precio != null && (
              <div>
                <strong>Precio:</strong> {cita.precio.toFixed(2)} €
              </div>
            )}
            {['completado', 'anulado'].includes(estado) && cita.tipo_pago && (
              <div>
                <strong>Tipo de pago:</strong> {cita.tipo_pago}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row sm:justify-between gap-2">
            {estado === 'confirmado' && (
              <button
                onClick={() => setMoveDialogOpen(true)}
                className="w-full sm:w-auto px-4 py-2 bg-purple-100 text-purple-700 border border-purple-300 rounded hover:bg-purple-200 text-sm flex items-center justify-center sm:justify-start gap-2"
              >
                <span className="text-lg">→</span>
                <span>Mover cita</span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              {estado === 'confirmado' && (
                <>
                  <button
                    onClick={onCompletar}
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Completar
                  </button>
                  <button
                    onClick={onCancelar}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    Cancelar
                  </button>
                </>
              )}

              {estado === 'completado' && (
                <>
                  <button
                    onClick={handleReabrir}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                  >
                    {loading ? 'Reabriendo…' : 'Reabrir'}
                  </button>
                  <button
                    onClick={onAnular}
                    className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    Anular
                  </button>
                </>
              )}

              {['cancelado', 'anulado'].includes(estado) && (
                <button
                  onClick={handleReabrir}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {loading ? 'Reabriendo…' : 'Reabrir'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Move Appointment Modal */}
      {moveDialogOpen && (
        <MoveAppointmentDialog
          open={moveDialogOpen}
          onClose={() => setMoveDialogOpen(false)}
          onSuccess={() => {
            setMoveDialogOpen(false);
            onClose();
            incrementReload();
          }}
          citaId={cita.id_cita}
          initialDate={cita.fecha_cita}
          initialTime={cita.hora_cita}
          initialObservaciones={cita.observaciones || ''}
          duracionMinutos={cita.duracion_minutos}
        />
      )}
    </AnimatePresence>
  );
};

export default AppointmentDetailDialog;
