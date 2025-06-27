import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatTime = (t: string) => t?.slice(0, 5);

// ✅ Utilidad para combinar tipo de pago y precio
const formatPago = (tipo: string, precio: number | null | undefined) => {
  if (!tipo) return ''; // 🔸 dejar vacío si no hay tipo de pago
  const cantidad = precio != null ? ` - ${precio.toFixed(2)} €` : '';
  return tipo + cantidad;
};

export function exportAppointmentsToExcel(appointments: any[]) {
  const dataToExport = appointments.map((appt) => ({
    Servicio: appt.nombre_servicio,
    Teléfono: appt.telefono,
    Estado: appt.estado_cita,
    Fecha: appt.fecha_cita,
    'Hora inicio': formatTime(appt.hora_cita),
    'Hora fin': formatTime(appt.hora_fin),
    'Pago (método - precio)': formatPago(appt.tipo_pago, appt.precio), // ✅ actualizado
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Citas');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'citas.xlsx');
}

export function exportAppointmentsToPDF(appointments: any[]) {
  const doc = new jsPDF();

  const tableData = appointments.map((appt: any) => [
    appt.nombre_servicio,
    appt.telefono || '-',
    appt.estado_cita,
    appt.fecha_cita,
    formatTime(appt.hora_cita),
    formatTime(appt.hora_fin),
    formatPago(appt.tipo_pago, appt.precio), // ✅ actualizado
  ]);

  autoTable(doc, {
    head: [
      ['Servicio', 'Teléfono', 'Estado', 'Fecha', 'Inicio', 'Fin', 'Pago'],
    ],
    body: tableData,
  });

  doc.save('citas.pdf');
}

export function exportAppointmentsToExcelWithWorker(appointments: any[]) {
  const dataToExport = appointments.map((appt) => ({
    Trabajador: appt.nombre_completo || '-',
    Servicio: appt.nombre_servicio,
    Teléfono: appt.telefono,
    Estado: appt.estado_cita,
    Fecha: appt.fecha_cita,
    'Hora inicio': formatTime(appt.hora_cita),
    'Hora fin': formatTime(appt.hora_fin),
    'Pago (método - precio)': formatPago(appt.tipo_pago, appt.precio),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Citas');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'citas.xlsx');
}

export function exportAppointmentsToPDFWithWorker(appointments: any[]) {
  const doc = new jsPDF();

  const tableData = appointments.map((appt) => [
    appt.nombre_completo || '-',
    appt.nombre_servicio,
    appt.telefono || '-',
    appt.fecha_cita,
    formatTime(appt.hora_cita),
    formatTime(appt.hora_fin),
    formatPago(appt.tipo_pago, appt.precio),
  ]);

  autoTable(doc, {
    head: [
      ['Trabajador', 'Servicio', 'Teléfono', 'Fecha', 'Inicio', 'Fin', 'Pago'],
    ],
    body: tableData,
  });

  doc.save('citas.pdf');
}
