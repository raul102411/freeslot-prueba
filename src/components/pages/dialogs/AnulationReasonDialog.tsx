const AnulationReasonDialog = ({
  motivo,
  setMotivo,
  onCancel,
  onConfirm,
}: {
  motivo: string;
  setMotivo: (valor: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">
          Motivo de anulación (opcional)
        </h3>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Escribe el motivo si lo deseas..."
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnulationReasonDialog;
