import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

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
  const [trabajadores, setTrabajadores] = useState<
    { id_usuario: string; nombre: string }[]
  >([]);
  const [servicios, setServicios] = useState<
    { id_servicio: string; nombre_servicio: string; duracion_minutos: number }[]
  >([]);
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState<{
    empresa: string;
    logo: string;
  } | null>(null);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);

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

      const { data, error } = await supabase.rpc('obtener_horario_trabajador', {
        fecha_consulta: form.fecha,
        usuario_uuid: form.trabajador,
        servicio_uuid: form.servicio,
      });

      if (error) {
        toast.error('Error al obtener horarios disponibles');
        return;
      }

      const disponibles = (
        (data || []) as { estado: string; hora_inicio: string }[]
      )
        .filter((h) => h.estado === 'disponible')
        .map((h) => h.hora_inicio);

      setHorasDisponibles(disponibles);
    };

    fetchHoras();
  }, [form.trabajador, form.fecha, form.servicio]);

  const fetchEmpresa = async () => {
    const { data, error } = await supabase
      .from('empresas')
      .select('empresa, logo')
      .eq('id_empresa', id_empresa)
      .single();

    if (!error && data) {
      setEmpresa(data as { empresa: string; logo: string });
    }
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

    setTrabajadores((data || []) as { id_usuario: string; nombre: string }[]);
  };

  const fetchServicios = async () => {
    const { data, error } = await supabase
      .from('vista_cb_servicios')
      .select('*')
      .eq('id_empresa', id_empresa)
      .eq('id_usuario', form.trabajador);

    if (error) {
      toast.error('Error al cargar servicios');
      return;
    }

    setServicios(
      (data || []) as {
        id_servicio: string;
        nombre_servicio: string;
        duracion_minutos: number;
      }[]
    );
  };

  const formatTelefono = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, (_m, p1, p2, p3) =>
      [p1, p2, p3].filter(Boolean).join(' ')
    );
  };

  const isFechaValida = (fecha: string) => fecha >= hoy;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === 'telefono' ? formatTelefono(value) : value;

    if (name === 'fecha') {
      setForm({ ...form, fecha: newValue, hora: '' });
    } else if (name === 'servicio') {
      setForm({ ...form, servicio: value, hora: '' });
    } else {
      setForm({ ...form, [name]: newValue });
    }
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

    if (!trabajador || !servicio || !telefono || !fecha || !hora) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (!isFechaValida(fecha)) {
      toast.error('La fecha no puede ser anterior a hoy');
      return;
    }

    const telefonoSinEspacios = telefono.replace(/\s/g, '');
    if (telefonoSinEspacios.length !== 9) {
      toast.error('El teléfono debe tener 9 dígitos');
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

      if (estadoError || !estado) {
        throw new Error('No se encontró el estado "confirmado"');
      }

      const { error: insertError } = await supabase.from('citas').insert([
        {
          id_usuario: trabajador,
          id_servicio: servicio,
          telefono: formatTelefono(telefono),
          email: email || null,
          fecha_cita: fecha,
          hora_cita: hora,
          hora_fin: horaFin,
          id_estado: estado.id_estado,
        },
      ]);

      if (insertError) throw insertError;

      toast.success('Cita registrada con éxito');
      setForm(initialFormState);
    } catch {
      toast.error('Error al registrar la cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        {empresa && (
          <div className="text-center mb-4">
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

        <div>
          <Label htmlFor="trabajador">Trabajador</Label>
          <select
            name="trabajador"
            value={form.trabajador}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Selecciona un trabajador</option>
            {trabajadores.map((t) => (
              <option key={t.id_usuario} value={t.id_usuario}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="servicio">Servicio</Label>
          <select
            name="servicio"
            value={form.servicio}
            onChange={handleChange}
            className="w-full mt-1 border rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Selecciona un servicio</option>
            {servicios.map((s) => (
              <option key={s.id_servicio} value={s.id_servicio}>
                {s.nombre_servicio}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            type="tel"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="000 000 000"
            maxLength={11}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email (opcional)</Label>
          <Input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="cliente@correo.com"
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
            <Label htmlFor="hora">Hora</Label>
            {horasDisponibles.length > 0 ? (
              <select
                name="hora"
                value={form.hora}
                onChange={handleChange}
                className="w-full mt-1 border rounded px-3 py-2 text-sm"
                required
              >
                <option value="">Selecciona una hora</option>
                {horasDisponibles.map((hora) => (
                  <option key={hora} value={hora}>
                    {hora}
                  </option>
                ))}
              </select>
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
    </div>
  );
};

export default ClientBooking;
