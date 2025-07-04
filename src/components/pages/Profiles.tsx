import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, HelpCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useProfiles } from '@/components/hooks/useProfiles';
import { Perfil } from '@/components/hooks/useProfiles';
import Joyride, { Step } from 'react-joyride';
import ProfilesTourSteps from '@/components/tour/ProfilesTourSteps';
import { motion } from 'framer-motion';

const truncateText = (text: string, maxLength = 120) =>
  text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Profiles = () => {
  const navigate = useNavigate();
  const { perfiles, loading, error, refetch } = useProfiles();
  const [updating, setUpdating] = useState(false);
  const [runTour, setRunTour] = useState(false);

  const steps: Step[] = ProfilesTourSteps;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  const handlePerfilClick = (perfil: Perfil) => {
    localStorage.setItem('id_perfil', perfil.id_perfil);
    localStorage.setItem('id_empresa', perfil.id_empresa);
    navigate(perfil.ruta_panel ? `/${perfil.ruta_panel}` : '/');
  };

  const handleSwitchChange = async (perfil: Perfil) => {
    setUpdating(true);

    const { id_usuario, id_empresa, id_perfil } = perfil;
    if (!id_usuario || !id_empresa || !id_perfil) {
      setUpdating(false);
      return;
    }

    const esActivo = perfil.inicio_automatico;
    if (esActivo) {
      await supabase
        .from('usuarios_perfiles')
        .update({ inicio_automatico: false })
        .eq('id_usuario', id_usuario)
        .eq('id_empresa', id_empresa)
        .eq('id_perfil', id_perfil);
    } else {
      await supabase
        .from('usuarios_perfiles')
        .update({ inicio_automatico: false })
        .eq('id_usuario', id_usuario);

      await supabase
        .from('usuarios_perfiles')
        .update({ inicio_automatico: true })
        .eq('id_usuario', id_usuario)
        .eq('id_empresa', id_empresa)
        .eq('id_perfil', id_perfil);
    }

    await refetch();
    setUpdating(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-2xl p-6 rounded-xl shadow-xl border bg-white">
        <CardContent className="flex flex-col items-center space-y-6">
          <motion.div
            className="w-full flex flex-col space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Título */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 self-start"
            >
              <h2 className="text-xl font-bold text-gray-800 tour-title">
                Selecciona tu perfil
              </h2>
              <HelpCircle
                className="w-6 h-6 text-blue-500 cursor-pointer"
                onClick={() => setRunTour(true)}
              />
            </motion.div>

            {/* Tour */}
            <motion.div variants={itemVariants}>
              <Joyride
                steps={steps}
                run={runTour}
                continuous
                showSkipButton
                spotlightClicks
                styles={{ options: { zIndex: 10000 } }}
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
              />
            </motion.div>

            {/* Contenido principal */}
            <motion.div variants={itemVariants} className="w-full">
              {loading || updating ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
                </div>
              ) : perfiles.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {error || 'No hay perfiles disponibles.'}
                </p>
              ) : (
                <div className="flex flex-col w-full gap-3">
                  {perfiles.map((perfil) => (
                    <motion.div
                      key={`${perfil.id_usuario}-${perfil.id_empresa}-${perfil.id_perfil}`}
                      variants={itemVariants}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between border rounded-lg px-4 py-3 shadow-sm bg-white gap-4"
                    >
                      {/* Info del perfil */}
                      <div className="flex items-center gap-4 flex-1 w-full">
                        {perfil.logo && (
                          <div className="w-16 h-16 rounded-full border bg-white flex items-center justify-center shrink-0">
                            <img
                              src={perfil.logo}
                              alt="Logo empresa"
                              className="w-14 h-14 rounded-full object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800 capitalize">
                            {perfil.nombre_perfil}
                          </h3>
                          {perfil.descripcion && (
                            <p className="text-xs text-gray-500">
                              {truncateText(perfil.descripcion)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col-reverse sm:flex-col items-end gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          onClick={() => handlePerfilClick(perfil)}
                          className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto tour-login-btn"
                        >
                          <LogIn className="w-4 h-4 mr-1" />
                          Iniciar sesión
                        </Button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Inicio automático
                          </span>
                          <Switch
                            checked={perfil.inicio_automatico}
                            disabled={loading || updating}
                            onClick={() => handleSwitchChange(perfil)}
                            className="tour-switch"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Logout */}
            <motion.div variants={itemVariants}>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="mt-4 self-center tour-logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profiles;
