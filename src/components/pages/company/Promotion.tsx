import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, HelpCircle } from 'lucide-react';
import Joyride from 'react-joyride';
import { usePromociones } from '@/components/hooks/usePromociones';
import { CreatePromotionTypeDialog } from '@/components/pages/dialogs/CreatePromotionTypeDialog';
import { CreatePromotionDialog } from '@/components/pages/dialogs/CreatePromotionDialog';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Promotion = () => {
  const empresaId = localStorage.getItem('id_empresa');
  const [openDialog, setOpenDialog] = useState(false);
  const [openPromoDialog, setOpenPromoDialog] = useState(false);
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [runTour, setRunTour] = useState(false);

  const { tiposPromocion, promociones, crearTipoPromocion, crearPromocion } =
    usePromociones(empresaId);

  const handleCrearTipo = async () => {
    if (!tipo.trim()) return;
    await crearTipoPromocion(tipo, descripcion);
    setTipo('');
    setDescripcion('');
    setOpenDialog(false);
  };

  return (
    <motion.div
      className="space-y-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* HEADER PRINCIPAL */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-800">Promociones</h1>
          <HelpCircle
            className="w-6 h-6 text-blue-500 cursor-pointer"
            onClick={() => setRunTour(true)}
          />
        </div>
      </motion.div>

      {/* JOYRIDE */}
      <motion.div variants={itemVariants}>
        <Joyride
          steps={[]}
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

      {/* SECCIÓN TIPOS DE PROMOCIÓN */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            Tipos de promoción
          </h2>
          <Button
            onClick={() => setOpenDialog(true)}
            className="bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo tipo
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {tiposPromocion?.length ? (
            tiposPromocion.map((tp) => (
              <motion.div
                key={tp.id_tipo_promocion}
                variants={itemVariants}
                className="p-4 border rounded-xl bg-white shadow-sm"
              >
                <h3 className="text-md font-semibold text-gray-800">
                  {tp.tipo}
                </h3>
                <p className="text-sm text-gray-600">{tp.descripcion}</p>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No hay tipos de promoción creados.
            </p>
          )}
        </div>
      </motion.section>

      {/* SECCIÓN PROMOCIONES */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            Promociones activas
          </h2>
          <Button
            onClick={() => setOpenPromoDialog(true)}
            className="bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Nueva promoción
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {promociones?.length ? (
            promociones.map((promo) => (
              <motion.div
                key={promo.id_promocion}
                variants={itemVariants}
                className="p-4 border rounded-xl bg-white shadow-sm"
              >
                <h3 className="text-md font-semibold text-gray-800">
                  {promo.titulo}
                </h3>
                <p className="text-sm text-gray-600">{promo.descripcion}</p>
                <p className="text-sm mt-1 text-blue-600 font-medium">
                  {promo.regla_promocion}
                </p>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No hay promociones registradas.
            </p>
          )}
        </div>
      </motion.section>

      {/* DIÁLOGOS */}
      <CreatePromotionTypeDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        tipo={tipo}
        descripcion={descripcion}
        onTipoChange={setTipo}
        onDescripcionChange={setDescripcion}
        onSave={handleCrearTipo}
      />

      <CreatePromotionDialog
        open={openPromoDialog}
        onOpenChange={setOpenPromoDialog}
        tiposPromocion={tiposPromocion ?? []}
        onSubmit={crearPromocion}
      />
    </motion.div>
  );
};

export default Promotion;
