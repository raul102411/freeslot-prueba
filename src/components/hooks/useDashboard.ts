import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface DashboardStats {
  citasHoy: number;
  citasMes: number;
  trabajadores: number;
  serviciosDisponibles: number;
  facturadoMes: number;
  tasaOcupacion: number;
  clientesUnicos: number;
  cancelacionesMes: number;
}

export const useDashboard = (empresaId: string) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    citasHoy: 0,
    citasMes: 0,
    trabajadores: 0,
    serviciosDisponibles: 0,
    facturadoMes: 0,
    tasaOcupacion: 0,
    clientesUnicos: 0,
    cancelacionesMes: 0,
  });
  const [mostRequestedServices, setMostRequestedServices] = useState<
    { name: string; total: number }[]
  >([]);

  const fetchStats = async () => {
    try {
      const queries = [
        supabase
          .from('vista_citas_dia')
          .select('total')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_citas_mes')
          .select('total')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_trabajadores_disponibles')
          .select('total')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_servicios_disponibles')
          .select('total')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_facturado_mes')
          .select('total_facturado')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_tasa_ocupacion_mes')
          .select('tasa_ocupacion_porcentaje')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_clientes_unicos_mes')
          .select('total_clientes_unicos')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
        supabase
          .from('vista_citas_canceladas_mes')
          .select('total_canceladas')
          .eq('id_empresa', empresaId)
          .maybeSingle(),
      ];

      const [
        { data: citasHoy },
        { data: citasMes },
        { data: trabajadores },
        { data: serviciosDisponibles },
        { data: facturadoMes },
        { data: tasaOcupacion },
        { data: clientesUnicos },
        { data: cancelacionesMes },
      ] = await Promise.all(queries);

      setStats({
        citasHoy: citasHoy && 'total' in citasHoy ? citasHoy.total : 0,
        citasMes: citasMes && 'total' in citasMes ? citasMes.total : 0,
        trabajadores:
          trabajadores && 'total' in trabajadores ? trabajadores.total : 0,
        serviciosDisponibles:
          serviciosDisponibles && 'total' in serviciosDisponibles
            ? serviciosDisponibles.total
            : 0,
        facturadoMes:
          facturadoMes && 'total_facturado' in facturadoMes
            ? facturadoMes.total_facturado
            : 0,
        tasaOcupacion:
          tasaOcupacion && 'tasa_ocupacion_porcentaje' in tasaOcupacion
            ? tasaOcupacion.tasa_ocupacion_porcentaje
            : 0,
        clientesUnicos:
          clientesUnicos && 'total_clientes_unicos' in clientesUnicos
            ? clientesUnicos.total_clientes_unicos
            : 0,
        cancelacionesMes:
          cancelacionesMes && 'total_canceladas' in cancelacionesMes
            ? cancelacionesMes.total_canceladas
            : 0,
      });
    } catch (err) {
      console.error('Error al cargar métricas del dashboard:', err);
    }
  };

  const fetchTopServices = async () => {
    try {
      const { data } = await supabase
        .from('vista_servicios_mas_solicitados_mes')
        .select('nombre, total')
        .eq('id_empresa', empresaId);

      const formatted =
        data?.map((item: any) => ({
          name: item.nombre,
          total: item.total,
        })) || [];

      setMostRequestedServices(formatted);
    } catch (err) {
      console.error('Error al cargar servicios más solicitados:', err);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchTopServices()]);
      setLoading(false);
    };

    if (empresaId) fetchAll();
  }, [empresaId]);

  return {
    loading,
    stats,
    mostRequestedServices,
  };
};
