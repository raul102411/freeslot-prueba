// src/components/pages/dialogs/PaymentTypeDialog.tsx

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// después
export type PaymentTypeDialogProps = {
  idCita: string;
  tipoPago: string;
  setTipoPago: (value: string) => void;
  onCancel: () => void;
  onCloseAll: () => void;
  incrementReload: () => void;
  idEstadoCompletado: number; // ya no es opcional
};

const paymentOptions = [
  { value: 'tarjeta', label: '💳 Tarjeta' },
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'bizum', label: '📲 Bizum' },
  { value: 'otros', label: '💼 Otros' },
];

const PaymentTypeDialog = ({
  idCita,
  tipoPago,
  setTipoPago,
  onCancel,
  onCloseAll,
  incrementReload,
  idEstadoCompletado,
}: PaymentTypeDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    // 1) Actualizar la cita en Supabase
    const { error } = await supabase
      .from('citas')
      .update({
        id_estado: idEstadoCompletado,
        tipo_pago: tipoPago,
      })
      .eq('id_cita', idCita);

    if (error) {
      console.error('Error al completar cita:', error);
      setLoading(false);
      return;
    }

    // 2) Cerrar diálogo de pago y detalle
    onCloseAll();

    // 3) Disparar recarga en el padre
    incrementReload();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 sm:p-8">
        <h3 className="text-base sm:text-lg font-semibold mb-4">
          Selecciona el tipo de pago
        </h3>

        <select
          value={tipoPago}
          onChange={(e) => setTipoPago(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm sm:text-base"
        >
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2 mt-6 flex-wrap sm:flex-nowrap">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentTypeDialog;
