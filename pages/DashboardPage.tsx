
import React, { useMemo } from 'react';
import { Language, Vehicle, Customer, Reservation, User } from '../types';

interface DashboardPageProps {
  lang: Language;
  onNavigate: (id: string) => void;
  user: User;
  reservations: Reservation[];
  vehicles: Vehicle[];
  customers: Customer[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ lang, onNavigate, user, reservations, vehicles, customers }) => {
  const isRtl = lang === 'ar';

  const stats = useMemo(() => {
    const totalGains = reservations.reduce((acc, r) => acc + (r.paidAmount || 0), 0);
    const rentedCount = vehicles.filter(v => v.status === 'loué').length;
    const totalVehicles = vehicles.length;
    
    return {
      totalGains,
      rentedCount,
      totalVehicles,
      customerCount: customers.length,
      utilization: totalVehicles > 0 ? Math.round((rentedCount / totalVehicles) * 100) : 0,
    };
  }, [reservations, vehicles, customers]);

  const t = {
    fr: {
      adminTitle: 'Tableau de bord local',
      revenue: 'Recettes totales',
      fleet: 'État de la Flotte',
      actions: { billing: 'Finances', reports: 'Audits', config: 'Système' }
    },
    ar: {
      adminTitle: 'لوحة التحكم المحلية',
      revenue: 'إجمالي المداخيل',
      fleet: 'حالة الأسطول',
      actions: { billing: 'المالية', reports: 'التقارير', config: 'النظام' }
    }
  }[lang];

  return (
    <div className={`p-4 md:p-12 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      <div className="mb-16">
        <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.adminTitle}</h1>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">Mode Démonstration - Données Constantes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.revenue}</p>
          <p className="text-5xl font-black text-blue-600 tracking-tighter">{stats.totalGains.toLocaleString()} <span className="text-sm font-bold opacity-30">DZ</span></p>
        </div>

        <div className="bg-gray-900 p-10 rounded-[3.5rem] shadow-2xl text-white">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Utilisation Flotte</p>
          <p className="text-7xl font-black text-white leading-none mb-2">{stats.utilization}%</p>
          <p className="text-xs font-bold opacity-60 uppercase">{stats.rentedCount} / {stats.totalVehicles} Voitures</p>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Clients</p>
          <p className="text-5xl font-black text-gray-900 tracking-tighter">{stats.customerCount}</p>
        </div>

        <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white">
          <p className="text-[10px] font-black uppercase tracking-widest mb-4">Missions actives</p>
          <p className="text-5xl font-black">{reservations.filter(r => r.status === 'en cours').length}</p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <button onClick={() => onNavigate('billing')} className="p-12 bg-white rounded-[4rem] border border-gray-100 hover:border-blue-600 transition-all text-center group">
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">💰</span>
          <h4 className="text-xl font-black uppercase">{t.actions.billing}</h4>
        </button>
        <button onClick={() => onNavigate('reports')} className="p-12 bg-white rounded-[4rem] border border-gray-100 hover:border-indigo-600 transition-all text-center group">
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">📊</span>
          <h4 className="text-xl font-black uppercase">{t.actions.reports}</h4>
        </button>
        <button onClick={() => onNavigate('config')} className="p-12 bg-white rounded-[4rem] border border-gray-100 hover:border-orange-600 transition-all text-center group">
          <span className="text-6xl mb-6 block group-hover:scale-110 transition-transform">⚙️</span>
          <h4 className="text-xl font-black uppercase">{t.actions.config}</h4>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
