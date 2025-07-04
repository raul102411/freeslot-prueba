// src/hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

export function useNotifications() {
  const shownNotifications = useRef<Set<string>>(new Set());
  const channelRef = useRef<any>(null);

  const fetchNotifications = async (
    userId: string,
    perfilId: string,
    empresaId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('vista_notificaciones_pendientes')
        .select('id_notificacion, titulo, mensaje')
        .eq('id_usuario', userId)
        .eq('id_perfil', perfilId)
        .eq('id_empresa', empresaId)
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
      if (channelRef.current) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.warn('❗ No hay sesión activa en Supabase');
        return;
      }

      const userId = localStorage.getItem('id_usuario') || '';
      const perfilId = localStorage.getItem('id_perfil') || '';
      const empresaId = localStorage.getItem('id_empresa') || '';
      if (!userId || !perfilId) return;

      // builder de canal realtime
      const builder = supabase.channel(`notificaciones-insert-${userId}`).on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `id_usuario=eq.${userId}`,
        },
        () => {
          fetchNotifications(userId, perfilId, empresaId);
        }
      );

      const channel = await builder.subscribe();
      channelRef.current = channel;

      // carga inicial
      fetchNotifications(userId, perfilId, empresaId);
    };

    initRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  return null;
}
