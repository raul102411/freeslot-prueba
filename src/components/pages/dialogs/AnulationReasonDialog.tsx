// src/components/pages/dialogs/AnulationReasonDialog.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useEstadoId } from '@/components/hooks/useEstado';

export type AnulationReasonDialogProps = {
  idCita: string;
  motivo: string;
  setMotivo: (valor: string) => void;
  onCancel: () => void; // cierra solo este diálogo
  onCloseAll: () => void; // cierra este diálogo y el detalle
  incrementReload: () => void; // dispara recarga en WorkerCalendar
};

const AnulationReasonDialog = ({
  idCita,
  motivo,
  setMotivo,
  onCancel,
  onCloseAll,
  incrementReload,
}: AnulationReasonDialogProps) => {
  const [loading, setLoading] = useState(false);
  const idEstadoAnulado = useEstadoId('anulado'); // number | null

  const handleConfirm = async () => {
    if (loading || idEstadoAnulado == null) return;
    setLoading(true);

    const { error } = await supabase
      .from('citas')
      .update({
        id_estado: idEstadoAnulado,
        motivo_anulado: motivo,
      })
      .eq('id_cita', idCita);

    setLoading(false);
    if (error) {
      console.error('Error al anular cita:', error);
      return;
    }

    onCloseAll();
    incrementReload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full sm:max-w-sm mx-4 p-6">
        <h3 className="text-lg font-semibold mb-2">
          Motivo de anulación <span className="text-gray-500">(opcional)</span>
        </h3>
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
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm w-full sm:w-auto"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm w-full sm:w-auto disabled:opacity-50"
          >
            {loading ? 'Anulando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnulationReasonDialog;
