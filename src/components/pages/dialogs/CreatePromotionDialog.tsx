import { FC, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TipoPromocion {
  id_tipo_promocion: string;
  tipo: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiposPromocion: TipoPromocion[];
  onSubmit: (promocion: {
    id_tipo_promocion: string;
    titulo: string;
    descripcion: string;
    regla_promocion: string;
  }) => void;
}

export const CreatePromotionDialog: FC<Props> = ({
  open,
  onOpenChange,
  tiposPromocion,
  onSubmit,
}) => {
  const [idTipo, setIdTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [regla, setRegla] = useState('');

  useEffect(() => {
    if (!open) {
      setIdTipo('');
      setTitulo('');
      setDescripcion('');
      setRegla('');
    }
  }, [open]);

  const isFormValid = idTipo && titulo && regla;

  const handleSubmit = () => {
    if (!isFormValid) return;

    onSubmit({
      id_tipo_promocion: idTipo,
      titulo,
      descripcion,
      regla_promocion: regla,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nueva promoción</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de promoción
            </label>
            <select
              value={idTipo}
              onChange={(e) => setIdTipo(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Selecciona un tipo</option>
              {tiposPromocion?.map((tp) => (
                <option key={tp.id_tipo_promocion} value={tp.id_tipo_promocion}>
                  {tp.tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <Input
              placeholder="Ej: Martes locos, 2x1 en servicios"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              placeholder="Ej: Válido solo los martes de julio"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border rounded px-3 py-2 min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regla de la promoción
            </label>
            <Input
              placeholder="Ej: 20% descuento, 2x1, regalo extra..."
              value={regla}
              onChange={(e) => setRegla(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="bg-blue-600 text-white disabled:opacity-50"
            >
              Guardar promoción
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
