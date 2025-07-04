import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, X } from 'lucide-react';
import { diasSemana } from '@/lib/constants';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Switch } from '@/components/ui/switch';

type Schedule = {
  id_horario?: string;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

type WorkerDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  editingWorker: any;
  onSaved: () => void; // Para notificar cuando se guarda con éxito
  availableServices: any[];
};

export const WorkerDialog = ({
  open,
  setOpen,
  editingWorker,
  onSaved,
  availableServices,
}: WorkerDialogProps) => {
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    intervaloCita: 15,
    activo: true,
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
  const [localServices, setLocalServices] = useState<any[]>(availableServices);

  const empresaId = localStorage.getItem('id_empresa');

  useEffect(() => {
    if (!open) return;

    if (editingWorker) {
      setForm({
        email: editingWorker.email,
        fullName: editingWorker.nombre_completo,
        intervaloCita: editingWorker.intervalo_cita || 15,
        activo: editingWorker.activo,
      });
      cargarHorarios(editingWorker.id_usuario);
      cargarServiciosAsignados(editingWorker.id_usuario);
    } else {
      setForm({ email: '', fullName: '', intervaloCita: 15, activo: true });
      setSchedulesByDay({});
      setNewScheduleDay(null);
      setNewScheduleForm({ dia_semana: '', hora_inicio: '', hora_fin: '' });
    }
  }, [open, editingWorker]);

  useEffect(() => {
    setLocalServices(availableServices);
  }, [availableServices]);

  const cargarServiciosAsignados = async (userId: string) => {
    const { data: serviciosAsignados, error } = await supabase
      .from('servicios_usuarios')
      .select('id_servicio, activo')
      .eq('id_usuario', userId);

    if (error) {
      toast.error('Error al cargar servicios asignados');
      return;
    }

    // Crea un mapa para buscar rápido por ID
    const mapAsignados = new Map(
      serviciosAsignados?.map((s) => [String(s.id_servicio), s.activo])
    );

    // Une availableServices con el estado de asignación y activo
    const merged = availableServices.map((serv) => {
      const id = String(serv.id_servicio);
      const asignadoActivo = mapAsignados.get(id);

      return {
        ...serv,
        activo: asignadoActivo ?? false, // default inactivo si no está asignado
      };
    });

    setLocalServices(merged);
  };

  const cargarHorarios = async (userId: string) => {
    const { data, error } = await supabase
      .from('vista_horario_trabajador')
      .select('*')
      .eq('id_usuario', userId)
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar horarios');
      setSchedulesByDay({});
      return;
    }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'intervaloCita' ? Number(value) : value,
    }));
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
    setNewScheduleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const displayTime = (time: string) => time?.slice(0, 5) || '';

  const toggleServicioActivo = async (id_servicio: string, activo: boolean) => {
    const id_usuario = editingWorker?.id_usuario;
    if (!id_usuario || !empresaId) return;

    // Verificamos si ya existe el registro en servicios_usuarios
    const { data: existing } = await supabase
      .from('servicios_usuarios')
      .select('id_usuario, id_servicio')
      .eq('id_usuario', id_usuario)
      .eq('id_servicio', id_servicio)
      .maybeSingle();

    let updateError;

    if (existing) {
      // Ya existe, solo actualizamos el campo activo
      const { error } = await supabase
        .from('servicios_usuarios')
        .update({ activo })
        .eq('id_usuario', id_usuario)
        .eq('id_servicio', id_servicio);

      updateError = error;
    } else {
      // No existe → insertamos nuevo registro con activo = true
      const { error } = await supabase.from('servicios_usuarios').insert([
        {
          id_usuario,
          id_servicio,
          activo: true,
        },
      ]);
      updateError = error;
    }

    if (updateError) {
      toast.error('Error al actualizar el estado del servicio');
      return;
    }

    // Actualiza localmente el estado visual
    setLocalServices((prev) =>
      prev.map((s) =>
        String(s.id_servicio) === String(id_servicio) ? { ...s, activo } : s
      )
    );

    toast.success(`Servicio ${activo ? 'activado' : 'desactivado'}`);
  };

  // Guardar trabajador con todos los datos
  const handleSubmit = async () => {
    const { email, fullName, intervaloCita } = form;

    if (!email || !fullName) {
      toast.error('Completa todos los campos');
      return;
    }

    let userId: string | null = null;

    // 1. Crear usuario en Supabase Auth
    const { data: signUpData, error: signUpError } =
      await supabase.auth.admin.createUser({
        email,
        user_metadata: { full_name: fullName },
        email_confirm: false,
      });

    if (signUpData?.user?.id) {
      userId = signUpData.user.id;

      // Enviar correo de recuperación de contraseña
      const redirectTo = `${window.location.origin}/set-new-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

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

    // 2. Obtener perfil "trabajador"
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

    // 3. Verificar si ya tiene perfil en la empresa
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
      await supabase.from('usuarios_perfiles').insert([
        {
          id_usuario: userId,
          id_perfil: idPerfil,
          id_empresa: empresaId,
          intervalo_cita: intervaloCita,
          activo: form.activo,
        },
      ]);
    } else {
      await supabase
        .from('usuarios_perfiles')
        .update({ intervalo_cita: intervaloCita, activo: form.activo })
        .eq('id_usuario', userId)
        .eq('id_empresa', empresaId)
        .eq('id_perfil', idPerfil);
    }

    // 4. Insertar horarios
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
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-4xl mx-auto rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingWorker ? 'Editar trabajador' : 'Nuevo trabajador'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-6 mt-4 items-stretch h-full">
          {/* Columna izquierda */}
          <div className="flex flex-col space-y-4 h-full">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <Input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={!!editingWorker}
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Intervalo de cita (min)
              </label>
              <Input
                name="intervaloCita"
                type="number"
                min={5}
                step={5}
                value={form.intervaloCita}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Perfil activo
              </label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.activo}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, activo: checked }))
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    form.activo ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {form.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Servicios asignados
              </label>
              <div className="border rounded-md p-3 bg-gray-50 space-y-2 max-h-56 overflow-y-auto">
                {localServices.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay servicios disponibles.
                  </p>
                ) : (
                  localServices.map((serv) => {
                    const id = String(serv.id_servicio);
                    return (
                      <div
                        key={id}
                        className={`flex justify-between items-center p-2 rounded border ${
                          serv.activo ? 'bg-white' : 'bg-gray-100 opacity-60'
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {serv.servicio}
                        </span>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={serv.activo}
                            onCheckedChange={(checked) =>
                              toggleServicioActivo(id, checked)
                            }
                          />
                          <span
                            className={`text-xs font-medium ${
                              serv.activo ? 'text-green-600' : 'text-red-500'
                            }`}
                          >
                            {serv.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div className="flex flex-col h-full">
            <h3 className="font-semibold text-sm mb-3 text-gray-700">
              Horarios por día
            </h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-[520px] max-h-[400px]">
              {diasSemana.map((dia) => (
                <div
                  key={dia}
                  className="border rounded-md p-3 bg-gray-50 mb-4"
                >
                  <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                    <h4 className="font-semibold text-lg">{dia}</h4>

                    <div className="flex items-center space-x-1 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addScheduleClick(dia)}
                        className="rounded-md border-gray-300 text-sm flex items-center whitespace-nowrap h-8 max-w-[110px] justify-center px-2"
                      >
                        + Añadir
                      </Button>

                      <select
                        onChange={(e) => {
                          const sourceDay = e.target.value;
                          if (
                            sourceDay &&
                            schedulesByDay[sourceDay] &&
                            schedulesByDay[sourceDay].length > 0
                          ) {
                            const copiedSchedules = schedulesByDay[
                              sourceDay
                            ].map((schedule) => ({
                              ...schedule,
                              dia_semana: dia,
                            }));
                            setSchedulesByDay((prev) => ({
                              ...prev,
                              [dia]: copiedSchedules,
                            }));
                            toast.success(
                              `Horarios copiados de ${sourceDay} a ${dia}`
                            );
                          }
                          e.target.value = '';
                        }}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 max-w-[110px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label={`Copiar horarios para ${dia}`}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Copiar de...
                        </option>
                        {diasSemana
                          .filter(
                            (d) =>
                              d !== dia && (schedulesByDay[d]?.length ?? 0) > 0
                          )
                          .map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {(schedulesByDay[dia] || []).map((schedule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center bg-white border rounded-md px-3 py-1 shadow-sm"
                      >
                        <span className="mr-3 font-medium text-gray-700 whitespace-nowrap text-sm min-w-[80px]">
                          <span>
                            {displayTime(schedule.hora_inicio)} -{' '}
                            {displayTime(schedule.hora_fin)}
                          </span>
                        </span>
                        <Input
                          type="time"
                          value={schedule.hora_inicio}
                          onChange={(e) =>
                            handleScheduleChange(
                              dia,
                              idx,
                              'hora_inicio',
                              e.target.value
                            )
                          }
                          className="w-24 mr-2 h-8 text-sm"
                        />

                        <Input
                          type="time"
                          value={schedule.hora_fin}
                          onChange={(e) =>
                            handleScheduleChange(
                              dia,
                              idx,
                              'hora_fin',
                              e.target.value
                            )
                          }
                          className="w-24 mr-2 h-8 text-sm"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSchedule(dia, idx)}
                          aria-label={`Eliminar horario ${schedule.hora_inicio} - ${schedule.hora_fin}`}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    {newScheduleDay === dia && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={newScheduleForm.hora_inicio}
                          onChange={(e) =>
                            handleNewScheduleChange(
                              'hora_inicio',
                              e.target.value
                            )
                          }
                          className="w-24 h-8 text-sm"
                        />
                        <Input
                          type="time"
                          value={newScheduleForm.hora_fin}
                          onChange={(e) =>
                            handleNewScheduleChange('hora_fin', e.target.value)
                          }
                          className="w-24 h-8 text-sm"
                        />
                        <Button size="sm" onClick={saveNewSchedule}>
                          Guardar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelNewSchedule}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex flex-wrap sm:flex-nowrap justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            {editingWorker ? 'Guardar cambios' : 'Invitar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
