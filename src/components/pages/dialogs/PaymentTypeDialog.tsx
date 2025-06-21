type PaymentTypeDialogProps = {
  tipoPago: string;
  setTipoPago: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

const PaymentTypeDialog = ({
  tipoPago,
  setTipoPago,
  onCancel,
  onConfirm,
}: PaymentTypeDialogProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Selecciona el tipo de pago</h3>
      <select
        value={tipoPago}
        onChange={(e) => setTipoPago(e.target.value)}
        className="w-full border rounded px-3 py-2 text-sm"
      >
        <option value="tarjeta">Tarjeta</option>
        <option value="efectivo">Efectivo</option>
        <option value="bizum">Bizum</option>
        <option value="otros">Otros</option>
      </select>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

export default PaymentTypeDialog;
