import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Plus, HelpCircle } from 'lucide-react';
import Joyride, { Step } from 'react-joyride';
import { supabase } from '@/lib/supabaseClient';
import { EditPhasesServiceDialog } from '@/components/pages/dialogs/EditPhasesServiceDialog';
import { EditServiceDialog } from '@/components/pages/dialogs/EditServiceDialog';
import ServicesTourSteps from '@/components/tour/company/ServicesTourSteps';
import { motion } from 'framer-motion';

type Servicio = {
  id_servicio: string;
  servicio: string;
  descripcion: string | null;
  precio: number | null;
  duracion_minutos: number | null;
  activo: boolean;
};

const PAGE_SIZE = 15;

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Services = () => {
  const [services, setServices] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servicio | null>(null);
  const [editingPhasesFor, setEditingPhasesFor] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [runTour, setRunTour] = useState(false);

  const empresaId = localStorage.getItem('id_empresa') || '';
  const steps: Step[] = ServicesTourSteps;

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vista_servicios_detalle')
      .select('*')
      .eq('id_empresa', empresaId);
    if (!error) setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filtered = services.filter((s) => {
    const q = filter.toLowerCase();
    return (
      s.servicio.toLowerCase().includes(q) ||
      (s.descripcion || '').toLowerCase().includes(q) ||
      (s.precio?.toString() || '').includes(q) ||
      (s.duracion_minutos?.toString() || '').includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreateModal = () => {
    setEditingService(null);
    setOpen(true);
  };
  const openEditModal = (s: Servicio) => {
    setEditingService(s);
    setOpen(true);
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mb-6 mt-12 sm:mt-0"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800 tour-title">
            Servicios
          </h1>
          <HelpCircle
            className="w-6 h-6 text-blue-500 cursor-pointer"
            onClick={() => setRunTour(true)}
          />
        </div>
        {services.length > 0 && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 text-white hover:bg-blue-700 tour-add-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir servicio
          </Button>
        )}
      </motion.div>

      {/* Tour */}
      <motion.div variants={itemVariants}>
        <Joyride
          steps={steps}
          run={runTour}
          continuous
          showSkipButton
          spotlightClicks
          locale={{
            back: 'Atrás',
            close: 'Cerrar',
            last: 'Finalizar',
            next: 'Siguiente',
            skip: 'Saltar',
          }}
          callback={({ status }) => {
            if (status === 'finished' || status === 'skipped') {
              setRunTour(false);
            }
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants} className="mb-4">
        <Input
          type="text"
          placeholder="Buscar por nombre, descripción, precio o duración"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          className="tour-filter-input"
        />
      </motion.div>

      {/* Content */}
      {loading ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
        </motion.div>
      ) : services.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center text-gray-500 py-16"
        >
          <div className="text-5xl mb-4">🛠️</div>
          <p className="text-lg font-semibold mb-2">
            Sin servicios registrados
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Aún no has agregado ningún servicio.
          </p>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white tour-add-btn"
            onClick={openCreateModal}
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir servicio
          </Button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center text-gray-500 py-16"
        >
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold mb-2">Sin coincidencias</p>
          <p className="text-sm text-gray-400">
            No se encontraron servicios con ese criterio.
          </p>
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={itemVariants}
            className="overflow-x-auto bg-white rounded-md shadow border tour-table"
          >
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
                  <motion.tr
                    key={s.id_servicio}
                    variants={itemVariants}
                    className="border-t"
                  >
                    <td className="px-4 py-2">{s.servicio}</td>
                    <td className="px-4 py-2">{s.descripcion || '-'}</td>
                    <td className="px-4 py-2">
                      {s.precio != null ? `${s.precio.toFixed(2)} €` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {s.duracion_minutos != null ? s.duracion_minutos : '-'}
                    </td>
                    <td className="px-4 py-2">
                      {s.activo ? (
                        <span className="text-green-600 font-medium">Sí</span>
                      ) : (
                        <span className="text-red-600 font-medium">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 p-1 tour-edit-btn"
                        onClick={() => openEditModal(s)}
                        aria-label="Editar servicio"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {totalPages > 1 && (
            <motion.div
              variants={itemVariants}
              className="flex justify-end items-center mt-4 gap-2 text-sm tour-pagination"
            >
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
            </motion.div>
          )}
        </>
      )}

      {/* Dialogs */}
      <motion.div variants={itemVariants} className="tour-dialog">
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

        {editingPhasesFor && (
          <EditPhasesServiceDialog
            serviceId={editingPhasesFor}
            open={!!editingPhasesFor}
            onClose={() => setEditingPhasesFor(null)}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default Services;
