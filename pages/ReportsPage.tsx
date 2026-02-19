
import React, { useState, useEffect } from 'react';
import { Language, Reservation, Vehicle, Customer, Worker, Expense, Maintenance, Inspection, Damage, Agency } from '../types';
import { supabase } from '../lib/supabase';
import GradientButton from '../components/GradientButton';

interface ReportsPageProps {
  lang: Language;
  vehicles: Vehicle[];
  customers: Customer[];
  reservations: Reservation[];
  workers: Worker[];
  expenses: Expense[];
  maintenances: Maintenance[];
  inspections: Inspection[];
  damages: Damage[];
  agencies: Agency[];
}

interface AgencyStats {
  id: string;
  name: string;
  address: string;
  totalReservations: number;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  reservationDetails: Reservation[];
  expenses: any[];
  maintenances: any[];
  vehicleCount: number;
  activeVehicles: number;
  damageCount: number;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ 
  lang, vehicles, customers, reservations, workers, expenses, maintenances, inspections, damages, agencies 
}) => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [agencyStats, setAgencyStats] = useState<AgencyStats[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRtl = lang === 'ar';
  const t = {
    fr: {
      title: 'Rapports & Statistiques',
      period: 'Période d\'analyse',
      start: 'Date de début',
      end: 'Date de fin',
      generate: 'Générer l\'Audit Complet',
      summary: 'Résumé Exécutif',
      gains: 'Gains Totaux',
      expenses: 'Dépenses Totales',
      profit: 'Bénéfice Net',
      resCount: 'Réservations',
      planner: 'Activité Planificateur',
      ops: 'Opérations & Maintenance',
      fleet: 'État de la Flotte',
      crm: 'Activité Clients',
      hr: 'Ressources Humaines',
      billing: 'Facturation & Revenus',
      details: 'Détails Littéraux',
      currency: 'DZ',
      agencies: 'Analyse par Agence',
      agencyDetails: 'Détails de l\'Agence',
      vehicles: 'Véhicules',
      avgRevenue: 'Revenu Moyen',
      performance: 'Performance',
      occupancy: 'Taux d\'occupation',
      damagesReported: 'Dégâts Signalés',
      revenue: 'Revense',
      allPeriod: 'Toute la période'
    },
    ar: {
      title: 'التقارير والإحصائيات',
      period: 'فترة التحليل',
      start: 'تاريخ البدء',
      end: 'تاريخ الانتهاء',
      generate: 'توليد التدقيق الكامل',
      summary: 'ملخص تنفيذي',
      gains: 'إجمالي الأرباح',
      expenses: 'إجمالي المصاريف',
      profit: 'صافي الربح',
      resCount: 'الحجوزات',
      planner: 'نشاط المخطط',
      ops: 'العمليات والصيانة',
      fleet: 'حالة الأسطول',
      crm: 'نشاط الزبائن',
      hr: 'الموارد البشرية',
      billing: 'الفواتير والمداخيل',
      details: 'التفاصيل الحرفية',
      currency: 'دج',
      agencies: 'تحليل حسب الوكالة',
      agencyDetails: 'تفاصيل الوكالة',
      vehicles: 'المركبات',
      avgRevenue: 'متوسط الإيرادات',
      performance: 'الأداء',
      occupancy: 'معدل الاحتلال',
      damagesReported: 'الأضرار المبلغ عنها',
      revenue: 'الإيرادات',
      allPeriod: 'الفترة كاملة'
    }
  }[lang];

  const calculateAgencyStats = (sDate: Date, eDate: Date) => {
    const stats: AgencyStats[] = agencies.map(agency => {
      // Filter reservations by agency and date
      const agencyReservations = reservations.filter(r => {
        const d = new Date(r.startDate);
        return d >= sDate && d <= eDate && r.agencyId === agency.id;
      });

      // Filter expenses and maintenances by date and agency if they have agencyId
      const agencyExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= sDate && d <= eDate && (e as any).agencyId === agency.id;
      });

      const agencyMaintenances = maintenances.filter(m => {
        const d = new Date(m.date);
        return d >= sDate && d <= eDate && (m as any).agencyId === agency.id;
      });

      const totalRevenue = agencyReservations.reduce((acc, r) => acc + (r.paidAmount || r.totalAmount), 0);
      const totalExpenses = agencyExpenses.reduce((acc, e) => acc + e.cost, 0) + 
                           agencyMaintenances.reduce((acc, m) => acc + m.cost, 0);

      // Count vehicles for this agency
      const agencyVehicles = vehicles.filter(v => (v as any).agencyId === agency.id);
      
      return {
        id: agency.id,
        name: agency.name,
        address: agency.address,
        totalReservations: agencyReservations.length,
        totalRevenue,
        totalExpenses,
        profit: totalRevenue - totalExpenses,
        reservationDetails: agencyReservations,
        expenses: agencyExpenses,
        maintenances: agencyMaintenances,
        vehicleCount: agencyVehicles.length,
        activeVehicles: agencyVehicles.filter(v => v.status === 'available').length,
        damageCount: damages.filter(d => agencyReservations.some(r => r.id === (d as any).reservationId)).length
      };
    });
    return stats;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    setTimeout(() => {
      const filteredRes = reservations.filter(r => {
        const d = new Date(r.startDate);
        return d >= sDate && d <= eDate;
      });

      const filteredExp = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= sDate && d <= eDate;
      });

      const filteredMaint = maintenances.filter(m => {
        const d = new Date(m.date);
        return d >= sDate && d <= eDate;
      });

      const filteredInsp = inspections.filter(i => {
        const d = new Date(i.date);
        return d >= sDate && d <= eDate;
      });

      const totalGains = filteredRes.reduce((acc, r) => acc + (r.paidAmount || r.totalAmount), 0);
      const totalExpenses = filteredExp.reduce((acc, e) => acc + e.cost, 0) + 
                            filteredMaint.reduce((acc, m) => acc + m.cost, 0);

      const stats = calculateAgencyStats(sDate, eDate);
      setAgencyStats(stats);

      setReportData({
        reservations: filteredRes,
        expenses: filteredExp,
        maintenances: filteredMaint,
        inspections: filteredInsp,
        gains: totalGains,
        costs: totalExpenses,
        profit: totalGains - totalExpenses,
        startDate: startDate,
        endDate: endDate
      });
      setSelectedAgency(null);
      setIsGenerating(false);
    }, 1000);
  };

  const SectionTitle = ({ children, icon }: React.PropsWithChildren<{ icon: string }>) => (
    <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-8">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{children}</h3>
    </div>
  );

  const StatCard = ({ label, value, unit, color = 'blue' }: { label: string; value: number | string; unit?: string; color?: string }) => {
    const colorClass = {
      blue: 'bg-blue-50 text-blue-600 border-blue-100',
      red: 'bg-red-50 text-red-600 border-red-100',
      green: 'bg-green-50 text-green-600 border-green-100',
      purple: 'bg-purple-50 text-purple-600 border-purple-100'
    }[color];

    return (
      <div className={`p-6 rounded-3xl border ${colorClass} backdrop-blur`}>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <p className="text-3xl font-black">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {unit && <p className="text-xs font-bold opacity-60 mt-1">{unit}</p>}
      </div>
    );
  };

  const renderAgencyReport = (agency: AgencyStats) => (
    <div className="space-y-12 animate-fade-in">
      {/* Agency Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 rounded-[4rem] text-white shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-4xl font-black mb-2">{agency.name}</h2>
            <p className="text-blue-100 font-bold mb-4">📍 {agency.address}</p>
            <p className="text-sm font-bold opacity-80">Période: {reportData.startDate} à {reportData.endDate}</p>
          </div>
          <button
            onClick={() => setSelectedAgency(null)}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-black text-sm uppercase transition-all"
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Agency Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label={t.resCount} value={agency.totalReservations} color="blue" />
        <StatCard label={t.revenue} value={agency.totalRevenue} unit={t.currency} color="green" />
        <StatCard label={t.expenses} value={agency.totalExpenses} unit={t.currency} color="red" />
        <StatCard label={t.profit} value={agency.profit} unit={t.currency} color="purple" />
      </div>

      {/* Fleet & Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <SectionTitle icon="🚗">{t.fleet}</SectionTitle>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
              <span className="font-bold text-gray-700">Total Véhicules</span>
              <span className="text-2xl font-black text-blue-600">{agency.vehicleCount}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
              <span className="font-bold text-gray-700">Véhicules Actifs</span>
              <span className="text-2xl font-black text-green-600">{agency.activeVehicles}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-2xl">
              <span className="font-bold text-gray-700">Taux d\'occupation</span>
              <span className="text-2xl font-black text-yellow-600">{agency.vehicleCount > 0 ? Math.round((agency.totalReservations / agency.vehicleCount / ((new Date(reportData.endDate).getTime() - new Date(reportData.startDate).getTime()) / (1000 * 60 * 60 * 24))) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <SectionTitle icon="📊">Dégâts & Incidents</SectionTitle>
          <div className="space-y-4">
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-xs font-black text-gray-400 uppercase mb-2">Total Incidents</p>
              <p className="text-3xl font-black text-red-600">{agency.damageCount}</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase mb-2">Coût des Dégâts</p>
              <p className="text-2xl font-black text-gray-900">
                {damages
                  .filter(d => agency.reservationDetails.some(r => r.id === (d as any).reservationId))
                  .reduce((acc, d) => acc + d.costs, 0)
                  .toLocaleString()} {t.currency}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <SectionTitle icon="💰">Résumé Financier</SectionTitle>
          <div className="space-y-4">
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-xs font-black text-gray-400 uppercase mb-2">Revenu Net</p>
              <p className="text-2xl font-black text-green-600">{agency.profit.toLocaleString()} {t.currency}</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs font-black text-gray-400 uppercase mb-2">Margin</p>
              <p className="text-2xl font-black text-blue-600">
                {agency.totalRevenue > 0 ? Math.round((agency.profit / agency.totalRevenue) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations */}
      <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
        <SectionTitle icon="📅">Réservations de la Période</SectionTitle>
        <div className="space-y-4">
          {agency.reservationDetails.map((res) => {
            const client = customers.find(c => c.id === res.customerId);
            const veh = vehicles.find(v => v.id === res.vehicleId);
            return (
              <div key={res.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-6 flex-1">
                  <img src={client?.profilePicture || '👤'} className="w-14 h-14 rounded-full border-2 border-white shadow-md" alt="Client" />
                  <div>
                    <p className="font-black text-gray-900">{client?.firstName} {client?.lastName}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{veh?.brand} {veh?.model} • #{res.reservationNumber}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(res.startDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')} → {new Date(res.endDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-DZ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-green-600">{(res.paidAmount || res.totalAmount).toLocaleString()} {t.currency}</p>
                  <span className="inline-block px-3 py-1 bg-white rounded-full text-[9px] font-black uppercase text-blue-600 mt-2">
                    {res.status === 'completed' ? '✅ Complétée' : res.status === 'active' ? '🟢 Active' : '⏳ En attente'}
                  </span>
                </div>
              </div>
            );
          })}
          {agency.reservationDetails.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="font-bold">Aucune réservation pour cette période</p>
            </div>
          )}
        </div>
      </div>

      {/* Expenses & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <SectionTitle icon="💸">Dépenses</SectionTitle>
          <div className="space-y-3">
            {agency.expenses.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
                <span className="font-bold text-gray-700">{exp.name}</span>
                <span className="font-black text-red-600">{exp.cost.toLocaleString()} {t.currency}</span>
              </div>
            ))}
            {agency.expenses.length === 0 && (
              <p className="text-center text-gray-400 py-6">Aucune dépense</p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <SectionTitle icon="🔧">Maintenances</SectionTitle>
          <div className="space-y-3">
            {agency.maintenances.map((maint) => (
              <div key={maint.id} className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div>
                  <p className="font-bold text-gray-700">{maint.name}</p>
                  <p className="text-xs text-gray-400">{maint.type}</p>
                </div>
                <span className="font-black text-orange-600">{maint.cost.toLocaleString()} {t.currency}</span>
              </div>
            ))}
            {agency.maintenances.length === 0 && (
              <p className="text-center text-gray-400 py-6">Aucune maintenance</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`p-4 md:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      {!selectedAgency && (
        <>
          {/* Header & Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter mb-4">{t.title}</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em]">Audit analytique complet de performance</p>
            </div>

            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">{t.start}</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="block w-48 px-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">{t.end}</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="block w-48 px-6 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
                />
              </div>
              <GradientButton 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="!px-10 !py-3 rounded-2xl shadow-xl min-w-[200px]"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ...
                  </div>
                ) : (
                  '🚀 ' + t.generate
                )}
              </GradientButton>
            </div>
          </div>

          {reportData ? (
            <div className="space-y-16 animate-fade-in">
              
              {/* Executive Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label={t.gains} value={reportData.gains} unit={t.currency} color="green" />
                <StatCard label={t.expenses} value={reportData.costs} unit={t.currency} color="red" />
                <StatCard label={t.profit} value={reportData.profit} unit={t.currency} color="purple" />
                <StatCard label={t.resCount} value={reportData.reservations.length} unit="dossiers" color="blue" />
              </div>

              {/* Agencies Analysis */}
              <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                <SectionTitle icon="🏢">{t.agencies}</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {agencyStats.map((agency) => (
                    <div
                      key={agency.id}
                      onClick={() => setSelectedAgency(agency.id)}
                      className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-[3rem] border border-gray-200 hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all group"
                    >
                      <h3 className="text-xl font-black text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">{agency.name}</h3>
                      <p className="text-xs font-bold text-gray-500 mb-6 line-clamp-2">{agency.address}</p>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Réservations</span>
                          <span className="text-lg font-black text-blue-600">{agency.totalReservations}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Revenu</span>
                          <span className="text-lg font-black text-green-600">{agency.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-gray-600">Bénéfice</span>
                          <span className="text-lg font-black text-purple-600">{agency.profit.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                        <span>{agency.vehicleCount} 🚗</span>
                        <span>{agency.damageCount} ⚠️</span>
                      </div>

                      <button className="w-full mt-4 py-3 bg-white hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-200 rounded-2xl font-black text-xs uppercase transition-all">
                        Voir Détails →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Top Customers */}
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                  <SectionTitle icon="👥">Meilleurs Clients</SectionTitle>
                  <div className="space-y-4">
                    {customers
                      .map(c => ({
                        ...c,
                        spent: reservations
                          .filter(r => r.customerId === c.id && new Date(r.startDate) >= new Date(startDate) && new Date(r.startDate) <= new Date(endDate))
                          .reduce((acc, r) => acc + (r.paidAmount || r.totalAmount), 0)
                      }))
                      .filter(c => c.spent > 0)
                      .sort((a, b) => b.spent - a.spent)
                      .slice(0, 5)
                      .map((c) => (
                        <div key={c.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <img src={c.profilePicture || '👤'} className="w-10 h-10 rounded-full" alt="Client" />
                            <span className="font-bold text-gray-900">{c.firstName} {c.lastName}</span>
                          </div>
                          <span className="font-black text-blue-600">{c.spent.toLocaleString()} {t.currency}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Fleet Status */}
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100">
                  <SectionTitle icon="🚗">État de la Flotte</SectionTitle>
                  <div className="space-y-4">
                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-xs font-black text-gray-400 uppercase mb-2">Total Véhicules</p>
                      <p className="text-3xl font-black text-blue-600">{vehicles.length}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Disponibles</p>
                        <p className="text-2xl font-black text-green-600">{vehicles.filter(v => v.status === 'available').length}</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">En Location</p>
                        <p className="text-2xl font-black text-yellow-600">{vehicles.filter(v => v.status === 'rented').length}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Print Button */}
              <div className="flex justify-center pt-10">
                <GradientButton onClick={() => window.print()} className="!px-20 !py-6 text-lg rounded-[3rem] shadow-2xl">
                  🖨️ Imprimer l\'Audit (.PDF)
                </GradientButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
              <div className="w-40 h-40 bg-gray-100 rounded-full flex items-center justify-center text-7xl mb-10 shadow-inner">📊</div>
              <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">{lang === 'fr' ? 'Prêt à analyser' : 'جاهز للتحليل'}</h2>
              <p className="text-xl font-bold text-gray-500 mt-4">{lang === 'fr' ? 'Sélectionnez vos dates et lancez la génération de l\'audit complet.' : 'حدد التواريخ الخاصة بك وابدأ إنشاء المراجعة الكاملة.'}</p>
            </div>
          )}
        </>
      )}

      {selectedAgency && reportData && (
        renderAgencyReport(agencyStats.find(a => a.id === selectedAgency)!)
      )}
    </div>
  );
};

export default ReportsPage;
