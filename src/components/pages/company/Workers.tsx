import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { WorkerDialog } from '@/components/pages/dialogs/WorkerDialog';

const PAGE_SIZE = 15; // o el número que prefieras por página

const Workers = () => {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  // Datos para pasar al diálogo
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    const empresaId = localStorage.getItem('id_empresa');
    const { data, error } = await supabase
      .from('vista_trabajadores_detalles')
      .select('*')
      .eq('id_empresa', empresaId);

    if (error) {
      toast.error('Error al cargar trabajadores');
      setLoading(false);
      return;
    }

    setWorkers(data || []);
    setLoading(false);
  };

  // Abrir diálogo para crear trabajador
  const openCreateModal = async () => {
    const empresaId = localStorage.getItem('id_empresa');
    if (!empresaId) {
      toast.error('ID de empresa no disponible');
      return;
    }
    const { data: servicesData } = await supabase
      .from('vista_servicios_detalle')
      .select('id_servicio, servicio')
      .eq('id_empresa', empresaId)
      .eq('activo', true);

    setAvailableServices(servicesData || []);

    setEditingWorker(null);

    setOpen(true);
  };

  // Abrir diálogo para editar trabajador
  const openEditModal = async (worker: any) => {
    const empresaId = localStorage.getItem('id_empresa');
    if (!empresaId) {
      toast.error('ID de empresa no disponible');
      return;
    }

    const { data: servicesData } = await supabase
      .from('vista_servicios_detalle')
      .select('id_servicio, servicio')
      .eq('id_empresa', empresaId)
      .eq('activo', true);

    setAvailableServices(servicesData || []);

    setEditingWorker(worker);

    setOpen(true);
  };

  // Filtrado y paginación
  const filtered = workers.filter((w) => {
    const q = filter.toLowerCase();
    return (
      (w.nombre_completo?.toLowerCase?.() || '').includes(q) ||
      (w.email?.toLowerCase?.() || '').includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-6 mt-12 sm:mt-0">
        <h1 className="text-2xl font-bold text-gray-800">Trabajadores</h1>
        {workers.length > 0 && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir trabajador
          </Button>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre o email"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <WorkerDialog
        open={open}
        setOpen={setOpen}
        editingWorker={editingWorker}
        onSaved={fetchWorkers}
        availableServices={availableServices}
      />

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">👤</div>
          <p className="text-lg font-semibold mb-2">
            Sin trabajadores registrados
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Aún no has agregado ningún trabajador.
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir trabajador
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold mb-2">Sin coincidencias</p>
          <p className="text-sm text-gray-400">
            No se encontraron trabajadores con ese criterio.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-md shadow border">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Intervalo cita</th>
                  <th className="px-4 py-2 text-left">Confirmado</th>
                  <th className="px-4 py-2 text-left">Activo</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((worker) => (
                  <tr key={worker.id_usuario} className="border-t">
                    <td className="px-4 py-2">{worker.nombre_completo}</td>
                    <td className="px-4 py-2">{worker.email}</td>
                    <td className="px-4 py-2">{worker.intervalo_cita} min</td>
                    <td className="px-4 py-2">
                      {worker.confirmado ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {worker.activo ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => openEditModal(worker)}
                        aria-label="Editar trabajador"
                      >
                        <Pencil className="w-5 h-5" />
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
    </div>
  );
};

export default Workers;
