// src/components/pages/layout/LayoutWorker.tsx
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Outlet } from 'react-router-dom';
import SidebarWorker from './SidebarWorker';
import { supabase } from '@/lib/supabaseClient';

const LayoutWorker = () => {
  const shownNotifications = useRef<Set<string>>(new Set());
  const canalNotificacionesRef = useRef<any>(null);

  const fetchNotifications = async (userId: string, perfilId: string) => {
    try {
      const { data, error } = await supabase
        .from('vista_notificaciones_pendientes')
        .select('id_notificacion, titulo, mensaje')
        .eq('id_usuario', userId)
        .eq('id_perfil', perfilId)
        .eq('leido', false);

      if (!error && data) {
        data.forEach((n) => {
          if (!shownNotifications.current.has(n.id_notificacion)) {
            shownNotifications.current.add(n.id_notificacion);
            toast(n.titulo, {
              description: n.mensaje,
              duration: Infinity,
              action: {
                label: 'Cerrar',
                onClick: () => markAsRead(n.id_notificacion),
              },
            });
          }
        });
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notificaciones')
      .update({ leido: true })
      .eq('id_notificacion', id);
  };

  useEffect(() => {
    const initRealtime = async () => {
      if (canalNotificacionesRef.current) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.warn('❗ No hay sesión activa en Supabase');
        return;
      }

      const userId = localStorage.getItem('id_usuario') || '';
      const perfilId = localStorage.getItem('id_perfil') || '';
      if (!userId || !perfilId) return;

      // 1) Crear el builder
      const builder = supabase.channel(`notificaciones-insert-${userId}`).on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `id_usuario=eq.${userId}`,
        },
        () => {
          fetchNotifications(userId, perfilId);
        }
      );

      // 2) Suscribirse
      const channel = await builder.subscribe();
      canalNotificacionesRef.current = channel;

      // 3) Carga inicial
      fetchNotifications(userId, perfilId);
    };

    initRealtime();

    return () => {
      if (canalNotificacionesRef.current) {
        supabase.removeChannel(canalNotificacionesRef.current);
        canalNotificacionesRef.current = null;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarWorker />
      <main className="flex-1 w-full max-w-full overflow-x-hidden px-4 py-4 sm:px-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default LayoutWorker;
