// components/ScheduleDialog.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Trash, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

const diasSemana = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

interface Schedule {
  id_horario_empresa?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

interface ScheduleDialogProps {
  id_empresa: string;
}

const ScheduleDialog = ({ id_empresa }: ScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [horariosPorDia, setHorariosPorDia] = useState<
    Record<number, Schedule[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [horariosOriginales, setHorariosOriginales] = useState<Schedule[]>([]);

  const cargarHorarios = async () => {
    const { data, error } = await supabase
      .from('vista_horario_empresa')
      .select('*')
      .eq('id_empresa', id_empresa);

    if (error) {
      toast.error('Error al cargar los horarios');
      return;
    }

    const inicial: Record<number, Schedule[]> = {};
    diasSemana.forEach((_, index) => {
      inicial[index] = [];
    });

    if (!data || data.length === 0) {
      setHorariosPorDia(inicial);
    } else {
      data.forEach((h: Schedule) => {
        inicial[h.dia_semana].push(h);
      });
      setHorariosPorDia(inicial);
      setHorariosOriginales(data);
    }
  };

  const actualizarCampo = (
    dia: number,
    idx: number,
    campo: 'hora_inicio' | 'hora_fin',
    valor: string
  ) => {
    setHorariosPorDia((prev) => {
      const copia = [...prev[dia]];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return { ...prev, [dia]: copia };
    });
  };

  const agregarHorario = (dia: number) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [dia]: [...prev[dia], { dia_semana: dia, hora_inicio: '', hora_fin: '' }],
    }));
  };

  const eliminarHorario = (dia: number, idx: number) => {
    setHorariosPorDia((prev) => {
      const copia = [...prev[dia]];
      copia.splice(idx, 1);
      return { ...prev, [dia]: copia };
    });
  };

  const copiarHorarios = (desde: number, hacia: number) => {
    setHorariosPorDia((prev) => {
      const copia = prev[desde].map((h) => ({
        dia_semana: hacia,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
      }));
      return { ...prev, [hacia]: copia };
    });
  };

  const guardarHorarios = async () => {
    setLoading(true);
    try {
      const actuales = Object.values(horariosPorDia).flat();
      const actualesIds = actuales
        .map((h) => h.id_horario_empresa)
        .filter(Boolean);
      const originalesIds = horariosOriginales.map((h) => h.id_horario_empresa);

      // Borrar eliminados
      const eliminados = originalesIds.filter(
        (id) => !actualesIds.includes(id)
      );
      if (eliminados.length > 0) {
        const { error } = await supabase
          .from('horario_empresa')
          .delete()
          .in('id_horario_empresa', eliminados);
        if (error) throw error;
      }

      // Insertar nuevos
      const nuevos = actuales.filter(
        (h) => !h.id_horario_empresa && h.hora_inicio && h.hora_fin
      );
      if (nuevos.length > 0) {
        const { error } = await supabase
          .from('horario_empresa')
          .insert(nuevos.map((h) => ({ ...h, id_empresa })));
        if (error) throw error;
      }

      // Actualizar existentes
      const actualizables = actuales.filter((h) => h.id_horario_empresa);
      for (const h of actualizables) {
        const { error } = await supabase
          .from('horario_empresa')
          .update({ hora_inicio: h.hora_inicio, hora_fin: h.hora_fin })
          .eq('id_horario_empresa', h.id_horario_empresa);
        if (error) throw error;
      }

      toast.success('Horarios actualizados.');
      setOpen(false);
    } catch (error) {
      toast.error('Error al guardar horarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) cargarHorarios();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
          title="Ver horario semanal"
        >
          <Clock className="w-4 h-4" /> Horario
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl shadow-xl border p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Horarios de la Empresa
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Edita o crea los horarios laborales por día.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {diasSemana.map((dia, index) => (
            <div
              key={index}
              className="space-y-3 border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{dia}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => agregarHorario(index)}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </Button>
                  <select
                    onChange={(e) =>
                      copiarHorarios(Number(e.target.value), index)
                    }
                    className="text-sm border rounded-md px-2 py-1"
                  >
                    <option value="">Copiar de...</option>
                    {diasSemana.map((d, i) =>
                      i !== index ? (
                        <option key={i} value={i}>
                          {d}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>
              </div>
              {(horariosPorDia[index] || []).map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={h.hora_inicio || ''}
                    onChange={(e) =>
                      actualizarCampo(index, i, 'hora_inicio', e.target.value)
                    }
                    className="w-32"
                  />
                  <Input
                    type="time"
                    value={h.hora_fin || ''}
                    onChange={(e) =>
                      actualizarCampo(index, i, 'hora_fin', e.target.value)
                    }
                    className="w-32"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminarHorario(index, i)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={guardarHorarios}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Guardando...' : 'Guardar horarios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
