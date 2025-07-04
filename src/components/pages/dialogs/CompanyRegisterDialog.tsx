import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface Categoria {
  id_categoria: string;
  categoria: string;
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const CompanyRegisterDialog = ({ open, setOpen }: Props) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [empresaData, setEmpresaData] = useState({
    logo: null as File | null,
    empresa: '',
    id_categoria: '',
    descripcion: '',
    pais: '',
    provincia: '',
    direccion: '',
    telefono: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error } = await supabase
        .from('vista_cb_categoria_empresa')
        .select('id_categoria, categoria');

      if (!error && data) setCategorias(data);
    };

    fetchCategorias();
  }, []);

  const handleEmpresaInput = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
      const files = e.target.files;
      if (id === 'logo' && files && files.length > 0) {
        setEmpresaData((prev) => ({ ...prev, logo: files[0] }));
      }
    } else {
      setEmpresaData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const registrarEmpresa = async () => {
    const {
      empresa,
      id_categoria,
      direccion,
      pais,
      provincia,
      telefono,
      email,
      password,
      confirmPassword,
    } = empresaData;

    if (
      !empresa ||
      !id_categoria ||
      !direccion ||
      !telefono ||
      !email ||
      !pais ||
      !provincia ||
      !password ||
      !confirmPassword
    ) {
      toast.error('Todos los campos son obligatorios excepto el logo.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
      }
    );

    let id_usuario = signUpData?.user?.id;

    if (signUpError) {
      if (signUpError.message === 'User already registered') {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError || !signInData.user) {
          toast.error(
            'El usuario ya existe pero no se pudo iniciar sesión. Verifica la contraseña.'
          );
          return;
        }

        id_usuario = signInData.user.id;
      } else {
        toast.error('Error al registrar el usuario.');
        return;
      }
    }

    const { data: yaTieneEmpresa } = await supabase
      .from('empresas')
      .select('id_empresa')
      .eq('id_usuario_propietario', id_usuario)
      .maybeSingle();

    if (yaTieneEmpresa) {
      toast.warning('Este usuario ya tiene una empresa registrada.');
      return;
    }

    const { data: insertEmpresa, error: insertError } = await supabase
      .from('empresas')
      .insert({
        empresa,
        id_categoria,
        descripcion: empresaData.descripcion,
        pais,
        provincia,
        direccion,
        telefono,
        email,
        id_usuario_propietario: id_usuario,
        fecha_creacion: new Date().toISOString(),
      })
      .select('id_empresa')
      .single();

    if (insertError) {
      toast.error('Error al insertar la empresa.');
      return;
    }

    const id_empresa = insertEmpresa.id_empresa;

    if (empresaData.logo) {
      const extension = empresaData.logo.name.split('.').pop();
      const logoPath = `reservas/logos/${id_empresa}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('reservas')
        .upload(logoPath, empresaData.logo, {
          cacheControl: '3600',
          upsert: true,
          contentType: empresaData.logo.type,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('reservas')
          .getPublicUrl(logoPath);

        const logoUrl = publicUrlData.publicUrl;

        await supabase
          .from('empresas')
          .update({ logo: logoUrl })
          .eq('id_empresa', id_empresa);
      }
    }

    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('id_perfil')
      .eq('perfil', 'empresa')
      .single();

    if (perfilError) {
      toast.error('No se encontró el perfil empresa.');
      return;
    }

    await supabase.from('usuarios_perfiles').insert({
      id_usuario,
      id_perfil: perfilData.id_perfil,
      id_empresa,
    });

    toast.success(
      'Registro exitoso. Revisa tu correo y verifica tu cuenta antes de iniciar sesión.'
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-[90vw] sm:max-w-3xl mx-auto rounded-2xl shadow-2xl p-0">
        <div className="max-h-[90vh] overflow-y-auto px-4 py-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Crear cuenta de empresa
            </DialogTitle>
          </DialogHeader>

          <form
            className="space-y-6 mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              registrarEmpresa();
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Label className="text-sm text-muted-foreground">Logo</Label>
              <label
                htmlFor="logo"
                className="max-w-[128px] w-full aspect-square rounded-lg border bg-muted hover:bg-muted/60 transition flex items-center justify-center overflow-hidden"
              >
                {empresaData.logo ? (
                  <img
                    src={URL.createObjectURL(empresaData.logo)}
                    alt="Logo"
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-muted-foreground" />
                )}
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleEmpresaInput}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ... el resto de inputs como antes ... */}
              <div>
                <Label htmlFor="empresa">Nombre de la empresa</Label>
                <Input
                  id="empresa"
                  value={empresaData.empresa}
                  onChange={handleEmpresaInput}
                  placeholder="Ej. Belleza y Estilo S.A."
                  required
                />
              </div>

              <div>
                <Label htmlFor="id_categoria">Categoría</Label>
                <select
                  id="id_categoria"
                  value={empresaData.id_categoria || ''}
                  onChange={handleEmpresaInput}
                  className="w-full px-3 py-2 border rounded-md bg-white"
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={empresaData.descripcion}
                  onChange={handleEmpresaInput}
                  placeholder="¿A qué se dedica tu empresa?"
                  className="resize-none"
                  required
                />
              </div>

              <div>
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  value={empresaData.pais}
                  onChange={handleEmpresaInput}
                  placeholder="Ej. España"
                  required
                />
              </div>

              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  value={empresaData.provincia}
                  onChange={handleEmpresaInput}
                  placeholder="Ej. Madrid"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={empresaData.direccion}
                  onChange={handleEmpresaInput}
                  placeholder="Calle, ciudad, código postal..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={empresaData.telefono}
                  onChange={handleEmpresaInput}
                  placeholder="600 000 000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={empresaData.email}
                  onChange={handleEmpresaInput}
                  placeholder="empresa@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={empresaData.password}
                  onChange={handleEmpresaInput}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={empresaData.confirmPassword}
                  onChange={handleEmpresaInput}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-4">
              Registrar empresa
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyRegisterDialog;
