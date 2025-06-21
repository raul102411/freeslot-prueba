const AppointmentDetailDialog = ({
  cita,
  onClose,
  onCancelar,
  onCompletar,
  onReabrir,
  onAnular, // ✅ NUEVA PROP
}: {
  cita: any;
  onClose: () => void;
  onCancelar: () => void;
  onCompletar: () => void;
  onReabrir: () => void;
  onActualizarEstado?: (idCita: string, nuevoEstado: string) => void;
  onAnular?: () => void; // 👈 AÑADIDO
}) => {
  if (!cita) return null;

  const estado = cita.estado?.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
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

        <h2 className="text-xl font-semibold mb-4">Detalle de la Cita</h2>

        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <strong>Servicio:</strong> {cita.servicio}
          </div>
          <div>
            <strong>Fecha:</strong> {cita.fecha}
          </div>
          <div>
            <strong>Hora:</strong> {cita.horaInicio} – {cita.horaFin}
          </div>
          <div>
            <strong>Estado:</strong> {cita.estado}
          </div>
          <div>
            <strong>Teléfono:</strong>{' '}
            {cita.telefono
              ?.replace(/\D/g, '')
              .replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3')}
          </div>
          {cita.email && (
            <div>
              <strong>Email:</strong> {cita.email}
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
          {cita.tipo_pago && (
            <div>
              <strong>Tipo de pago:</strong> {cita.tipo_pago}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <div className="flex justify-end gap-2 flex-wrap">
            {estado === 'confirmado' && (
              <>
                <button
                  onClick={onCompletar}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Completar
                </button>
                <button
                  onClick={onCancelar}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Cancelar
                </button>
              </>
            )}

            {estado === 'completado' && (
              <>
                <button
                  onClick={onReabrir}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Reabrir
                </button>
                <button
                  onClick={onAnular}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                >
                  Anular
                </button>
              </>
            )}

            {(estado === 'cancelado' || estado === 'anulado') && (
              <button
                onClick={onReabrir}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Reabrir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailDialog;
