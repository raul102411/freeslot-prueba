/* src/components/types/typeCalendar.ts */

// Tipo de pago disponible en las citas
export type TipoPago = 'tarjeta' | 'efectivo' | 'bizum' | 'otros';

// Representa una fase de servicio dentro de una cita
export interface FaseServicio {
  id_fase: string;
  nombre_fase: string;
  duracion_minutos: number;
  requiere_atencion?: boolean; // indica si es fase de atención o descanso
}

// RawAppointment: coincide con la vista de Supabase para citas
export interface RawAppointment {
  id_cita: string;
  fecha_cita: string; // Formato 'YYYY-MM-DD'
  hora_cita: string; // Formato 'HH:mm'
  hora_fin?: string; // Formato 'HH:mm'
  estado_cita: 'confirmado' | 'cancelado' | 'completado' | 'anulado';
  tipo_pago?: TipoPago;
  observaciones?: string;
  telefono?: string;
  email?: string;
  email_contacto?: string;
  motivo_cancelacion?: string;
  motivo_anulado?: string;
  fases_servicio?: FaseServicio[];
  nombre_servicio: string;
  duracion_minutos: number;
  nombre_completo: string;
  precio?: number;
}

// Representa un servicio disponible para un trabajador
export interface Servicio {
  id_servicio: string;
  nombre_servicio: string;
  duracion_minutos: number;
  precio?: number;
}

// AusenciaDB: registro tal como viene de la vista de Supabase
export interface AusenciaDB {
  id_ausencia: string;
  fecha_inicio: string; // Formato 'YYYY-MM-DD'
  fecha_fin: string; // Formato 'YYYY-MM-DD'
  estado_ausencia: string; // p. ej. 'aprobado'
  motivo?: string;
}

// Representa un día individual de ausencia para el calendario
export interface DiaAusencia {
  fecha: string; // Formato 'YYYY-MM-DD'
  estado: string; // p. ej. 'aprobado'
}

// Horario laboral de un trabajador
export interface Horario {
  id_horario: string;
  dia_semana: string; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  hora_inicio: string; // Formato 'HH:mm'
  hora_fin: string; // Formato 'HH:mm'
}

// Día no laborable personalizado
export interface DiaNoLaborable {
  id: string;
  fecha: string; // Formato 'YYYY-MM-DD'
  descripcion?: string;
}

// Día festivo de la empresa
export interface DiaFestivo {
  id: string;
  fecha: string; // Formato 'YYYY-MM-DD'
  nombre: string;
}

// CalendarEvent: para FullCalendar, mapea eventos de citas y bloques
export interface CalendarEvent {
  id?: string;
  groupId?: string;
  title?: string;
  start: string; // ISO datetime (toISOString())
  end?: string; // ISO datetime
  allDay?: boolean;
  display?: 'auto' | 'background';
  classNames?: string[];
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    id_cita?: string;
    estado?: RawAppointment['estado_cita'];
    tipo_pago?: TipoPago;
    observaciones?: string;
    telefono?: string;
    email?: string;
    email_contacto?: string;
    motivo_cancelacion?: string;
    motivo_anulado?: string;
    fases_servicio?: FaseServicio[];
    tipo?: string; // ej. 'bloqueado'
    tipo_fase?: string; // 'atencion' | 'descanso'
  };
}
