// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

import Login from './components/pages/Login';
import Profiles from './components/pages/Profiles';
import SetNewPassword from './components/pages/SetNewPassword';

import Layout from './components/pages/company/Layout';
import Dashboard from './components/pages/company/Dashboard';
import Services from './components/pages/company/Services';
import Promotion from './components/pages/company/Promotion';
import Absences from './components/pages/company/Absences';
import Workers from './components/pages/company/Workers';
import CompanyProfile from './components/pages/company/CompanyProfile';
import Calendar from './components/pages/company/Calendar';
import Appointments from './components/pages/company/Appointments';
import GenerateQR from './components/pages/company/GenerateQR';
import SubsCriptions from './components/pages/company/Subscriptions';
import Blacklist from './components/pages/company/Blacklist';

import LayoutWorker from './components/pages/worker/LayoutWorker';
import DashboardWorker from './components/pages/worker/DashboardWorker';
import WorkerCalendar from './components/pages/worker/WorkerCalendar';
import DisplayQr from './components/pages/worker/DisplayQR';
import WorkerBlacklist from './components/pages/worker/WorkerBlacklist';
import WorkerProfile from './components/pages/worker/WorkerProfile';
import WorkerAppointments from './components/pages/worker/WorkerAppointments';

import ClientBooking from './components/pages/client/ClientBooking';
import CancelBooking from './components/pages/client/CancelBooking';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/client-booking/:id_empresa" element={<ClientBooking />} />
        <Route path="/cancelar-cita" element={<CancelBooking />} />
        <Route path="/set-new-password" element={<SetNewPassword />} />

        {/* 🔒 Rutas protegidas bajo layout persistente */}
        <Route path="/panel-empresa" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="companyProfile" element={<CompanyProfile />} />
          <Route path="services" element={<Services />} />
          <Route path="promotion" element={<Promotion />} />
          <Route path="workers" element={<Workers />} />
          <Route path="absences" element={<Absences />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="generate-qr" element={<GenerateQR />} />
          <Route path="subscriptions" element={<SubsCriptions />} />
          <Route path="blacklist" element={<Blacklist />} />
        </Route>

        <Route path="/panel-trabajador" element={<LayoutWorker />}>
          <Route index element={<DashboardWorker />} />
          <Route path="workerCalendar" element={<WorkerCalendar />} />
          <Route path="displayQR" element={<DisplayQr />} />
          <Route path="workerBlacklist" element={<WorkerBlacklist />} />
          <Route path="workerProfile" element={<WorkerProfile />} />
          <Route path="workerAppointments" element={<WorkerAppointments />} />
        </Route>
      </Routes>

      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  );
}

export default App;
