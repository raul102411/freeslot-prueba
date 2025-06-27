'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Calendar, Trash2 } from 'lucide-react';

interface Props {
  id_empresa: string;
}

interface Festivo {
  id_festivo: string;
  fecha: string;
  motivo: string;
}

const HolidayDialog = ({ id_empresa }: Props) => {
  const currentYear = new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(currentYear);
  const [loading, setLoading] = useState(false);

  const cargarFestivos = async () => {
    const { data, error } = await supabase
      .from('festivos')
      .select('id_festivo, fecha, motivo')
      .eq('id_empresa', id_empresa)
      .gte('fecha', `${añoSeleccionado}-01-01`)
      .lte('fecha', `${añoSeleccionado}-12-31`)
      .order('fecha', { ascending: true });

    if (!error && data) {
      setFestivos(data);
    } else {
      setFestivos([]);
    }
  };

  const handleGuardar = async () => {
    if (!fecha) {
      toast.error('Selecciona una fecha.');
      return;
    }

    const añoFecha = new Date(fecha).getFullYear();
    if (añoFecha !== añoSeleccionado) {
      toast.warning(
        `La fecha pertenece al año ${añoFecha}, no a ${añoSeleccionado}.`
      );
      return;
    }

    // Validar duplicado
    const { data: existente, error: errorExistente } = await supabase
      .from('festivos')
      .select('id_festivo')
      .eq('id_empresa', id_empresa)
      .eq('fecha', fecha)
      .maybeSingle();

    if (errorExistente) {
      toast.error('Error al verificar duplicados.');
      return;
    }

    if (existente) {
      toast.error('Ya existe un festivo en esa fecha.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('festivos').insert({
      id_empresa,
      fecha,
      motivo,
    });

    setLoading(false);

    if (error) {
      toast.error('Error al guardar el festivo.');
    } else {
      toast.success('Festivo creado correctamente.');
      setFecha('');
      setMotivo('');
      cargarFestivos();
    }
  };

  const eliminarFestivo = async (id_festivo: string) => {
    const { error } = await supabase
      .from('festivos')
      .delete()
      .eq('id_festivo', id_festivo);

    if (error) {
      toast.error('Error al eliminar festivo.');
    } else {
      toast.success('Festivo eliminado.');
      cargarFestivos();
    }
  };

  useEffect(() => {
    if (open) {
      cargarFestivos();
    }
  }, [open, añoSeleccionado]);

  const añosDisponibles = Array.from(
    { length: 5 },
    (_, i) => currentYear - 2 + i
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
          title="Ver y añadir festivos"
        >
          <Calendar className="w-4 h-4" /> Festivos
        </button>
      </DialogTrigger>

      <DialogContent className="w-[90vw] max-w-2xl mx-auto rounded-2xl shadow-xl border p-4 sm:p-6 overflow-y-auto max-h-[90vh] bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Festivos por año
          </DialogTitle>
        </DialogHeader>

        {/* Crear festivo */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Ej. Año nuevo, día nacional, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGuardar}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Guardando...' : 'Guardar festivo'}
          </Button>
        </div>

        <hr className="border-t border-gray-200" />

        {/* Filtro por año */}
        <div>
          <Label htmlFor="año" className="mr-2">
            Año
          </Label>
          <select
            id="año"
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
            className="border rounded-md px-2 py-1 text-sm"
          >
            {añosDisponibles.map((año) => (
              <option key={año} value={año}>
                {año}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de festivos */}
        {festivos.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-md font-semibold text-gray-700">
              Festivos de {añoSeleccionado}
            </h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {festivos.map((f) => (
                <li
                  key={f.id_festivo}
                  className="flex items-start justify-between p-2 border rounded-md bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{f.fecha}</p>
                    {f.motivo && (
                      <p className="text-sm text-gray-600">{f.motivo}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminarFestivo(f.id_festivo)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar festivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-500 pt-6">
            No hay festivos registrados para {añoSeleccionado}.
          </p>
        )}

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
};

export default HolidayDialog;
