import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import {
  CalendarDays,
  Clock,
  UserRound,
  Bell,
  Phone,
  MapPin,
} from 'lucide-react';

const CancelBooking = () => {
  const [searchParams] = useSearchParams();
  const idCita = searchParams.get('id');

  const [loadingCita, setLoadingCita] = useState(true);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [motivo, setMotivo] = useState('');

  const [cita, setCita] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [cancelada, setCancelada] = useState(false);
  const [citaPasada, setCitaPasada] = useState(false);

  useEffect(() => {
    if (idCita) fetchCita();
    else setLoadingCita(false);
  }, [idCita]);

  const fetchCita = async () => {
    setLoadingCita(true);
    const { data: citaData, error } = await supabase
      .from('vista_citas_detalle')
      .select('*')
      .eq('id_cita', idCita)
      .single();

    if (error || !citaData) {
      toast.error('Cita no encontrada');
      setLoadingCita(false);
      return;
    }

    setCita(citaData);
    setCancelada(citaData.estado_cita === 'cancelado');

    // Verifica si la cita ya pasó
    const citaFechaHora = new Date(
      `${citaData.fecha_cita}T${citaData.hora_cita}`
    );
    setCitaPasada(citaFechaHora < new Date());

    const { data: empresaData, error: empresaError } = await supabase
      .from('vista_empresa_detalle')
      .select('empresa, logo, telefono, direccion, reservas_online')
      .eq('id_empresa', citaData.id_empresa)
      .single();

    if (!empresaError && empresaData) {
      setEmpresa(empresaData);
    }

    setLoadingCita(false);
  };

  const cancelarCita = async () => {
    setLoadingCancel(true);

    const { data: estadoCancelado, error: estadoError } = await supabase
      .from('estados')
      .select('id_estado')
      .eq('estado', 'cancelado')
      .single();

    if (estadoError || !estadoCancelado) {
      toast.error('No se encontró el estado "cancelado"');
      setLoadingCancel(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('citas')
      .update({
        id_estado: estadoCancelado.id_estado,
        motivo_cancelacion: motivo.trim() || null,
      })
      .eq('id_cita', idCita);

    if (updateError) {
      toast.error('No se pudo cancelar la cita');
    } else {
      toast.success('Cita cancelada correctamente');
      await fetchCita(); // vuelve a cargar datos reales
    }

    setLoadingCancel(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-6">
        {empresa && (
          <div className="text-center">
            {empresa.logo && (
              <img
                src={empresa.logo}
                alt="Logo empresa"
                className="h-16 mx-auto mb-2 object-contain"
              />
            )}
            <h1 className="text-xl font-bold text-gray-800">
              {empresa.empresa}
            </h1>
          </div>
        )}

        {loadingCita ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
          </div>
        ) : !idCita ? (
          <p className="text-red-600 text-center">
            ID de cita no proporcionado.
          </p>
        ) : !cita ? (
          <p className="text-red-600 text-center">Cita no encontrada.</p>
        ) : cancelada ? (
          <>
            <div className="space-y-3">
              <div className="bg-red-100 text-red-800 text-sm p-3 rounded-md border border-red-300">
                Esta cita fue cancelada.
              </div>

              <div className="bg-gray-50 rounded-md p-4 shadow-sm space-y-2 text-sm">
                <p className="flex items-center gap-2 text-gray-700">
                  <Bell className="w-4 h-4" />
                  <strong>Servicio:</strong> {cita.nombre_servicio}
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <UserRound className="w-4 h-4" />
                  <strong>Profesional:</strong> {cita.nombre_completo}
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <CalendarDays className="w-4 h-4" />
                  <strong>Fecha:</strong> {cita.fecha_cita}
                </p>
                <p className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <strong>Hora:</strong> {cita.hora_cita}
                </p>
              </div>

              {empresa?.empresa && empresa.reservas_online && (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.location.assign(`/client-booking/${cita.id_empresa}`)
                  }
                  className="w-full"
                >
                  Reagendar cita en {empresa.empresa}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            {citaPasada && (
              <>
                <div className="bg-yellow-100 text-yellow-800 text-sm p-3 rounded-md border border-yellow-300">
                  Esta cita ya ha pasado.
                </div>

                <div className="bg-gray-50 rounded-md p-4 shadow-sm space-y-2 text-sm mt-3">
                  <p className="flex items-center gap-2 text-gray-700">
                    <Bell className="w-4 h-4" />
                    <strong>Servicio:</strong> {cita.nombre_servicio}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <UserRound className="w-4 h-4" />
                    <strong>Profesional:</strong> {cita.nombre_completo}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <CalendarDays className="w-4 h-4" />
                    <strong>Fecha:</strong> {cita.fecha_cita}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <strong>Hora:</strong> {cita.hora_cita}
                  </p>
                </div>

                {empresa?.empresa && empresa.reservas_online && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.location.assign(
                        `/client-booking/${cita.id_empresa}`
                      )
                    }
                    className="w-full mt-4"
                  >
                    Reagendar cita en {empresa.empresa}
                  </Button>
                )}
              </>
            )}

            {!citaPasada && (
              <>
                <div className="bg-gray-50 rounded-md p-4 shadow-sm space-y-2 text-sm mt-3">
                  <p className="flex items-center gap-2 text-gray-700">
                    <Bell className="w-4 h-4" />
                    <strong>Servicio:</strong> {cita.nombre_servicio}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <UserRound className="w-4 h-4" />
                    <strong>Profesional:</strong> {cita.nombre_completo}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <CalendarDays className="w-4 h-4" />
                    <strong>Fecha:</strong> {cita.fecha_cita}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4" />
                    <strong>Hora:</strong> {cita.hora_cita}
                  </p>
                </div>

                <div>
                  <Label htmlFor="motivo">
                    Motivo de cancelación{' '}
                    <span className="text-gray-400 text-sm">(opcional)</span>
                  </Label>
                  <Input
                    id="motivo"
                    name="motivo"
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej. No podré asistir..."
                  />
                </div>

                <Button
                  onClick={cancelarCita}
                  disabled={loadingCancel}
                  className="w-full bg-red-600 text-white hover:bg-red-700"
                >
                  {loadingCancel ? 'Cancelando...' : 'Cancelar cita'}
                </Button>
              </>
            )}
          </>
        )}

        {empresa && (empresa.telefono || empresa.direccion) && (
          <div className="mt-6 pt-4 border-t text-sm text-center text-gray-500">
            {empresa.telefono && (
              <p className="flex items-center justify-center gap-1">
                <Phone className="w-4 h-4" />{' '}
                <a
                  href={`tel:${empresa.telefono}`}
                  className="text-blue-600 underline"
                >
                  {empresa.telefono}
                </a>
              </p>
            )}
            {empresa.direccion && (
              <p className="flex items-center justify-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />{' '}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    empresa.direccion
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {empresa.direccion}
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelBooking;
