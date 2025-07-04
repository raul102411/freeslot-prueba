import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  tipo: string;
  descripcion: string;
  onOpenChange: (open: boolean) => void;
  onTipoChange: (value: string) => void;
  onDescripcionChange: (value: string) => void;
  onSave: () => void;
}

export const CreatePromotionTypeDialog: FC<Props> = ({
  open,
  tipo,
  descripcion,
  onOpenChange,
  onTipoChange,
  onDescripcionChange,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo tipo de promoción</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Nombre del tipo"
            value={tipo}
            onChange={(e) => onTipoChange(e.target.value)}
          />
          <Input
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => onDescripcionChange(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={onSave} className="bg-blue-600 text-white">
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
