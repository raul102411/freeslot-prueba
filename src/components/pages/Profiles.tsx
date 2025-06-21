import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './../ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { LogOut } from 'lucide-react';

interface Perfile {
  nombre_perfil: string;
  id_perfil: string;
  id_empresa: string;
  ruta_panel: string | null;
}

const Profiles = () => {
  const [perfiles, setPerfiles] = useState<Perfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfiles = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Usuario no autenticado.');
        setLoading(false);
        return;
      }

      localStorage.setItem('id_usuario', user.id);

      const { data, error: perfilesError } = await supabase
        .from('vista_usuarios_detalle')
        .select('nombre_perfil, id_perfil, id_empresa, ruta_panel')
        .eq('id_usuario', user.id);

      if (perfilesError || !data) {
        setError('No se pudieron obtener los perfiles.');
        setLoading(false);
        return;
      }

      setPerfiles(data);
      setLoading(false);
    };

    fetchPerfiles();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/');
  };

  const handlePerfilClick = (perfil: Perfile) => {
    localStorage.setItem('id_perfil', perfil.id_perfil);
    localStorage.setItem('id_empresa', perfil.id_empresa);

    if (perfil.ruta_panel) {
      navigate(`/${perfil.ruta_panel}`);
    } else {
      navigate('/'); // fallback en caso de que no tenga ruta_panel
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md p-6 rounded-lg shadow-xl border bg-white">
        <CardContent className="flex flex-col items-center text-center space-y-6">
          <h2 className="text-2xl font-bold">Selecciona tu perfil</h2>

          {loading ? (
            <p className="text-gray-500 animate-pulse">Cargando perfiles...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="flex flex-col w-full gap-4">
              {perfiles.map((perfil) => (
                <Button
                  key={perfil.id_perfil}
                  onClick={() => handlePerfilClick(perfil)}
                  className="w-full capitalize py-4 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-sm transition"
                >
                  {perfil.nombre_perfil}
                </Button>
              ))}
            </div>
          )}

          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full flex items-center justify-center gap-2 mt-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profiles;
