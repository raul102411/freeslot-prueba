import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { enviarConfirmacionCita } from '@/components/email/emailService';
import { useServiciosPorUsuario } from '@/components/hooks/useServicios';

export type NewCita = {
  trabajador: string;
  servicio: string;
  telefono: string;
  email: string;
  observaciones: string;
  fecha: string;
  hora: string;
  horaFin: string;
};

type Servicio = {
  id_servicio: string;
  nombre_servicio: string;
  precio: number;
  duracion_minutos: number;
};

type Trabajador = {
  id_usuario: string;
  nombre: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  trabajadores?: Trabajador[];
  incluirTrabajador?: boolean;
  initialData: NewCita;
  onChangeCita?: (cita: NewCita) => void;
  idEmpresa: string | null;
  idUsuario: string;
  onCitaCreada?: () => void;
};

const calcularHoraFin = (hora: string, duracion: number): string => {
  if (!hora || !duracion) return '';
  const [h, m] = hora.split(':').map(Number);
  const inicio = new Date();
  inicio.setHours(h, m, 0, 0);
  const fin = new Date(inicio.getTime() + duracion * 60000);
  return fin.toTimeString().slice(0, 5);
};

const NewAppointmentDialog = ({
  open,
  onClose,
  trabajadores = [],
  incluirTrabajador = false,
  initialData,
  onChangeCita,
  idEmpresa,
  idUsuario,
  onCitaCreada,
}: Props) => {
  const [cita, setCita] = useState<NewCita>(initialData);
  const [loading, setLoading] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const emailAutocompletado = useRef(false);

  // Carga de servicios dentro del dialog
  const serviciosUsuario = useServiciosPorUsuario(
    incluirTrabajador ? cita.trabajador : idUsuario,
    idEmpresa!
  );
  const serviciosDisponibles: Servicio[] = serviciosUsuario || [];

  useEffect(() => {
    setCita(initialData);
  }, [initialData]);

  useEffect(() => {
    const fetchEmpresa = async () => {
      if (!idEmpresa) return;
      const { data, error } = await supabase
        .from('vista_empresa_detalle')
        .select('empresa')
        .eq('id_empresa', idEmpresa)
        .single();
      if (!error && data) setEmpresaNombre(data.empresa);
    };
    fetchEmpresa();
  }, [idEmpresa]);

  const updateCita = (updated: Partial<NewCita>) => {
    const nuevaCita = { ...cita, ...updated };
    setCita(nuevaCita);
    onChangeCita?.(nuevaCita);
  };

  const buscarEmailPorTelefono = async (telefono: string) => {
    if (!telefono || !idEmpresa) return;
    const { data } = await supabase
      .from('vista_citas_detalle')
      .select('email_contacto, fecha_creacion')
      .eq('telefono', telefono)
      .eq('id_empresa', idEmpresa)
      .neq('email_contacto', '')
      .order('fecha_creacion', { ascending: false })
      .limit(1);

    if (data?.length && !cita.email) {
      updateCita({ email: data[0].email_contacto });
      emailAutocompletado.current = true;
      toast.success('Email anterior cargado automáticamente');
    }
  };

  const guardarCita = async () => {
    const { trabajador, servicio, telefono, email, fecha, hora, horaFin } =
      cita;

    if (loading) return;
    setLoading(true);

    if (!trabajador || !servicio || !telefono || !fecha || !hora) {
      toast.error('Completa todos los campos obligatorios');
      setLoading(false);
      return;
    }

    try {
      const { data: estado } = await supabase
        .from('estados')
        .select('id_estado')
        .eq('estado', 'confirmado')
        .single();

      if (!estado) throw new Error('Estado no encontrado');

      const servicioSeleccionado = serviciosDisponibles.find(
        (s) => s.id_servicio === servicio
      );

      const { data: insertada, error: insertError } = await supabase
        .from('citas')
        .insert([
          {
            id_usuario: trabajador,
            id_servicio: servicio,
            telefono,
            email,
            fecha_cita: fecha,
            hora_cita: hora,
            hora_fin: horaFin,
            id_estado: estado.id_estado,
            observaciones: cita.observaciones,
            precio: servicioSeleccionado?.precio ?? null,
          },
        ])
        .select('id_cita')
        .single();

      if (insertError) throw insertError;

      toast.success('Cita registrada correctamente');
      onCitaCreada?.();

      if (email) {
        const nombreServicio =
          serviciosDisponibles.find((s) => s.id_servicio === servicio)
            ?.nombre_servicio || '';
        await enviarConfirmacionCita({
          email,
          servicio: nombreServicio,
          fecha,
          hora,
          empresa: empresaNombre,
          cancel_url: `${window.location.origin}/cancelar-cita?id=${insertada.id_cita}`,
          booking_url: `${window.location.origin}/client-booking/${idEmpresa}`,
        });
      }

      const nuevaCita: NewCita = {
        trabajador: cita.trabajador,
        servicio: '',
        telefono: '',
        email: '',
        observaciones: '',
        fecha: '',
        hora: '',
        horaFin: '',
      };
      setCita(nuevaCita);
      onChangeCita?.(nuevaCita);
    } catch {
      toast.error('No se pudo guardar la cita');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-[90vw] max-w-md p-6 mx-auto">
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

        <h2 className="text-xl font-semibold mb-4">Nueva cita</h2>

        <div className="space-y-3 text-sm">
          {incluirTrabajador && (
            <div>
              <label className="block font-medium">Trabajador</label>
              <select
                value={cita.trabajador}
                onChange={(e) =>
                  updateCita({
                    trabajador: e.target.value,
                    servicio: '',
                    horaFin: '',
                  })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccionar</option>
                {trabajadores.map((t) => (
                  <option key={t.id_usuario} value={t.id_usuario}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-medium">Servicio</label>
            <select
              value={cita.servicio}
              onChange={(e) => {
                const id = e.target.value;
                const servicioSel = serviciosDisponibles.find(
                  (s) => s.id_servicio === id
                );
                const duracion = servicioSel?.duracion_minutos || 0;
                updateCita({
                  servicio: id,
                  horaFin: calcularHoraFin(cita.hora, duracion),
                });
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Seleccionar</option>
              {serviciosDisponibles.map((s) => (
                <option key={s.id_servicio} value={s.id_servicio}>
                  {s.nombre_servicio}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Teléfono</label>
            <input
              type="text"
              value={cita.telefono}
              onChange={(e) => {
                const nuevoTelefono = e.target.value;
                const debeLimpiarEmail =
                  emailAutocompletado.current &&
                  nuevoTelefono !== cita.telefono;
                updateCita({
                  telefono: nuevoTelefono,
                  ...(debeLimpiarEmail ? { email: '' } : {}),
                });
                if (debeLimpiarEmail) {
                  toast.info('Email eliminado por cambio de teléfono');
                  emailAutocompletado.current = false;
                }
              }}
              onBlur={(e) => buscarEmailPorTelefono(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Email (opcional)</label>
            <input
              type="email"
              value={cita.email}
              onChange={(e) => {
                updateCita({ email: e.target.value });
                emailAutocompletado.current = false;
              }}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Observaciones</label>
            <textarea
              value={cita.observaciones}
              onChange={(e) => updateCita({ observaciones: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Fecha</label>
            <input
              type="date"
              value={cita.fecha}
              onChange={(e) => updateCita({ fecha: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Hora de inicio</label>
            <input
              type="time"
              value={cita.hora}
              onChange={(e) => {
                const hora = e.target.value;
                const servicioSel = serviciosDisponibles.find(
                  (s) => s.id_servicio === cita.servicio
                );
                const duracion = servicioSel?.duracion_minutos || 0;
                updateCita({
                  hora,
                  horaFin: calcularHoraFin(hora, duracion),
                });
              }}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Hora de fin</label>
            <input
              type="time"
              value={cita.horaFin}
              onChange={(e) => updateCita({ horaFin: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={guardarCita}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Guardar cita'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentDialog;
