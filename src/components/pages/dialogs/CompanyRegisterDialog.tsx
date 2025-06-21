import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
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

interface Categoria {
  id_categoria: string;
  categoria: string;
}

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
  empresaData: any;
  handleEmpresaInput: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  registrarEmpresa: () => Promise<void>;
}

const CompanyRegisterDialog = ({
  open,
  setOpen,
  empresaData,
  handleEmpresaInput,
  registrarEmpresa,
}: Props) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error } = await supabase
        .from('vista_cb_categoria_empresa')
        .select('id_categoria, categoria');

      if (!error && data) setCategorias(data);
    };

    fetchCategorias();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-blue-600 hover:underline">
        Únete
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Crear cuenta de empresa
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-6 mt-6">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm text-muted-foreground">Logo</Label>
            <label
              htmlFor="logo"
              className="w-32 h-32 rounded-lg border bg-muted hover:bg-muted/60 transition flex items-center justify-center overflow-hidden"
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

          <Button
            type="button"
            className="w-full mt-4"
            onClick={registrarEmpresa}
          >
            Registrar empresa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyRegisterDialog;
