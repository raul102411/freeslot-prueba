import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: {
    id_lista_negra: string;
    telefono?: string;
    email?: string;
    motivo?: string;
    activo: boolean;
  };
  empresaId: string;
  userId: string;
}

const isValidPhone = (phone: string) => {
  const cleaned = phone.replace(/\s+/g, '');
  return /^\+?[1-9]\d{6,14}$/.test(cleaned) || /^[679]\d{8}$/.test(cleaned);
};

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizePhone = (value: string): string => {
  let cleaned = value.trim();
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  cleaned = cleaned.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\+/g, '');
  }
  return cleaned;
};

export default function NewBlackListDialog({
  open,
  onClose,
  onSaved,
  initialData,
  empresaId,
  userId,
}: Props) {
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [motivo, setMotivo] = useState('');
  const [activo, setActivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTelefono(initialData.telefono || '');
      setEmail(initialData.email || '');
      setMotivo(initialData.motivo || '');
      setActivo(initialData.activo);
    } else {
      setTelefono('');
      setEmail('');
      setMotivo('');
      setActivo(true);
    }
  }, [initialData, open]);

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const tel = normalizePhone(telefono);
      const mail = email.trim();

      if (!empresaId || !userId) {
        toast.error('Faltan datos de sesión');
        return;
      }

      if (!tel && !mail) {
        toast.error('Debe ingresar al menos un teléfono o un email');
        return;
      }

      if (mail && !isValidEmail(mail)) {
        toast.error('Email inválido');
        return;
      }

      if (tel && !isValidPhone(tel)) {
        toast.error('Teléfono inválido');
        return;
      }

      const payload = {
        telefono: tel || null,
        email: mail || null,
        motivo,
        activo,
        id_empresa: empresaId,
      };

      const supabase = (await import('@/lib/supabaseClient')).supabase;

      if (initialData?.id_lista_negra) {
        const { error } = await supabase
          .from('lista_negra')
          .update({
            ...payload,
            usuario_edicion: userId,
            fecha_edicion: new Date().toISOString(),
          })
          .eq('id_lista_negra', initialData.id_lista_negra);

        if (error) {
          toast.error('Error al actualizar el registro');
          return;
        }

        toast.success('Registro actualizado');
      } else {
        const { data: exists } = await supabase
          .from('lista_negra')
          .select('id_lista_negra')
          .eq('id_empresa', empresaId)
          .or(`telefono.eq.${tel},email.eq.${mail}`);

        if (exists && exists.length > 0) {
          toast.error('Ya existe un registro con ese teléfono o email.');
          return;
        }

        const { error } = await supabase.from('lista_negra').insert([
          {
            ...payload,
            usuario_creacion: userId,
          },
        ]);

        if (error) {
          toast.error('Error al crear el registro');
          return;
        }

        toast.success('Registro creado');
      }

      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] sm:max-w-md mx-auto rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar registro' : 'Nuevo registro'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Teléfono
            </label>
            <Input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Motivo (opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border px-3 py-2 rounded text-sm"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Registro activo
            </label>
            <div className="flex items-center gap-3">
              <Switch
                checked={activo}
                onCheckedChange={(checked) => setActivo(checked)}
              />
              <span
                className={`text-sm font-medium ${
                  activo ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={submitting}
          >
            {initialData ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
