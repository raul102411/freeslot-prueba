// src/components/pages/dialogs/CancellationReasonDialog.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useEstadoId } from '@/components/hooks/useEstado';

export type CancellationReasonDialogProps = {
  idCita: string;
  motivo: string;
  setMotivo: (value: string) => void;
  onCancel: () => void; // cierra solo este diálogo
  onCloseAll: () => void; // cierra este y el detalle
  incrementReload: () => void; // dispara recarga en el padre
  titulo?: string;
};

const CancellationReasonDialog = ({
  idCita,
  motivo,
  setMotivo,
  onCancel,
  onCloseAll,
  incrementReload,
  titulo = 'Motivo de cancelación (opcional)',
}: CancellationReasonDialogProps) => {
  const [loading, setLoading] = useState(false);
  // obtén el id para el estado "cancelado"
  const idEstadoCancelado = useEstadoId('cancelado'); // number | null

  const handleConfirm = async () => {
    if (loading || idEstadoCancelado == null) return;
    setLoading(true);

    const { error } = await supabase
      .from('citas')
      .update({
        id_estado: idEstadoCancelado,
        motivo_cancelacion: motivo,
      })
      .eq('id_cita', idCita);

    if (error) {
      console.error('Error al cancelar cita:', error);
      setLoading(false);
      return;
    }

    // cierra todos los diálogos
    onCloseAll();
    // dispara recarga en WorkerCalendar
    incrementReload();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 sm:p-8">
        <h3 className="text-base sm:text-lg font-semibold mb-2">{titulo}</h3>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Escribe el motivo si lo deseas..."
          className="w-full border rounded px-3 py-2 text-sm resize-none"
          rows={4}
        />
        <div className="flex justify-end gap-2 mt-4 flex-wrap sm:flex-nowrap">
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm disabled:opacity-50"
          >
            {loading ? 'Cancelando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationReasonDialog;
