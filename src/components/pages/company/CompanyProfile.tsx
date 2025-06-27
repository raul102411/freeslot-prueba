'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import ScheduleDialog from '@/components/pages/dialogs/ScheduleDialog';
import HolidayDialog from '@/components/pages/dialogs/HolidayDialog';

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
  const id_empresa = localStorage.getItem('id_empresa');

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
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Perfil de la Empresa</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Encabezado del Card con botón de horarios */}
          <div className="flex justify-between items-center mb-4 space-x-4">
            <div>
              <Label>Logo</Label>
            </div>
            <div className="flex gap-2">
              <ScheduleDialog id_empresa={id_empresa} />
              <HolidayDialog id_empresa={id_empresa} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="space-y-2 col-span-full">
              <label
                htmlFor="logo"
                className="block w-32 h-32 cursor-pointer rounded-xl border bg-muted hover:bg-muted/60 transition overflow-hidden"
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

            <div className="space-y-2">
              <Label htmlFor="empresa">Nombre</Label>
              <Input
                id="empresa"
                value={empresa.empresa}
                onChange={handleInput}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={empresa.email}
                onChange={handleInput}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input id="categoria" value={empresa.categoria} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={empresa.telefono}
                onChange={handleInput}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input id="pais" value={empresa.pais} onChange={handleInput} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                value={empresa.provincia}
                onChange={handleInput}
              />
            </div>

            <div className="space-y-2 col-span-full">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={empresa.direccion}
                onChange={handleInput}
              />
            </div>

            <div className="col-span-full space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={empresa.descripcion}
                onChange={handleInput}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyProfile;
