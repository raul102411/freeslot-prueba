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
  const [resetDialogOpen, setResetDialogOpen] = useState(false); // Nuevo estado

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
      .select('id_perfil, id_empresa, ruta_panel, perfil, inicio_automatico')
      .eq('id_usuario', user.id);

    if (perfilesError || !perfiles) {
      toast.error('No se pudieron obtener los perfiles.');
      navigate('/profiles');
      return;
    }

    const perfilAutomatico = perfiles.find((p) => p.inicio_automatico);

    if (perfilAutomatico) {
      localStorage.setItem('id_perfil', perfilAutomatico.id_perfil);
      localStorage.setItem('id_empresa', perfilAutomatico.id_empresa);
      navigate(`/${perfilAutomatico.ruta_panel}`);
    } else if (perfiles.length === 1) {
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

    const redirectTo = `${window.location.origin}/set-new-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo,
    });

    if (error) {
      toast.error('Error al enviar el correo de recuperación.');
    } else {
      toast.success(
        'Si el correo está registrado, recibirás un enlace de recuperación.'
      );
      setResetDialogOpen(false); // Cierra el diálogo al éxito
      setResetEmail(''); // Limpia el campo si quieres
    }
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
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => setResetDialogOpen(true)}
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm w-full rounded-2xl">
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
            <span
              onClick={() => setOpenDialog(true)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Regístrate aquí
            </span>
          </div>

          <CompanyRegisterDialog open={openDialog} setOpen={setOpenDialog} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
