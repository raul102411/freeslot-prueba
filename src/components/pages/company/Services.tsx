import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { EditPhasesServiceDialog } from '@/components/pages/dialogs/EditPhasesServiceDialog';
import { EditServiceDialog } from '@/components/pages/dialogs/EditServiceDialog';

type Servicio = {
  id_servicio: string;
  servicio: string;
  descripcion: string | null;
  precio: number | null;
  duracion_minutos: number | null;
  activo: boolean;
};

const PAGE_SIZE = 15;

const Services = () => {
  const [services, setServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servicio | null>(null);
  const [editingPhasesFor, setEditingPhasesFor] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const empresaId = localStorage.getItem('id_empresa') || '';

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vista_servicios_detalle')
      .select('*')
      .eq('id_empresa', empresaId);

    if (!error) setServices(data || []);
    setLoading(false);
  };

  const openCreateModal = () => {
    setEditingService(null);
    setOpen(true);
  };

  const openEditModal = (service: Servicio) => {
    setEditingService(service);
    setOpen(true);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filtered = services.filter((s) => {
    const query = filter.toLowerCase();
    return (
      s.servicio.toLowerCase().includes(query) ||
      (s.descripcion || '').toLowerCase().includes(query) ||
      (s.precio?.toString() || '').includes(query) ||
      (s.duracion_minutos?.toString() || '').includes(query)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-6 mt-12 sm:mt-0">
        <h1 className="text-2xl font-bold text-gray-800">Servicios</h1>
        {services.length > 0 && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir servicio
          </Button>
        )}
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre, descripción, precio o duración"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : services.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🛠️</div>
          <p className="text-lg font-semibold mb-2">
            Sin servicios registrados
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Aún no has agregado ningún servicio.
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir servicio
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold mb-2">Sin coincidencias</p>
          <p className="text-sm text-gray-400">
            No se encontraron servicios con ese criterio.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-md shadow border">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Servicio</th>
                  <th className="px-4 py-2 text-left">Descripción</th>
                  <th className="px-4 py-2 text-left">Precio</th>
                  <th className="px-4 py-2 text-left">Duración</th>
                  <th className="px-4 py-2 text-left">Activo</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((s) => (
                  <tr key={s.id_servicio} className="border-t">
                    <td className="px-4 py-2">{s.servicio}</td>
                    <td className="px-4 py-2">{s.descripcion || '-'}</td>
                    <td className="px-4 py-2">
                      {s.precio != null ? `${s.precio.toFixed(2)} €` : '-'}
                    </td>
                    <td className="px-4 py-2">{s.duracion_minutos || '-'}</td>
                    <td className="px-4 py-2">
                      {s.activo ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => openEditModal(s)}
                        aria-label="Editar servicio"
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

      {/* Diálogo para crear/editar servicio */}
      <EditServiceDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingService(null);
        }}
        editingService={editingService}
        empresaId={empresaId}
        onSaved={fetchServices}
        onEditPhases={(id) => setEditingPhasesFor(id)}
      />

      {/* Diálogo para fases */}
      {editingPhasesFor && (
        <EditPhasesServiceDialog
          serviceId={editingPhasesFor}
          open={!!editingPhasesFor}
          onClose={() => setEditingPhasesFor(null)}
        />
      )}
    </div>
  );
};

export default Services;
