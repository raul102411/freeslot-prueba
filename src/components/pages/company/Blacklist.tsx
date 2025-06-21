import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

type RegistroListaNegra = {
  id_lista_negra: string;
  telefono: string;
  motivo?: string;
  activo: boolean;
  fecha_creacion: string;
};

const PAGE_SIZE = 15;

const Blacklist = () => {
  const [registros, setRegistros] = useState<RegistroListaNegra[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RegistroListaNegra | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ telefono: '', motivo: '', activo: true });
  const [telefonoFiltro, setTelefonoFiltro] = useState('');

  const empresaId = localStorage.getItem('id_empresa') || '';
  const userId = localStorage.getItem('id_usuario') || '';
  const [page, setPage] = useState(1);

  const registrosFiltrados = registros.filter((r) =>
    r.telefono.replace(/\s/g, '').includes(telefonoFiltro.replace(/\s/g, ''))
  );

  const totalPages = Math.ceil(registrosFiltrados.length / PAGE_SIZE);
  const currentData = registrosFiltrados.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vista_lista_negra')
      .select('*')
      .eq('id_empresa', empresaId)
      .order('fecha_creacion', { ascending: false });

    if (error) toast.error('Error al cargar la lista negra');
    else setRegistros(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ telefono: '', motivo: '', activo: true });
    setOpen(true);
  };

  const openEdit = (registro: RegistroListaNegra) => {
    setEditing(registro);
    setForm({
      telefono: registro.telefono,
      motivo: registro.motivo || '',
      activo: registro.activo,
    });
    setOpen(true);
  };

  const isValidPhone = (phone: string) =>
    /^[679]\d{8}$/.test(phone.replace(/\s/g, ''));

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const { error } = await supabase
      .from('lista_negra')
      .delete()
      .eq('id_lista_negra', confirmDeleteId);

    if (error) toast.error('Error al eliminar el registro');
    else {
      toast.success('Registro eliminado');
      fetchData();
    }
    setConfirmDeleteId(null);
  };

  const handleSubmit = async () => {
    const cleanPhone = form.telefono.replace(/\D/g, '').slice(0, 9);

    if (!isValidPhone(cleanPhone)) {
      toast.error('El teléfono debe tener 9 dígitos y comenzar con 6, 7 o 9.');
      return;
    }

    const formattedPhone = cleanPhone.replace(
      /(\d{3})(\d{3})(\d{3})/,
      '$1 $2 $3'
    );

    if (!empresaId || !userId) {
      toast.error('Error: sesión no válida.');
      return;
    }

    if (!editing) {
      const { data: existing } = await supabase
        .from('lista_negra')
        .select('id_lista_negra')
        .eq('telefono', formattedPhone)
        .eq('id_empresa', empresaId);

      if (existing && existing.length > 0) {
        toast.error('Este número ya está registrado.');
        return;
      }
    }

    if (editing) {
      const { error } = await supabase
        .from('lista_negra')
        .update({
          telefono: formattedPhone,
          motivo: form.motivo,
          activo: form.activo,
          usuario_edicion: userId,
          fecha_edicion: new Date().toISOString(),
        })
        .eq('id_lista_negra', editing.id_lista_negra);

      if (error) {
        toast.error('Error al actualizar el registro');
        return;
      }

      toast.success('Registro actualizado');
    } else {
      const { error } = await supabase.from('lista_negra').insert([
        {
          telefono: formattedPhone,
          motivo: form.motivo,
          activo: form.activo,
          id_empresa: empresaId,
          usuario_creacion: userId,
        },
      ]);

      if (error) {
        toast.error('Error al crear registro');
        return;
      }

      toast.success('Registro creado');
    }

    setOpen(false);
    fetchData();
  };

  const handlePhoneChange = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 9);
    const formatted = raw.replace(/(\d{3})(\d{3})(\d{0,3})/, (_, a, b, c) =>
      c ? `${a} ${b} ${c}` : b ? `${a} ${b}` : a
    );
    setForm({ ...form, telefono: formatted });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-6 mt-12 sm:mt-0">
        <h1 className="text-2xl font-bold text-gray-800">Lista Negra</h1>
        {registros.length > 0 && (
          <Button
            onClick={openNew}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir número
          </Button>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrar por teléfono"
          value={telefonoFiltro}
          onChange={(e) => {
            setTelefonoFiltro(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar registro' : 'Nuevo registro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <Input
                type="text"
                placeholder="000 000 000"
                value={form.telefono}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Motivo (opcional)
              </label>
              <textarea
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                className="w-full border px-3 py-2 rounded text-sm"
                rows={3}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Activo
            </label>
            <Button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {editing ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={() => setConfirmDeleteId(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar número?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 text-sm">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancelar
            </Button>
            <Button className="bg-red-600 text-white" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : registros.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">📵</div>
          <p className="text-lg font-semibold mb-2">
            Sin números en la lista negra
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Aún no se ha agregado ningún número bloqueado.
          </p>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={openNew}
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir número
          </Button>
        </div>
      ) : registrosFiltrados.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold mb-2">Sin coincidencias</p>
          <p className="text-sm text-gray-400">
            No se encontraron números que coincidan con el filtro ingresado.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-md shadow border">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left w-32">Teléfono</th>
                  <th className="px-4 py-2 text-left w-full">Motivo</th>
                  <th className="px-4 py-2 text-left w-40">Fecha</th>
                  <th className="px-4 py-2 text-left w-20">Activo</th>
                  <th className="px-4 py-2 text-left w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((r) => (
                  <tr key={r.id_lista_negra} className="border-t">
                    <td className="px-4 py-2 whitespace-nowrap">
                      {r.telefono}
                    </td>
                    <td className="px-4 py-2 break-words">{r.motivo || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Intl.DateTimeFormat('es-ES', {
                        dateStyle: 'medium',
                      }).format(new Date(r.fecha_creacion))}
                    </td>
                    <td className="px-4 py-2">
                      {r.activo ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => openEdit(r)}
                        aria-label="Editar número"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() => setConfirmDeleteId(r.id_lista_negra)}
                        aria-label="Eliminar número"
                      >
                        <Trash2 className="w-5 h-5" />
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
    </>
  );
};

export default Blacklist;
