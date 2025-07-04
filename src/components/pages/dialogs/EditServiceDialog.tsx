import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Switch } from '@/components/ui/switch';

type Servicio = {
  id_servicio: string;
  servicio: string;
  descripcion: string | null;
  precio: number | null;
  duracion_minutos: number | null;
  activo: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editingService: Servicio | null;
  empresaId: string;
  onSaved: () => void;
  onEditPhases: (serviceId: string) => void;
};

export const EditServiceDialog = ({
  open,
  onClose,
  editingService,
  empresaId,
  onSaved,
  onEditPhases,
}: Props) => {
  const [form, setForm] = useState({
    servicio: '',
    descripcion: '',
    precio: '',
    duracion_minutos: '',
    activo: true,
  });

  useEffect(() => {
    if (open) {
      if (editingService) {
        setForm({
          servicio: editingService.servicio,
          descripcion: editingService.descripcion || '',
          precio: editingService.precio?.toString() || '',
          duracion_minutos: editingService.duracion_minutos?.toString() || '',
          activo: editingService.activo,
        });
      } else {
        setForm({
          servicio: '',
          descripcion: '',
          precio: '',
          duracion_minutos: '',
          activo: true,
        });
      }
    }
  }, [editingService, open]);

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const { servicio, descripcion, precio, duracion_minutos, activo } = form;

    if (!servicio || !precio || !duracion_minutos) {
      toast.error('Completa todos los campos obligatorios.');
      return;
    }

    const payload = {
      servicio,
      descripcion,
      precio: parseFloat(precio),
      duracion_minutos: parseInt(duracion_minutos),
      activo,
    };

    const op = editingService
      ? supabase
          .from('servicios')
          .update(payload)
          .eq('id_servicio', editingService.id_servicio)
      : supabase
          .from('servicios')
          .insert([{ ...payload, id_empresa: empresaId }]);

    const { error } = await op;

    if (error) {
      toast.error(editingService ? 'Error al editar.' : 'Error al crear.');
    } else {
      toast.success(
        editingService
          ? 'Servicio actualizado correctamente.'
          : 'Servicio creado correctamente.'
      );
      onSaved();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-md mx-auto rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle>
            {editingService ? 'Editar servicio' : 'Nuevo servicio'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del servicio
            </label>
            <Input
              name="servicio"
              value={form.servicio}
              onChange={handleInput}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded text-sm"
              rows={3}
            />
          </div>
          <div className="flex gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700">
                Precio
              </label>
              <Input
                name="precio"
                type="number"
                value={form.precio}
                onChange={handleInput}
              />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700">
                Duración (min)
              </label>
              <Input
                name="duracion_minutos"
                type="number"
                value={form.duracion_minutos}
                onChange={handleInput}
              />
            </div>
          </div>

          {editingService && (
            <Button
              variant="outline"
              onClick={() => onEditPhases(editingService.id_servicio)}
            >
              🧩 Editar fases del servicio
            </Button>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Servicio activo
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

          <Button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            {editingService ? 'Guardar cambios' : 'Crear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
