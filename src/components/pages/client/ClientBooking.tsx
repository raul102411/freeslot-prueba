import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { enviarConfirmacionCita } from '@/components/email/emailService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, MapPin } from 'lucide-react';

const hoy = new Date().toISOString().split('T')[0];

const initialFormState = {
  trabajador: '',
  servicio: '',
  telefono: '',
  email: '',
  fecha: hoy,
  hora: '',
};

const ClientBooking = () => {
  const { id_empresa } = useParams();
  const [trabajadores, setTrabajadores] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState<any>(null);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);

  useEffect(() => {
    if (id_empresa) {
      fetchEmpresa();
      fetchTrabajadores();
    }
  }, [id_empresa]);

  useEffect(() => {
    if (form.trabajador && id_empresa) {
      fetchServicios();
    } else {
      setServicios([]);
    }
  }, [form.trabajador, id_empresa]);

  useEffect(() => {
    const fetchHoras = async () => {
      if (!form.trabajador || !form.fecha || !form.servicio) {
        setHorasDisponibles([]);
        return;
      }

      const { data, error } = await supabase.rpc(
        'obtener_horarios_trabajador',
        {
          fecha_consulta: form.fecha,
          usuario_uuid: form.trabajador,
          servicio_uuid: form.servicio,
        }
      );

      if (error) {
        toast.error('Error al obtener horarios disponibles');
        return;
      }

      const disponibles = (data || [])
        .filter((h: any) => h.estado === 'disponible')
        .map((h: any) => h.hora_inicio);

      setHorasDisponibles(disponibles);
    };

    fetchHoras();
  }, [form.trabajador, form.fecha, form.servicio]);

  const fetchEmpresa = async () => {
    setLoadingEmpresa(true);
    const { data, error } = await supabase
      .from('vista_empresa_detalle')
      .select('empresa, logo, telefono, direccion, reservas_online')
      .eq('id_empresa', id_empresa)
      .single();

    if (error) {
      toast.error('Error al cargar los datos de la empresa');
    } else if (data) {
      setEmpresa(data);
    }

    setLoadingEmpresa(false);
  };

  const fetchTrabajadores = async () => {
    const { data, error } = await supabase
      .from('vista_cb_trabajadores')
      .select('id_usuario, nombre')
      .eq('id_empresa', id_empresa);

    if (error) {
      toast.error('Error al cargar trabajadores');
      return;
    }

    setTrabajadores(data || []);
  };

  const fetchServicios = async () => {
    const { data, error } = await supabase
      .from('vista_servicios')
      .select('id_servicio, nombre_servicio, duracion_minutos, precio')
      .eq('id_empresa', id_empresa)
      .eq('id_usuario', form.trabajador);

    if (error) {
      toast.error('Error al cargar servicios');
      return;
    }

    setServicios(data || []);
  };

  const formatTelefono = (valor: string): string => {
    let limpio = valor.trim().replace(/\s+/g, '');
    if (limpio.startsWith('00')) limpio = '+' + limpio.slice(2);
    limpio = limpio.replace(/[^\d+]/g, '');
    if (limpio.includes('+'))
      limpio = '+' + limpio.replace(/\+/g, '').replace(/[^\d]/g, '');
    return limpio;
  };

  const isFechaValida = (fecha: string) => fecha >= hoy;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === 'telefono' ? formatTelefono(value) : value;

    if (name === 'fecha') setForm({ ...form, fecha: newValue, hora: '' });
    else if (name === 'servicio')
      setForm({ ...form, servicio: newValue, hora: '' });
    else setForm({ ...form, [name]: newValue });
  };

  const calcularHoraFin = (horaInicio: string, duracion: number): string => {
    const [h, m] = horaInicio.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, 0, 0);
    const fin = new Date(inicio.getTime() + duracion * 60000);
    return fin.toTimeString().substring(0, 5);
  };

  const handleSubmit = async () => {
    const { trabajador, servicio, telefono, fecha, hora, email } = form;

    if (!trabajador || !servicio || !telefono || !fecha || !hora || !email) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!isFechaValida(fecha)) {
      toast.error('La fecha no puede ser anterior a hoy');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email no válido');
      return;
    }

    const servicioSeleccionado = servicios.find(
      (s) => s.id_servicio === servicio
    );
    if (!servicioSeleccionado) {
      toast.error('Servicio no válido');
      return;
    }

    const horaFin = calcularHoraFin(
      hora,
      servicioSeleccionado.duracion_minutos
    );

    setLoading(true);

    try {
      const { data: estado, error: estadoError } = await supabase
        .from('estados')
        .select('id_estado')
        .eq('estado', 'confirmado')
        .single();

      if (estadoError || !estado)
        throw new Error('No se encontró el estado "confirmado"');

      const { data: nuevaCita, error: insertError } = await supabase
        .from('citas')
        .insert([
          {
            id_usuario: trabajador,
            id_servicio: servicio,
            telefono: formatTelefono(telefono),
            email,
            fecha_cita: fecha,
            hora_cita: hora,
            hora_fin: horaFin,
            id_estado: estado.id_estado,
          },
        ])
        .select('id_cita')
        .single();

      if (insertError) throw insertError;

      toast.success('Cita registrada con éxito');
      setForm(initialFormState);

      await enviarConfirmacionCita({
        email,
        servicio: servicioSeleccionado.nombre_servicio,
        fecha,
        hora,
        empresa: empresa?.empresa || '',
        cancel_url: `${window.location.origin}/cancelar-cita?id=${nuevaCita.id_cita}`,
        booking_url: `${window.location.origin}/client-booking/${id_empresa}`,
      });
    } catch {
      toast.error('Error al registrar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white rounded-xl shadow p-6 space-y-6">
        {empresa && (
          <div className="text-center mb-2">
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

        {loadingEmpresa ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
          </div>
        ) : empresa?.reservas_online ? (
          <div className="space-y-4">
            <div>
              <Label>Trabajador</Label>
              <Select
                value={form.trabajador}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    trabajador: value,
                    servicio: '',
                    hora: '',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un trabajador" />
                </SelectTrigger>
                <SelectContent>
                  {trabajadores.map((t) => (
                    <SelectItem key={t.id_usuario} value={t.id_usuario}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Servicio</Label>
              <Select
                value={form.servicio}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    servicio: value,
                    hora: '',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((s) => (
                    <SelectItem key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre_servicio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.servicio && (
                <p className="text-sm text-gray-600 mt-1">
                  Precio:{' '}
                  <span className="font-semibold">
                    {servicios.find((s) => s.id_servicio === form.servicio)
                      ?.precio ?? 0}{' '}
                    €
                  </span>
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                min={hoy}
                required
              />
            </div>

            {isFechaValida(form.fecha) && (
              <div>
                <Label>Hora</Label>
                {horasDisponibles.length > 0 ? (
                  <Select
                    value={form.hora}
                    onValueChange={(value) =>
                      setForm((prev) => ({ ...prev, hora: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {horasDisponibles.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {hora}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    No hay horarios disponibles para este día.
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Reservando...' : 'Reservar'}
            </Button>
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-md text-sm space-y-2 text-center">
            <p>Esta empresa no permite reservas online en este momento.</p>
          </div>
        )}
        {/* Separador inferior */}
        {empresa && (empresa.telefono || empresa.direccion) && (
          <div className="mt-6 pt-4 border-t text-sm text-center text-gray-500 space-y-1">
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

export default ClientBooking;
