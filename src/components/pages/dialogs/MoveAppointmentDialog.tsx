import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  citaId: string;
  initialDate?: string;
  initialTime?: string;
  initialObservaciones?: string;
  initialHoraFin?: string;
  duracionMinutos: number;
}

const calcularHoraFin = (hora: string, duracion: number): string => {
  if (!hora || !duracion) return '';
  const [h, m] = hora.split(':').map(Number);
  const inicio = new Date();
  inicio.setHours(h, m, 0, 0);
  const fin = new Date(inicio.getTime() + duracion * 60000);
  return fin.toTimeString().slice(0, 5);
};

const MoveAppointmentDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  citaId,
  initialDate = '',
  initialTime = '',
  initialObservaciones = '',
  initialHoraFin = '',
  duracionMinutos,
}) => {
  const [fecha, setFecha] = useState(initialDate);
  const [hora, setHora] = useState(initialTime);
  const [horaFin, setHoraFin] = useState(initialHoraFin);
  const [observaciones, setObservaciones] = useState(initialObservaciones);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hora && duracionMinutos) {
      const nuevaFin = calcularHoraFin(hora, duracionMinutos);
      setHoraFin(nuevaFin);
    }
  }, [hora, duracionMinutos]);

  const handleSave = async () => {
    if (!fecha || !hora) {
      toast.error('Debes indicar una nueva fecha y hora');
      return;
    }

    const ahora = new Date();
    const seleccion = new Date(`${fecha}T${hora}`);
    if (seleccion < ahora) {
      toast.error('No se puede mover la cita a una hora pasada');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('citas')
      .update({
        fecha_cita: fecha,
        hora_cita: hora,
        hora_fin: horaFin,
        observaciones,
      })
      .eq('id_cita', citaId);

    setLoading(false);

    if (error) {
      console.error('Error al mover la cita:', error);
      toast.error('No se pudo mover la cita');
      return;
    }

    toast.success('Cita movida correctamente');
    onSuccess();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-[90vw] max-w-md p-6 mx-auto">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
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

        <h2 className="text-xl font-semibold mb-4">Mover cita</h2>

        <div className="space-y-3 text-sm">
          {/* Fecha nueva */}
          <div>
            <label className="block font-medium mb-1">Nueva fecha</label>
            <DatePicker
              selected={fecha ? new Date(fecha) : null}
              onChange={(date: Date | null) => {
                if (!date) return;
                const formatted = date.toISOString().split('T')[0];
                setFecha(formatted);
              }}
              minDate={new Date()}
              dateFormat="yyyy-MM-dd"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Hora nueva */}
          <div>
            <label className="block font-medium mb-1">Hora de inicio</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => {
                const nuevaHora = e.target.value;
                const hoy = new Date().toISOString().split('T')[0];
                if (
                  fecha === hoy &&
                  nuevaHora < new Date().toTimeString().slice(0, 5)
                ) {
                  toast.error('No puedes seleccionar una hora pasada');
                  return;
                }
                setHora(nuevaHora);
              }}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Hora fin */}
          <div>
            <label className="block font-medium mb-1">Hora de fin</label>
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block font-medium mb-1">Observaciones</label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveAppointmentDialog;
