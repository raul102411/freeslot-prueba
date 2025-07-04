import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera, HelpCircle } from 'lucide-react';
import Joyride, { Step } from 'react-joyride';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import ScheduleDialog from '@/components/pages/dialogs/ScheduleDialog';
import HolidayDialog from '@/components/pages/dialogs/HolidayDialog';
import CompanyProfileTourSteps from '@/components/tour/company/CompanyProfileTourSteps';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CompanyProfile = () => {
  const [empresa, setEmpresa] = useState({
    empresa: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    email: '',
    logo: '',
    pais: '',
    provincia: '',
    categoria: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresa, setLoadingEmpresa] = useState(true);
  const [runTour, setRunTour] = useState(false);

  const id_empresa = localStorage.getItem('id_empresa');
  const steps: Step[] = CompanyProfileTourSteps;

  const fetchEmpresa = async () => {
    setLoadingEmpresa(true);
    const { data, error } = await supabase
      .from('vista_empresa_detalle')
      .select('*')
      .eq('id_empresa', id_empresa)
      .single();

    if (error || !data) {
      toast.error('Error al cargar la empresa.');
    } else {
      setEmpresa(data);
    }
    setLoadingEmpresa(false);
  };

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value, files } = e.target as HTMLInputElement & {
      files?: FileList;
    };
    if (id === 'logo' && files?.length) {
      setLogoFile(files[0]);
    } else {
      setEmpresa((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    let logoUrl = empresa.logo;

    if (logoFile) {
      const extension = logoFile.name.split('.').pop();
      const path = `logos/${id_empresa}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('reservas')
        .upload(path, logoFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: logoFile.type,
        });

      if (uploadError) {
        toast.error('Error al subir el logo.');
        setLoading(false);
        return;
      }

      const { data } = supabase.storage.from('reservas').getPublicUrl(path);
      logoUrl = data.publicUrl;
    }

    const { error: updateError } = await supabase
      .from('empresas')
      .update({
        empresa: empresa.empresa,
        descripcion: empresa.descripcion,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        email: empresa.email,
        pais: empresa.pais,
        provincia: empresa.provincia,
        logo: logoUrl,
      })
      .eq('id_empresa', id_empresa);

    setLoading(false);

    if (updateError) {
      toast.error('Error al guardar los cambios.');
    } else {
      toast.success('Empresa actualizada.');
      fetchEmpresa();
      setLogoFile(null);
    }
  };

  useEffect(() => {
    fetchEmpresa();
  }, []);

  if (!id_empresa) return null;

  if (loadingEmpresa) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-800 tour-title">
          Perfil de la Empresa
        </h1>
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

      {/* Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Logo and dialogs */}
            <motion.div
              variants={itemVariants}
              className="flex justify-between items-center mb-4 space-x-4"
            >
              <Label>Logo</Label>
              <div className="flex gap-2">
                <ScheduleDialog id_empresa={id_empresa} />
                <HolidayDialog id_empresa={id_empresa} />
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 tour-inputs"
            >
              <div className="space-y-2 col-span-full">
                <label
                  htmlFor="logo"
                  className="block w-32 h-32 cursor-pointer rounded-xl border bg-muted hover:bg-muted/60 transition overflow-hidden tour-logo"
                >
                  <div className="flex items-center justify-center w-full h-full">
                    {logoFile ? (
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : empresa.logo ? (
                      <img
                        src={empresa.logo}
                        alt="Logo actual"
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleInput}
                    className="hidden"
                  />
                </label>
              </div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="empresa">Nombre</Label>
                <Input
                  id="empresa"
                  value={empresa.empresa}
                  onChange={handleInput}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  value={empresa.email}
                  onChange={handleInput}
                  disabled
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Input id="categoria" value={empresa.categoria} disabled />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={empresa.telefono}
                  onChange={handleInput}
                />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input id="pais" value={empresa.pais} onChange={handleInput} />
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={empresa.provincia}
                  onChange={handleInput}
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="space-y-2 col-span-full"
              >
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={empresa.direccion}
                  onChange={handleInput}
                />
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="col-span-full space-y-2"
              >
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={empresa.descripcion}
                  onChange={handleInput}
                />
              </motion.div>
            </motion.div>

            {/* Save */}
            <motion.div
              variants={itemVariants}
              className="flex justify-end pt-4"
            >
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white tour-save-btn"
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CompanyProfile;
