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
import NewBlackListDialog from '@/components/pages/dialogs/NewBlackListDialog';

const PAGE_SIZE = 15;

const Blacklist = () => {
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [telefonoFiltro, setTelefonoFiltro] = useState('');
  const [page, setPage] = useState(1);

  const empresaId = localStorage.getItem('id_empresa') || '';
  const userId = localStorage.getItem('id_usuario') || '';

  const registrosFiltrados = registros.filter(
    (r) =>
      r.telefono
        ?.replace(/\s/g, '')
        .includes(telefonoFiltro.replace(/\s/g, '')) ||
      r.email?.toLowerCase().includes(telefonoFiltro.toLowerCase())
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
    setOpen(true);
  };

  const openEdit = (registro: any) => {
    setEditing(registro);
    setOpen(true);
  };

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

  return (
    <>
      <div className="flex justify-between items-center mb-6 mt-12 sm:mt-0">
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
          placeholder="Filtrar por teléfono o email"
          value={telefonoFiltro}
          onChange={(e) => {
            setTelefonoFiltro(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <NewBlackListDialog
        open={open}
        onClose={() => setOpen(false)}
        initialData={editing}
        onSaved={() => {
          setOpen(false);
          fetchData();
        }}
        empresaId={empresaId}
        userId={userId}
      />

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
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
        </div>
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
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-md shadow border">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left w-32">Teléfono</th>
                  <th className="px-4 py-2 text-left w-48">Email</th>
                  <th className="px-4 py-2 text-left">Motivo</th>
                  <th className="px-4 py-2 text-left w-40">Fecha</th>
                  <th className="px-4 py-2 text-left w-20">Activo</th>
                  <th className="px-4 py-2 text-left w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((r) => (
                  <tr key={r.id_lista_negra} className="border-t">
                    <td className="px-4 py-2">{r.telefono || '-'}</td>
                    <td className="px-4 py-2">{r.email || '-'}</td>
                    <td className="px-4 py-2">{r.motivo || '-'}</td>
                    <td className="px-4 py-2">
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
                      <button onClick={() => openEdit(r)} title="Editar">
                        <Pencil className="w-5 h-5 text-blue-600 hover:text-blue-800" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(r.id_lista_negra)}
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5 text-red-600 hover:text-red-800" />
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
