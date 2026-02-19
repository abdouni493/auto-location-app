
import React, { useState, useEffect } from 'react';
import { User, Language, Vehicle, Agency, Customer, Worker, Reservation } from './types';
import { MOCK_WORKERS, DEFAULT_TEMPLATES } from './constants';
import { supabase } from './lib/supabase';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import EmptyPage from './pages/EmptyPage';
import VehiclesPage from './pages/VehiclesPage';
import AgenciesPage from './pages/AgenciesPage';
import PlannerPage from './pages/PlannerPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';
import ConfigPage from './pages/ConfigPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import WorkerPaymentsPage from './pages/WorkerPaymentsPage';
import OperationsPage from './pages/OperationsPage';
import PersonalizationPage from './pages/PersonalizationPage';
import WorkersPage from './pages/WorkersPage';
import ExpensesPage from './pages/ExpensesPage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('fr');
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [templates, setTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [damages, setDamages] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [storeName, setStoreName] = useState<string>('DriveFlow');
  const [logo, setLogo] = useState<string>('');
  const [storeInfo, setStoreInfo] = useState({ name: 'DriveFlow', phone: '', email: '', address: '' });

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        fetchAndSetUser(session.user.id, session.user.email || '');
        refreshData();
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchAndSetUser(session.user.id, session.user.email || '');
        refreshData();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = async () => {
    try {
      await Promise.allSettled([fetchVehicles(), fetchAgencies(), fetchCustomers(), fetchReservations(), fetchInspections(), fetchDamages(), fetchWorkers(), fetchExpenses(), fetchMaintenances(), fetchConfig()]);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAndSetUser = (userId: string, email: string) => {
    const isAdminEmail = email.toLowerCase() === 'admin@admin.com';
    setUser({ username: email.split('@')[0], role: isAdminEmail ? 'admin' : 'worker' });
  };

  const fetchVehicles = async () => {
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(v => ({
        id: v.id,
        brand: v.brand,
        model: v.model,
        year: v.year,
        immatriculation: v.immatriculation,
        color: v.color,
        chassisNumber: v.chassis_number,
        fuelType: v.fuel_type,
        transmission: v.transmission,
        seats: v.seats,
        doors: v.doors,
        dailyRate: v.daily_rate,
        weeklyRate: v.weekly_rate,
        monthlyRate: v.monthly_rate,
        deposit: v.deposit,
        status: v.status,
        currentLocation: v.current_location,
        mileage: v.mileage,
        insuranceExpiry: v.insurance_expiry,
        techControlDate: v.tech_control_date,
        insuranceInfo: v.insurance_info,
        mainImage: v.main_image,
        secondaryImages: v.secondary_images || []
      }));
      setVehicles(formatted as any);
    }
  };

  const fetchAgencies = async () => {
    const { data } = await supabase.from('agencies').select('*').order('name', { ascending: true });
    if (data) setAgencies(data);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (data) {
      const formatted = data.map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        email: c.email,
        idCardNumber: c.id_card_number,
        wilaya: c.wilaya,
        address: c.address,
        licenseNumber: c.license_number,
        licenseExpiry: c.license_expiry,
        profilePicture: c.profile_picture,
        documentImages: c.document_images || [],
        documentLeftAtStore: c.document_left_at_store,
        totalReservations: c.total_reservations || 0,
        totalSpent: c.total_spent || 0
      }));
      setCustomers(formatted);
    }
  };

  const fetchReservations = async () => {
    // Specifically mapping all columns used in PlannerPage to avoid 400 errors or missing data
    const { data } = await supabase.from('reservations').select(`
      id, reservation_number, customer_id, vehicle_id, start_date, end_date, status, 
      total_amount, paid_amount, pickup_agency_id, return_agency_id, driver_id, 
      caution_amount, discount, with_tva, options, activation_log, termination_log
    `).order('created_at', { ascending: false });
    
    if (data) {
      const formatted = data.map(r => ({
        id: r.id,
        reservationNumber: r.reservation_number,
        customerId: r.customer_id,
        vehicleId: r.vehicle_id,
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        totalAmount: r.total_amount || 0,
        paidAmount: r.paid_amount || 0,
        pickupAgencyId: r.pickup_agency_id || '',
        returnAgencyId: r.return_agency_id || '',
        driverId: r.driver_id,
        cautionAmount: r.caution_amount || 0,
        discount: r.discount || 0,
        withTVA: r.with_tva || false,
        options: r.options || [],
        activationLog: r.activation_log,
        terminationLog: r.termination_log
      }));
      setReservations(formatted as any);
    }
  };

  const fetchInspections = async () => {
    try {
      const { data } = await supabase.from('inspections').select('*').order('created_at', { ascending: false });
      if (data) {
        const formatted = data.map(i => ({
          id: i.id,
          reservationId: i.reservation_id,
          type: i.type,
          date: i.date,
          mileage: i.mileage,
          fuel: i.fuel,
          security: i.security || {},
          equipment: i.equipment || {},
          comfort: i.comfort || {},
          cleanliness: i.cleanliness || {},
          exteriorPhotos: i.exterior_photos || [],
          interiorPhotos: i.interior_photos || [],
          signature: i.signature || '',
          notes: i.notes || ''
        }));
        setInspections(formatted);
      }
    } catch (err) {
      console.error('Error fetching inspections:', err);
      setInspections([]);
    }
  };

  const fetchDamages = async () => {
    try {
      const { data } = await supabase.from('damages').select('*').order('created_at', { ascending: false });
      if (data) {
        const formatted = data.map(d => ({
          id: d.id,
          reservationId: d.reservation_id,
          inspectionId: d.inspection_id,
          location: d.location,
          severity: d.severity,
          description: d.description,
          photoUrl: d.photo_url,
          estimatedCost: d.estimated_cost,
          status: d.status,
          notes: d.notes
        }));
        setDamages(formatted);
      }
    } catch (err) {
      console.error('Error fetching damages:', err);
      setDamages([]);
    }
  };

  const handleAddInspection = async (insp: any) => {
    try {
      const { error } = await supabase.from('inspections').insert([{
        reservation_id: insp.reservationId,
        type: insp.type,
        date: insp.date,
        mileage: insp.mileage,
        fuel: insp.fuel,
        security: insp.security,
        equipment: insp.equipment,
        comfort: insp.comfort,
        cleanliness: insp.cleanliness,
        exterior_photos: insp.exteriorPhotos,
        interior_photos: insp.interiorPhotos,
        signature: insp.signature,
        notes: insp.notes
      }]);
      if (!error) {
        await fetchInspections();
      }
    } catch (err) {
      console.error('Error adding inspection:', err);
    }
  };

  const handleUpdateInspection = async (insp: any) => {
    try {
      const { error } = await supabase.from('inspections').update({
        type: insp.type,
        date: insp.date,
        mileage: insp.mileage,
        fuel: insp.fuel,
        security: insp.security,
        equipment: insp.equipment,
        comfort: insp.comfort,
        cleanliness: insp.cleanliness,
        exterior_photos: insp.exteriorPhotos,
        interior_photos: insp.interiorPhotos,
        signature: insp.signature,
        notes: insp.notes
      }).eq('id', insp.id);
      if (!error) {
        await fetchInspections();
      }
    } catch (err) {
      console.error('Error updating inspection:', err);
    }
  };

  const handleDeleteInspection = async (id: string) => {
    try {
      const { error } = await supabase.from('inspections').delete().eq('id', id);
      if (!error) {
        await fetchInspections();
      }
    } catch (err) {
      console.error('Error deleting inspection:', err);
    }
  };

  const handleAddDamage = async (dmg: any) => {
    try {
      const { error } = await supabase.from('damages').insert([{
        reservation_id: dmg.reservationId,
        inspection_id: dmg.inspectionId,
        location: dmg.location,
        severity: dmg.severity,
        description: dmg.description,
        photo_url: dmg.photoUrl,
        estimated_cost: dmg.estimatedCost,
        status: dmg.status,
        notes: dmg.notes
      }]);
      if (!error) {
        await fetchDamages();
      }
    } catch (err) {
      console.error('Error adding damage:', err);
    }
  };

  const handleUpdateDamage = async (dmg: any) => {
    try {
      const { error } = await supabase.from('damages').update({
        location: dmg.location,
        severity: dmg.severity,
        description: dmg.description,
        photo_url: dmg.photoUrl,
        estimated_cost: dmg.estimatedCost,
        status: dmg.status,
        notes: dmg.notes
      }).eq('id', dmg.id);
      if (!error) {
        await fetchDamages();
      }
    } catch (err) {
      console.error('Error updating damage:', err);
    }
  };

  const handleDeleteDamage = async (id: string) => {
    try {
      const { error } = await supabase.from('damages').delete().eq('id', id);
      if (!error) {
        await fetchDamages();
      }
    } catch (err) {
      console.error('Error deleting damage:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await supabase.from('workers').select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (data) {
        const formatted = data.map(w => ({
          id: w.id,
          fullName: w.full_name,
          birthday: w.birthday,
          phone: w.phone,
          email: w.email,
          address: w.address,
          idCardNumber: w.id_card_number,
          photo: w.photo,
          role: w.role,
          paymentType: w.payment_type,
          amount: w.amount,
          username: w.username,
          password: w.password,
          absences: w.absences,
          totalPaid: w.total_paid,
          history: []
        }));
        
        // Fetch transactions for each worker
        const allTransactions: any = {};
        for (const worker of formatted) {
          const { data: txData } = await supabase
            .from('worker_transactions')
            .select('*')
            .eq('worker_id', worker.id)
            .order('date', { ascending: false });
          if (txData) {
            allTransactions[worker.id] = txData.map(tx => ({
              id: tx.id,
              type: tx.type,
              amount: tx.amount,
              date: tx.date,
              note: tx.note
            }));
          }
        }
        
        formatted.forEach(w => {
          w.history = allTransactions[w.id] || [];
        });
        
        setWorkers(formatted);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      setWorkers([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (data) {
        const formatted = data.map(e => ({
          id: e.id,
          name: e.name,
          cost: e.cost,
          date: e.date
        }));
        setExpenses(formatted);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpenses([]);
    }
  };

  const fetchMaintenances = async () => {
    try {
      const { data } = await supabase.from('maintenance').select('*').order('date', { ascending: false });
      if (data) {
        const formatted = data.map(m => ({
          id: m.id,
          vehicleId: m.vehicle_id,
          type: m.type,
          name: m.name,
          cost: m.cost,
          date: m.date,
          expiryDate: m.expiry_date,
          note: m.note
        }));
        setMaintenances(formatted);
      }
    } catch (err) {
      console.error('Error fetching maintenances:', err);
      setMaintenances([]);
    }
  };

  const fetchConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('*')
        .eq('is_active', true)
        .single();
      if (data) {
        setStoreName(data.store_name || 'DriveFlow');
        setLogo(data.logo_url || '');
        setStoreInfo({
          name: data.store_name || 'DriveFlow',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || ''
        });
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    }
  };

  const handleAddWorker = async (worker: any) => {
    try {
      const { error } = await supabase.from('workers').insert([{
        full_name: worker.fullName,
        birthday: worker.birthday,
        phone: worker.phone,
        email: worker.email,
        address: worker.address,
        id_card_number: worker.idCardNumber,
        photo: worker.photo,
        role: worker.role,
        payment_type: worker.paymentType,
        amount: worker.amount,
        username: worker.username,
        password: worker.password,
        absences: worker.absences || 0,
        total_paid: worker.totalPaid || 0,
        is_active: true
      }]);
      if (!error) {
        await fetchWorkers();
      }
    } catch (err) {
      console.error('Error adding worker:', err);
    }
  };

  const handleUpdateWorker = async (worker: any) => {
    try {
      const { error } = await supabase.from('workers').update({
        full_name: worker.fullName,
        birthday: worker.birthday,
        phone: worker.phone,
        email: worker.email,
        address: worker.address,
        id_card_number: worker.idCardNumber,
        photo: worker.photo,
        role: worker.role,
        payment_type: worker.paymentType,
        amount: worker.amount,
        username: worker.username,
        absences: worker.absences,
        total_paid: worker.totalPaid
      }).eq('id', worker.id);
      if (!error) {
        await fetchWorkers();
      }
    } catch (err) {
      console.error('Error updating worker:', err);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    try {
      const { error } = await supabase.from('workers').update({is_active: false}).eq('id', id);
      if (!error) {
        await fetchWorkers();
      }
    } catch (err) {
      console.error('Error deleting worker:', err);
    }
  };

  const handleAddTransaction = async (workerId: string, type: string, amount: number, date: string, note?: string) => {
    try {
      const { error } = await supabase.from('worker_transactions').insert([{
        worker_id: workerId,
        type: type,
        amount: amount,
        date: date,
        note: note
      }]);
      if (!error) {
        // Update worker record based on transaction type
        const worker = workers.find(w => w.id === workerId);
        if (worker) {
          let updateData: any = {};
          
          // If it's an absence, increment the worker's absences counter
          if (type === 'absence') {
            updateData.absences = (worker.absences || 0) + 1;
          }
          
          // If it's a payment, update the totalPaid
          if (type === 'payment') {
            updateData.total_paid = (worker.totalPaid || 0) + amount;
          }
          
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('workers')
              .update(updateData)
              .eq('id', workerId);
            if (updateError) {
              console.error('Error updating worker:', updateError);
            }
          }
        }
        await fetchWorkers();
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <DashboardPage lang={lang} onNavigate={setActivePage} user={user!} reservations={reservations} vehicles={vehicles} customers={customers} />;
      case 'vehicles': 
        return <VehiclesPage lang={lang} initialVehicles={vehicles} agencies={agencies} onUpdate={fetchVehicles} />;
      case 'customers':
        return <CustomersPage lang={lang} customers={customers} reservations={reservations} vehicles={vehicles} onRefresh={fetchCustomers} />;
      case 'agencies': 
        return <AgenciesPage lang={lang} initialAgencies={agencies} onUpdate={fetchAgencies} />;
      case 'planner':
        return <PlannerPage lang={lang} customers={customers} vehicles={vehicles} agencies={agencies} workers={workers} reservations={reservations} onUpdateReservation={refreshData} onAddReservation={refreshData} onDeleteReservation={refreshData} storeLogo={logo} storeInfo={storeInfo} templates={templates} onUpdateTemplates={setTemplates} />;
      case 'team':
        return <WorkersPage lang={lang} initialWorkers={workers} onUpdate={fetchWorkers} onAddWorker={handleAddWorker} onDeleteWorker={handleDeleteWorker} onAddTransaction={handleAddTransaction} />;
      case 'billing':
        return <BillingPage lang={lang} customers={customers} vehicles={vehicles} templates={templates} reservations={reservations} storeLogo={logo} storeInfo={storeInfo} onUpdateTemplates={setTemplates} />;
      case 'operations':
        return <OperationsPage lang={lang} vehicles={vehicles} inspections={inspections} damages={damages} templates={templates} onAddInspection={handleAddInspection} onUpdateInspection={handleUpdateInspection} onDeleteInspection={handleDeleteInspection} onUpdateVehicleMileage={()=>{}} onAddDamage={handleAddDamage} onUpdateDamage={handleUpdateDamage} onDeleteDamage={handleDeleteDamage} onUpdateTemplates={setTemplates} />;
      case 'expenses':
        return <ExpensesPage lang={lang} initialExpenses={expenses} initialMaintenances={maintenances} initialVehicles={vehicles} onUpdate={refreshData} />;
      case 'personalization':
        return <PersonalizationPage lang={lang} initialTemplates={templates} onUpdateTemplates={setTemplates} />;
      case 'reports':
        return <ReportsPage lang={lang} vehicles={vehicles} customers={customers} reservations={reservations} workers={workers} expenses={[]} maintenances={[]} inspections={[]} damages={[]} agencies={agencies} />;
      case 'ai_analysis':
        return <AIAnalysisPage lang={lang} vehicles={vehicles} customers={customers} reservations={reservations} workers={workers} expenses={expenses} maintenances={maintenances} />;
      case 'config':
        return <ConfigPage lang={lang} />;
      case 'my_payments':
        return <WorkerPaymentsPage lang={lang} user={user!} />;
      default: 
        return <EmptyPage title={activePage} lang={lang} />;
    }
  };

  if (!user) return <LoginPage onLogin={setUser} lang={lang} onLanguageToggle={setLang} storeName={storeName} logo={logo} />;

  return (
    <div className={`min-h-screen bg-gray-50 flex ${lang === 'ar' ? 'flex-row-reverse' : ''}`}>
      <Sidebar isOpen={sidebarOpen} activeId={activePage} onNavigate={setActivePage} lang={lang} onToggle={() => setSidebarOpen(!sidebarOpen)} user={user} storeName={storeName} logo={logo} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden text-gray-900">
        <Navbar user={user} lang={lang} onLanguageChange={setLang} onLogout={handleLogout} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-gray-50/50 custom-scrollbar p-4 md:p-8">
          <div className="container mx-auto max-w-[1600px]">{renderPage()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
