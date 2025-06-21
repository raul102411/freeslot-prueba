import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, X } from 'lucide-react';
import { diasSemana } from '@/lib/constants';
import { toast } from 'sonner';

type Schedule = {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

type WorkerDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  editingWorker: any;
  form: {
    email: string;
    fullName: string;
    intervaloCita: number;
  };
  setForm: (form: any) => void;
  availableServices: any[];
  assignedServiceIds: string[];
  setAssignedServiceIds: (ids: string[]) => void;
  schedulesByDay: Record<string, Schedule[]>;
  setSchedulesByDay: (s: Record<string, Schedule[]>) => void;
  newScheduleDay: string | null;
  setNewScheduleDay: (d: string | null) => void;
  newScheduleForm: Schedule;
  setNewScheduleForm: (s: Schedule) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => Promise<void>;
  handleScheduleChange: (
    dia: string,
    idx: number,
    field: keyof Schedule,
    value: string
  ) => void;
  addScheduleClick: (dia: string) => void;
  handleNewScheduleChange: (field: keyof Schedule, value: string) => void;
  saveNewSchedule: () => void;
  cancelNewSchedule: () => void;
  removeSchedule: (dia: string, idx: number) => void;
};

export const WorkerDialog = ({
  open,
  setOpen,
  editingWorker,
  form,
  availableServices,
  assignedServiceIds,
  setAssignedServiceIds,
  schedulesByDay,
  setSchedulesByDay,
  newScheduleDay,
  newScheduleForm,
  handleChange,
  handleSubmit,
  handleScheduleChange,
  addScheduleClick,
  handleNewScheduleChange,
  saveNewSchedule,
  cancelNewSchedule,
  removeSchedule,
}: WorkerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {editingWorker ? 'Editar trabajador' : 'Nuevo trabajador'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Columna izquierda */}
          <div className="space-y-4">
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
              <label className="text-sm font-medium text-gray-700">
                Servicios asignados
              </label>
              <div className="border rounded-md p-3 bg-gray-50 space-y-2 max-h-56 overflow-y-auto">
                {availableServices.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay servicios disponibles.
                  </p>
                ) : (
                  availableServices.map((serv) => {
                    const id = String(serv.id_servicio);
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={assignedServiceIds.includes(id)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updated = checked
                              ? assignedServiceIds.includes(id)
                                ? assignedServiceIds
                                : [...assignedServiceIds, id]
                              : assignedServiceIds.filter((i) => i !== id);
                            setAssignedServiceIds(updated);
                          }}
                        />
                        {serv.servicio}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-700">
              Horarios por día
            </h3>
            <div className="grid grid-cols-1 gap-4 max-h-[460px] overflow-y-auto pr-1">
              {diasSemana.map((dia) => (
                <div key={dia} className="border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <strong className="text-sm">{dia}</strong>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addScheduleClick(dia)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Añadir
                      </Button>
                      <select
                        onChange={(e) => {
                          const sourceDay = e.target.value;
                          if (
                            sourceDay &&
                            schedulesByDay[sourceDay] &&
                            schedulesByDay[sourceDay].length > 0
                          ) {
                            // Copiar y actualizar dia_semana para evitar conflicto
                            const copiedSchedules = schedulesByDay[
                              sourceDay
                            ].map((schedule) => ({
                              ...schedule,
                              dia_semana: dia,
                            }));

                            const newSchedules = {
                              ...schedulesByDay,
                              [dia]: copiedSchedules,
                            };
                            setSchedulesByDay(newSchedules);

                            toast.success(
                              `Horarios copiados de ${sourceDay} a ${dia}`
                            );
                          }
                        }}
                        value=""
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="">Copiar de...</option>
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

                  {(schedulesByDay[dia] || []).map((schedule, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-2">
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
                        className="w-1/2"
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
                        className="w-1/2"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSchedule(dia, idx)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}

                  {newScheduleDay === dia && (
                    <div className="flex gap-2 items-center mt-2">
                      <Input
                        type="time"
                        value={newScheduleForm.hora_inicio}
                        onChange={(e) =>
                          handleNewScheduleChange('hora_inicio', e.target.value)
                        }
                      />
                      <Input
                        type="time"
                        value={newScheduleForm.hora_fin}
                        onChange={(e) =>
                          handleNewScheduleChange('hora_fin', e.target.value)
                        }
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
              ))}
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {editingWorker ? 'Guardar cambios' : 'Invitar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
