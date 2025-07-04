import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Subscriptions = () => {
  const [planesAgrupados, setPlanesAgrupados] = useState<Record<string, any>>(
    {}
  );
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [codigoInvitacion, setCodigoInvitacion] = useState<string | null>(null);
  const [usosInvitacion, setUsosInvitacion] = useState<any[]>([]);
  const userId = localStorage.getItem('id_usuario') || '';

  const fetchPlansAndSubscription = async () => {
    setLoading(true);
    try {
      const [{ data: planesVista, error: planesError }] = await Promise.all([
        supabase.from('vista_planes_servicios').select('*'),
      ]);
      const { data: usuarioVista, error: usuarioError } = await supabase
        .from('servicios_contratados')
        .select('id_plan')
        .eq('id_usuario', userId)
        .eq('activo', true);

      const { data: invitacionData, error: invitacionError } = await supabase
        .from('vista_codigo_invitacion')
        .select('codigo_invitacion')
        .eq('id_usuario', userId)
        .maybeSingle();
      if (!invitacionError && invitacionData) {
        setCodigoInvitacion(invitacionData.codigo_invitacion);
        const { data: usados, error: usadosError } = await supabase
          .from('usuarios_perfiles')
          .select('id_empresa, codigo_invitacion_usado')
          .eq('codigo_invitacion_usado', invitacionData.codigo_invitacion);
        if (!usadosError) {
          const empresasInfo = await Promise.all(
            usados.map(async (uso) => {
              if (uso.id_empresa) {
                const { data: empresa } = await supabase
                  .from('empresas')
                  .select('empresa')
                  .eq('id_empresa', uso.id_empresa)
                  .single();
                return {
                  ...uso,
                  empresa_nombre: empresa?.empresa || 'Empresa desconocida',
                };
              }
              return uso;
            })
          );
          setUsosInvitacion(empresasInfo);
        }
      }

      if (planesError || usuarioError) {
        toast.error('Error al cargar los datos de suscripción');
        setLoading(false);
        return;
      }

      const agrupados: Record<string, any> = {};
      (planesVista || []).forEach((item) => {
        if (!agrupados[item.id_plan]) {
          agrupados[item.id_plan] = {
            id_plan: item.id_plan,
            plan: item.plan,
            precio_mensual: item.precio_mensual,
            descripcion: item.descripcion,
            servicios: [],
          };
        }
        agrupados[item.id_plan].servicios.push(item.servicio_saas);
      });
      setPlanesAgrupados(agrupados);

      const uniquePlanId =
        [...new Set((usuarioVista || []).map((row) => row.id_plan))][0] || null;
      setActivePlanId(uniquePlanId);
    } catch (error) {
      toast.error('Error inesperado al cargar planes');
    } finally {
      setLoading(false);
    }
  };

  const contratarPlan = async (planId: string) => {
    const { error } = await supabase.from('servicios_contratados').insert([
      {
        id_plan: planId,
        id_usuario: userId,
        fecha_inicio: new Date().toISOString().split('T')[0],
        activo: true,
        fecha_creacion: new Date().toISOString(),
        usuario_creacion: userId,
      },
    ]);
    if (error) toast.error('No se pudo contratar el plan');
    else {
      toast.success('Plan contratado exitosamente');
      fetchPlansAndSubscription();
    }
  };

  useEffect(() => {
    fetchPlansAndSubscription();
  }, []);

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 mt-12 sm:mt-0 gap-2 sm:gap-0"
      >
        <h1 className="text-2xl font-bold text-gray-800">Planes disponibles</h1>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="mb-6 p-4 border rounded-lg bg-green-50"
      >
        <p className="text-sm text-gray-800">
          <strong>Tu código de invitación:</strong>{' '}
          {codigoInvitacion || 'Cargando...'}
        </p>
        {usosInvitacion.length > 0 ? (
          <>
            <p className="text-sm text-gray-800 mt-2">
              <strong>Invitaciones utilizadas:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              {usosInvitacion.map((uso, idx) => (
                <li key={idx}>{uso.empresa_nombre}</li>
              ))}
            </ul>
            <p className="text-sm text-green-700 mt-2">
              ¡Tienes un <strong>{usosInvitacion.length * 10}%</strong> de
              descuento por invitaciones!
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-600 mt-1">
            Aún nadie ha usado tu código. Comparte y obtén descuentos.
          </p>
        )}
      </motion.div>

      {loading ? (
        <motion.div
          variants={itemVariants}
          className="flex justify-center items-center h-32"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600" />
        </motion.div>
      ) : Object.keys(planesAgrupados).length === 0 ? (
        <motion.p variants={itemVariants} className="text-gray-500">
          No hay planes disponibles.
        </motion.p>
      ) : (
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {Object.values(planesAgrupados).map((plan: any) => (
            <motion.div
              key={plan.id_plan}
              variants={itemVariants}
              className={`border rounded-lg shadow p-6 flex flex-col justify-between ${
                plan.id_plan === activePlanId
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {plan.plan}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{plan.descripcion}</p>
                <p className="text-lg font-bold text-gray-900 mb-4">
                  {plan.precio_mensual}€/mes
                </p>
                <p className="text-sm text-gray-500 mb-2">Incluye:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {plan.servicios.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
              {plan.id_plan === activePlanId ? (
                <span className="mt-4 text-sm font-medium text-blue-600">
                  Plan actual
                </span>
              ) : (
                <Button
                  className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => contratarPlan(plan.id_plan)}
                >
                  Contratar
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Subscriptions;
