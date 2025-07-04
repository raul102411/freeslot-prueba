import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pencil, Plus, Trash2, HelpCircle } from 'lucide-react';
import Joyride from 'react-joyride';
import WorkerBlackListTourSteps from '@/components/tour/worker/WorkerBlackListTourSteps';
import NewWorkerBlackListDialog from '@/components/pages/dialogs/NewBlackListDialog';
import { useListaNegraPorEmpresa } from '@/components/hooks/useListaNegra';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PAGE_SIZE = 15;

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const WorkerBlackList = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [telefonoFiltro, setTelefonoFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [runTour, setRunTour] = useState(false);

  const empresaId = localStorage.getItem('id_empresa') || '';
  const usuarioId = localStorage.getItem('id_usuario') || '';

  const { registros, loading, refetch } = useListaNegraPorEmpresa(empresaId);

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
      refetch();
    }
    setConfirmDeleteId(null);
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
            Lista Negra
          </h1>
          <HelpCircle
            className="w-6 h-6 text-blue-500 cursor-pointer"
            onClick={() => setRunTour(true)}
          />
        </div>
        {registros.length > 0 && (
          <Button
            onClick={openNew}
            className="bg-red-600 text-white hover:bg-red-700 tour-new-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir número
          </Button>
        )}
      </motion.div>

      {/* Tour */}
      <motion.div variants={itemVariants}>
        <Joyride
          steps={WorkerBlackListTourSteps}
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
            if (status === 'finished' || status === 'skipped')
              setRunTour(false);
          }}
          styles={{ options: { zIndex: 10000 } }}
        />
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants} className="mb-4 tour-filter">
        <Input
          type="text"
          placeholder="Filtrar por teléfono o email"
          value={telefonoFiltro}
          onChange={(e) => {
            setTelefonoFiltro(e.target.value);
            setPage(1);
          }}
        />
      </motion.div>

      {/* New/Edit Dialog */}
      <motion.div variants={itemVariants}>
        <NewWorkerBlackListDialog
          open={open}
          onClose={() => setOpen(false)}
          initialData={editing}
          onSaved={() => {
            setOpen(false);
            refetch();
          }}
          empresaId={empresaId}
          userId={usuarioId}
        />
      </motion.div>

      {/* Delete Confirmation */}
      <motion.div variants={itemVariants}>
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
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancelar
              </Button>
              <Button className="bg-red-600 text-white" onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Content */}
      {loading ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
        </motion.div>
      ) : registros.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center text-gray-500 py-16"
        >
          <div className="text-5xl mb-4">📵</div>
          <p className="text-lg font-semibold mb-2">
            Sin números en la lista negra
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Aún no se ha agregado ningún número bloqueado.
          </p>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white tour-new-button"
            onClick={openNew}
          >
            <Plus className="w-4 h-4 mr-2" /> Añadir número
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <div className="overflow-x-auto bg-white rounded-md shadow border tour-table">
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
        </motion.div>
      )}
    </motion.div>
  );
};

export default WorkerBlackList;
