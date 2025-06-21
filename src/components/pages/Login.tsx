import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import CompanyRegisterDialog from '@/components/pages/dialogs/CompanyRegisterDialog';

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error || !data.user) {
      toast.error('Credenciales incorrectas o error de conexión.');
      return;
    }

    const user = data.user;
    localStorage.setItem('id_usuario', user.id);

    const { data: perfiles, error: perfilesError } = await supabase
      .from('vista_usuarios_detalle')
      .select('id_perfil, id_empresa, ruta_panel')
      .eq('id_usuario', user.id);

    if (perfilesError || !perfiles) {
      toast.error('No se pudieron obtener los perfiles.');
      navigate('/profiles');
      return;
    }

    if (perfiles.length === 1) {
      const perfil = perfiles[0];
      localStorage.setItem('id_perfil', perfil.id_perfil);
      localStorage.setItem('id_empresa', perfil.id_empresa);
      navigate(`/${perfil.ruta_panel}`);
    } else {
      navigate('/profiles');
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.warning('Ingresa un correo electrónico.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

    if (error) {
      toast.error('Error al enviar el correo de recuperación.');
    } else {
      toast.success(
        'Si el correo está registrado, recibirás un enlace de recuperación.'
      );
    }
  };

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

    // Intentar registrar usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email: empresaData.email,
        password: empresaData.password,
      }
    );

    let id_usuario = signUpData?.user?.id;

    if (signUpError) {
      if (signUpError.message === 'User already registered') {
        // Intentar iniciar sesión
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: empresaData.email,
            password: empresaData.password,
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

    // Verificar si ya tiene una empresa registrada
    const { data: yaTieneEmpresa } = await supabase
      .from('empresas')
      .select('id_empresa')
      .eq('id_usuario_propietario', id_usuario)
      .maybeSingle();

    if (yaTieneEmpresa) {
      toast.warning('Este usuario ya tiene una empresa registrada.');
      return;
    }

    // Insertar empresa
    const { data: insertEmpresa, error: insertError } = await supabase
      .from('empresas')
      .insert({
        empresa: empresaData.empresa,
        id_categoria: empresaData.id_categoria,
        descripcion: empresaData.descripcion,
        pais: empresaData.pais,
        provincia: empresaData.provincia,
        direccion: empresaData.direccion,
        telefono: empresaData.telefono,
        email: empresaData.email,
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

    // Subir logo (si hay)
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

    // Obtener perfil
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
    setOpenDialog(false); // cerrar diálogo
    navigate('/');
    return;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md p-6 rounded-2xl shadow-xl border">
        <CardContent className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Iniciar sesión</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="text-right">
              <Dialog>
                <DialogTrigger className="text-sm text-blue-600 hover:underline">
                  ¿Olvidó su contraseña?
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Restablecer contraseña</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Label htmlFor="resetEmail">Correo electrónico</Label>
                    <Input
                      type="email"
                      id="resetEmail"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                    <Button onClick={handlePasswordReset} className="w-full">
                      Enviar enlace
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta de empresa?{' '}
            <CompanyRegisterDialog
              open={openDialog}
              setOpen={setOpenDialog}
              empresaData={empresaData}
              handleEmpresaInput={handleEmpresaInput}
              registrarEmpresa={registrarEmpresa}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
