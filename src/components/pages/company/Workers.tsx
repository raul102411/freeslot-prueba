import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { WorkerDialog } from '@/components/pages/dialogs/WorkerDialog';

type Schedule = {
  id_horario?: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

const diasSemana = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const PAGE_SIZE = 15; // o el número que prefieras por página

const Workers = () => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    intervaloCita: 15,
  });

  const [schedulesByDay, setSchedulesByDay] = useState<
    Record<string, Schedule[]>
  >({});

  const [newScheduleDay, setNewScheduleDay] = useState<string | null>(null);
  const [newScheduleForm, setNewScheduleForm] = useState<Schedule>({
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
  });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    const empresaId = localStorage.getItem('id_empresa');
    const { data, error } = await supabase
      .from('vista_trabajadores_detalles')
      .select('*')
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar trabajadores');
      return;
    }

    setWorkers(data || []);
  };

  const fetchSchedules = async (id_usuario: string) => {
    const { data, error } = await supabase
      .from('vista_horario_trabajador')
      .select('*')
      .eq('id_usuario', id_usuario);

    if (error) {
      toast.error('Error al cargar horarios');
      setSchedulesByDay({});
      return;
    }

    console.log('Horarios raw:', data);

    const grouped: Record<string, Schedule[]> = {};
    diasSemana.forEach((d) => (grouped[d] = []));

    (data || []).forEach((h) => {
      const diaNormalizado =
        h.dia_semana.trim().charAt(0).toUpperCase() +
        h.dia_semana.trim().slice(1).toLowerCase();

      if (!grouped[diaNormalizado]) grouped[diaNormalizado] = [];
      grouped[diaNormalizado].push({
        id_horario: h.id_horario,
        dia_semana: diaNormalizado,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
      });
    });

    setSchedulesByDay(grouped);
  };

  const fetchAvailableServices = async (empresaId: string) => {
    const { data } = await supabase
      .from('vista_servicios_detalle')
      .select('id_servicio, servicio')
      .eq('id_empresa', empresaId)
      .eq('activo', true);

    setAvailableServices(data || []);
  };

  const fetchAssignedServices = async (userId: string) => {
    const { data } = await supabase
      .from('vista_servicios_usuarios')
      .select('id_servicio')
      .eq('id_usuario', userId);

    setAssignedServiceIds(data?.map((s) => s.id_servicio) || []);
  };

  const openCreateModal = () => {
    const empresaId = localStorage.getItem('id_empresa');
    if (!empresaId) {
      toast.error('ID de empresa no disponible');
      return;
    }

    setEditingWorker(null);
    setForm({
      email: '',
      fullName: '',
      intervaloCita: 15,
    });
    setSchedulesByDay({});
    setNewScheduleDay(null);
    setAssignedServiceIds([]);
    fetchAvailableServices(empresaId);
    setOpen(true);
  };

  const openEditModal = async (worker: any) => {
    const empresaId = localStorage.getItem('id_empresa');
    if (!empresaId) {
      toast.error('ID de empresa no disponible');
      return;
    }

    setEditingWorker(worker);
    setForm({
      email: worker.email,
      fullName: worker.nombre_completo,
      intervaloCita: worker.intervalo_cita || 15,
    });
    await fetchSchedules(worker.id_usuario);
    await fetchAvailableServices(empresaId);
    await fetchAssignedServices(worker.id_usuario);
    setNewScheduleDay(null);
    setOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleScheduleChange = (
    dia: string,
    idx: number,
    field: keyof Schedule,
    value: string
  ) => {
    const daySchedules = schedulesByDay[dia] || [];
    const newDaySchedules = [...daySchedules];
    newDaySchedules[idx] = { ...newDaySchedules[idx], [field]: value };
    setSchedulesByDay({ ...schedulesByDay, [dia]: newDaySchedules });
  };

  const addScheduleClick = (dia: string) => {
    setNewScheduleDay(dia);
    setNewScheduleForm({
      dia_semana: dia,
      hora_inicio: '',
      hora_fin: '',
    });
  };

  const handleNewScheduleChange = (field: keyof Schedule, value: string) => {
    setNewScheduleForm({
      ...newScheduleForm,
      [field]: value,
    });
  };

  const saveNewSchedule = () => {
    if (!newScheduleForm.hora_inicio || !newScheduleForm.hora_fin) {
      toast.error('Completa la hora de inicio y fin');
      return;
    }
    const daySchedules = schedulesByDay[newScheduleDay!] || [];
    setSchedulesByDay({
      ...schedulesByDay,
      [newScheduleDay!]: [...daySchedules, newScheduleForm],
    });
    setNewScheduleDay(null);
    setNewScheduleForm({
      dia_semana: '',
      hora_inicio: '',
      hora_fin: '',
    });
  };

  const cancelNewSchedule = () => {
    setNewScheduleDay(null);
    setNewScheduleForm({
      dia_semana: '',
      hora_inicio: '',
      hora_fin: '',
    });
  };

  const removeSchedule = (dia: string, idx: number) => {
    const daySchedules = schedulesByDay[dia] || [];
    const newDaySchedules = [...daySchedules];
    newDaySchedules.splice(idx, 1);
    setSchedulesByDay({ ...schedulesByDay, [dia]: newDaySchedules });
  };

  const horariosInvalidos = (horarios: Schedule[]): string | null => {
    const sorted = [...horarios].sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio)
    );

    for (let i = 0; i < sorted.length; i++) {
      const { hora_inicio, hora_fin } = sorted[i];

      if (!hora_inicio || !hora_fin) return 'Campos de horario incompletos';
      if (hora_fin <= hora_inicio)
        return 'La hora de fin debe ser mayor que la de inicio';

      if (i < sorted.length - 1) {
        const siguienteInicio = sorted[i + 1].hora_inicio;
        if (hora_fin > siguienteInicio) return 'Los horarios se solapan';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const { email, fullName, intervaloCita } = form;
    const empresaId = localStorage.getItem('id_empresa');

    if (!email || !fullName) {
      toast.error('Completa todos los campos');
      return;
    }

    let userId: string | null = null;

    // 1. Intentar crear el usuario en Supabase Auth
    const { data: signUpData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email,
        user_metadata: { full_name: fullName },
        email_confirm: false,
      });

    if (signUpData?.user?.id) {
      userId = signUpData.user.id;

      // Envía correo para configurar contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        toast.error('Error enviando correo de recuperación');
        return;
      }
    } else if (
      signUpError?.code === 'email_exists' ||
      signUpError?.message?.includes('already registered')
    ) {
      const { data: userListData, error: userListError } =
        await supabase.auth.admin.listUsers();
      if (userListError || !userListData?.users?.length) {
        toast.error('No se pudieron listar los usuarios.');
        return;
      }

      const foundUser = userListData.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      if (!foundUser) {
        toast.error(
          'El usuario ya existe, pero no se pudo recuperar su información.'
        );
        return;
      }

      userId = foundUser.id;

      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: fullName },
      });
    } else {
      toast.error('Error al crear usuario: ' + signUpError?.message);
      return;
    }

    // 2. Obtener ID del perfil "trabajador"
    const { data: perfilesData, error: perfilesError } = await supabase
      .from('perfiles')
      .select('id_perfil')
      .eq('perfil', 'trabajador')
      .single();

    if (perfilesError || !perfilesData?.id_perfil) {
      toast.error('Error al obtener el perfil trabajador');
      return;
    }

    const idPerfil = perfilesData.id_perfil;

    // 3. Verificar si ya tiene ese perfil en la empresa
    const { data: existingPerfil, error } = await supabase
      .from('usuarios_perfiles')
      .select('*')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId)
      .eq('id_perfil', idPerfil)
      .maybeSingle();

    if (error) {
      toast.error('Error buscando perfil: ' + error.message);
      return;
    }

    if (!existingPerfil) {
      const { error: insertPerfilError } = await supabase
        .from('usuarios_perfiles')
        .insert([
          {
            id_usuario: userId,
            id_perfil: idPerfil,
            id_empresa: empresaId,
            intervalo_cita: intervaloCita,
            activo: true,
          },
        ]);

      if (insertPerfilError) {
        toast.error('Error al crear perfil: ' + insertPerfilError.message);
        return;
      }
    }

    // 4. Asignar servicios
    await supabase.from('servicios_usuarios').delete().eq('id_usuario', userId);

    if (assignedServiceIds.length > 0) {
      const inserts = assignedServiceIds.map((id) => ({
        id_usuario: userId,
        id_servicio: id,
      }));
      const { error: serviciosError } = await supabase
        .from('servicios_usuarios')
        .insert(inserts);

      if (serviciosError) {
        toast.error('Error al guardar servicios');
        return;
      }
    }

    // 5. Insertar horarios
    await supabase
      .from('horario_trabajador')
      .delete()
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId);

    // Validar solapamientos
    for (const [dia, horarios] of Object.entries(schedulesByDay)) {
      const errorMsg = horariosInvalidos(horarios);
      if (errorMsg) {
        toast.error(`Error en ${dia}: ${errorMsg}`);
        return;
      }
    }

    let horariosToInsert: any[] = [];
    Object.values(schedulesByDay).forEach((horarios) => {
      horarios.forEach((h) => {
        if (h.hora_inicio && h.hora_fin && h.dia_semana) {
          const diaNormalizado =
            h.dia_semana.trim().charAt(0).toUpperCase() +
            h.dia_semana.trim().slice(1).toLowerCase();

          horariosToInsert.push({
            id_usuario: userId,
            id_empresa: empresaId,
            dia_semana: diaNormalizado,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            fecha_creacion: new Date().toISOString(),
          });
        }
      });
    });

    if (horariosToInsert.length > 0) {
      console.log('Horarios a insertar:', horariosToInsert);
      const { error: insertError } = await supabase
        .from('horario_trabajador')
        .insert(horariosToInsert);

      if (insertError) {
        toast.error('Error al insertar horarios');
        return;
      }
    }

    toast.success('Trabajador guardado correctamente');
    setOpen(false);
    setEditingWorker(null);
    setForm({ email: '', fullName: '', intervaloCita: 15 });
    setSchedulesByDay({});
    setNewScheduleDay(null);
    fetchWorkers();
  };

  const filtered = workers.filter((w) => {
    const q = filter.toLowerCase();
    return (
      (w.nombre_completo?.toLowerCase?.() || '').includes(q) ||
      (w.email?.toLowerCase?.() || '').includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-6 mt-12 sm:mt-0">
        <h1 className="text-2xl font-bold text-gray-800">Trabajadores</h1>
        {workers.length > 0 && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir trabajador
          </Button>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre o email"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <WorkerDialog
        open={open}
        setOpen={setOpen}
        editingWorker={editingWorker}
        form={form}
        setForm={setForm}
        availableServices={availableServices}
        assignedServiceIds={assignedServiceIds}
        setAssignedServiceIds={setAssignedServiceIds}
        schedulesByDay={schedulesByDay}
        setSchedulesByDay={setSchedulesByDay}
        newScheduleDay={newScheduleDay}
        setNewScheduleDay={setNewScheduleDay}
        newScheduleForm={newScheduleForm}
        setNewScheduleForm={setNewScheduleForm}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleScheduleChange={handleScheduleChange}
        addScheduleClick={addScheduleClick}
        handleNewScheduleChange={handleNewScheduleChange}
        saveNewSchedule={saveNewSchedule}
        cancelNewSchedule={cancelNewSchedule}
        removeSchedule={removeSchedule}
      />

      {workers.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-lg font-semibold mb-2">
            Sin trabajadores registrados
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Aún no has agregado ningún trabajador.
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir trabajador
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold mb-2">Sin coincidencias</p>
          <p className="text-sm text-gray-400">
            No se encontraron trabajadores con ese criterio.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-md shadow border">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Intervalo cita</th>
                  <th className="px-4 py-2 text-left">Confirmado</th>
                  <th className="px-4 py-2 text-left">Activo</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((worker) => (
                  <tr key={worker.id_usuario} className="border-t">
                    <td className="px-4 py-2">{worker.nombre_completo}</td>
                    <td className="px-4 py-2">{worker.email}</td>
                    <td className="px-4 py-2">{worker.intervalo_cita} min</td>
                    <td className="px-4 py-2">
                      {worker.confirmado ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {worker.activo ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => openEditModal(worker)}
                        aria-label="Editar trabajador"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-end items-center mt-4 gap-2 text-sm">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Workers;
