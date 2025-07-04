import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { Switch } from '@/components/ui/switch';

type Phase = {
  id_fase?: string;
  nombre_fase: string;
  duracion_minutos: number;
  requiere_atencion: boolean;
  orden: number;
};

type Props = {
  serviceId: string;
  open: boolean;
  onClose: () => void;
};

export const EditPhasesServiceDialog = ({
  serviceId,
  open,
  onClose,
}: Props) => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchPhases = async () => {
      const { data, error } = await supabase
        .from('fases_servicio')
        .select('*')
        .eq('id_servicio', serviceId)
        .order('orden', { ascending: true });

      if (!error) setPhases(data || []);
    };

    fetchPhases();
  }, [open, serviceId]);

  const handleChange = (index: number, field: keyof Phase, value: any) => {
    setPhases((prev) =>
      prev.map((phase, i) =>
        i === index ? { ...phase, [field]: value } : phase
      )
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await supabase.from('fases_servicio').delete().eq('id_servicio', serviceId);

    const newPhases = phases.map((p, i) => ({
      id_fase: p.id_fase || uuidv4(),
      id_servicio: serviceId,
      nombre_fase: p.nombre_fase,
      duracion_minutos: p.duracion_minutos,
      requiere_atencion: p.requiere_atencion,
      orden: i + 1,
    }));

    const { error } = await supabase.from('fases_servicio').insert(newPhases);

    if (error) {
      toast.error('Error al guardar las fases.');
    } else {
      toast.success('Fases actualizadas correctamente.');
      onClose();
    }
    setLoading(false);
  };

  const addPhase = () => {
    setPhases((prev) => [
      ...prev,
      {
        nombre_fase: '',
        duracion_minutos: 0,
        requiere_atencion: true,
        orden: prev.length + 1,
      },
    ]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-2xl mx-auto rounded-2xl px-4 sm:px-6 py-6 overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl font-semibold">
            Editar fases del servicio
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {phases.map((phase, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-3 bg-gray-50"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la fase
                </label>
                <Input
                  value={phase.nombre_fase}
                  onChange={(e) =>
                    handleChange(index, 'nombre_fase', e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duración (minutos)
                </label>
                <Input
                  type="number"
                  value={phase.duracion_minutos}
                  onChange={(e) =>
                    handleChange(
                      index,
                      'duracion_minutos',
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Requiere atención
                </label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={phase.requiere_atencion}
                    onCheckedChange={(checked) =>
                      handleChange(index, 'requiere_atencion', checked)
                    }
                  />
                  <span
                    className={`text-sm font-medium ${
                      phase.requiere_atencion
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {phase.requiere_atencion ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={addPhase}
              className="w-full"
            >
              + Añadir fase
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              Guardar fases
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
