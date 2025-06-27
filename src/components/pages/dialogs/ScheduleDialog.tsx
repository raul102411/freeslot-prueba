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
import { Clock, Trash } from 'lucide-react';
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
      data.forEach((h: any) => {
        const diaIndex = diasSemana.indexOf(h.dia_semana);
        if (diaIndex !== -1) {
          inicial[diaIndex].push({ ...h, dia_semana: diaIndex });
        }
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
      const copia = [...(prev[dia] || [])];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return { ...prev, [dia]: copia };
    });
  };

  const agregarHorario = (dia: number) => {
    setHorariosPorDia((prev) => ({
      ...prev,
      [dia]: [
        ...(prev[dia] || []),
        { dia_semana: dia, hora_inicio: '', hora_fin: '' },
      ],
    }));
  };

  const eliminarHorario = (dia: number, idx: number) => {
    setHorariosPorDia((prev) => {
      const copia = [...(prev[dia] || [])];
      copia.splice(idx, 1);
      return { ...prev, [dia]: copia };
    });
  };

  const copiarHorarios = (desde: number, hacia: number) => {
    setHorariosPorDia((prev) => {
      const copia = (prev[desde] || []).map((h) => ({
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

      const nuevos = actuales
        .filter((h) => !h.id_horario_empresa && h.hora_inicio && h.hora_fin)
        .map((h) => ({
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          dia_semana: diasSemana[h.dia_semana],
          id_empresa,
        }));

      if (nuevos.length > 0) {
        const { error } = await supabase.from('horario_empresa').insert(nuevos);
        if (error) throw error;
      }

      const actualizables = actuales.filter((h) => h.id_horario_empresa);
      for (const h of actualizables) {
        const { error } = await supabase
          .from('horario_empresa')
          .update({
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            dia_semana: diasSemana[h.dia_semana],
          })
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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
          title="Ver horario semanal"
        >
          <Clock className="w-4 h-4" /> Horario
        </button>
      </DialogTrigger>

      <DialogContent
        className="
          w-full
          max-w-[480px]
          mx-auto
          rounded-lg
          shadow-lg
          border
          p-4
          sm:p-6
          box-border
          flex
          flex-col
          max-h-[80vh]
          overflow-hidden
        "
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Horarios de la Empresa
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mb-4">
            Edita o crea los horarios laborales por día.
          </DialogDescription>
        </DialogHeader>

        {/* Scroll container para contenido */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {diasSemana.map((dia, index) => (
            <div key={index} className="border rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <h3 className="font-semibold text-gray-800">{dia}</h3>
                <div className="flex items-center space-x-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => agregarHorario(index)}
                    className="rounded-md w-[110px] py-1"
                  >
                    + Añadir
                  </Button>
                  <select
                    onChange={(e) =>
                      copiarHorarios(Number(e.target.value), index)
                    }
                    className="text-sm border border-gray-300 rounded-md px-3 py-1 w-[110px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue=""
                    aria-label={`Copiar horarios para ${dia}`}
                  >
                    <option value="" disabled>
                      Copiar de...
                    </option>
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

              <div className="flex flex-col gap-2">
                {(horariosPorDia[index] || []).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white border rounded-md px-3 py-1 shadow-sm"
                  >
                    <span className="text-gray-700 font-medium text-sm min-w-[90px] whitespace-nowrap">
                      {h.hora_inicio.slice(0, 5)} - {h.hora_fin.slice(0, 5)}
                    </span>
                    <Input
                      type="time"
                      value={h.hora_inicio || ''}
                      onChange={(e) =>
                        actualizarCampo(index, i, 'hora_inicio', e.target.value)
                      }
                      className="w-24 h-8"
                    />
                    <Input
                      type="time"
                      value={h.hora_fin || ''}
                      onChange={(e) =>
                        actualizarCampo(index, i, 'hora_fin', e.target.value)
                      }
                      className="w-24 h-8"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarHorario(index, i)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Eliminar horario ${h.hora_inicio} - ${h.hora_fin}`}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={guardarHorarios}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Guardando...' : 'Guardar horarios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
