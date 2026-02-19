
import React, { useState, useEffect } from 'react';
import { Language, Vehicle, Customer, Reservation, Worker, Expense, Maintenance } from '../types';
import { TRANSLATIONS } from '../constants';
import { getRentalAIAnalysis } from '../services/geminiService';
import GradientButton from '../components/GradientButton';

interface AIAnalysisPageProps {
  lang: Language;
  vehicles: Vehicle[];
  customers: Customer[];
  reservations: Reservation[];
  workers: Worker[];
  expenses: Expense[];
  maintenances: Maintenance[];
}

type AnalysisCategory = 'fleet' | 'crm' | 'finance' | 'operations' | 'global';

const AIAnalysisPage: React.FC<AIAnalysisPageProps> = ({ lang, vehicles, customers, reservations, workers, expenses, maintenances }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AnalysisCategory>('global');
  const [insights, setInsights] = useState<any>(null);
  
  const isRtl = lang === 'ar';
  const t = TRANSLATIONS[lang];

  const categories = [
    { id: 'global', labelFr: '📊 Stratégie Globale', labelAr: '📊 الاستراتيجية العامة', icon: '🌐', color: 'bg-indigo-50 text-indigo-600', description: lang === 'fr' ? 'Vue d\'ensemble complète de votre activité' : 'نظرة عامة شاملة على نشاطك' },
    { id: 'fleet', labelFr: '🚗 Gestion de Flotte', labelAr: '🚗 إدارة الأسطول', icon: '🚗', color: 'bg-blue-50 text-blue-600', description: lang === 'fr' ? 'Optimisation de vos véhicules et maintenances' : 'تحسين مركباتك والصيانة' },
    { id: 'crm', labelFr: '👥 Analyse Clientèle', labelAr: '👥 تحليل الزبائن', icon: '👥', color: 'bg-purple-50 text-purple-600', description: lang === 'fr' ? 'Stratégies de fidélisation et croissance' : 'استراتيجيات الاحتفاظ والنمو' },
    { id: 'finance', labelFr: '💰 Rentabilité & Frais', labelAr: '💰 الربحية والمصاريف', icon: '💰', color: 'bg-green-50 text-green-600', description: lang === 'fr' ? 'Optimisation financière et marges' : 'التحسين المالي والهوامش' },
    { id: 'operations', labelFr: '⚙️ Opérations', labelAr: '⚙️ العمليات', icon: '⚙️', color: 'bg-orange-50 text-orange-600', description: lang === 'fr' ? 'Efficacité des opérations et ressources' : 'كفاءة العمليات والموارد' }
  ];

  // Calculate real insights from data
  const calculateInsights = () => {
    const totalRevenue = reservations.reduce((acc, r) => acc + (r.paidAmount || r.totalAmount), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.cost, 0) + maintenances.reduce((acc, m) => acc + m.cost, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(2) : 0;
    
    const activeVehicles = vehicles.filter(v => v.status === 'rented').length;
    const availableVehicles = vehicles.filter(v => v.status === 'available').length;
    const fleetUtilization = vehicles.length > 0 ? (activeVehicles / vehicles.length * 100).toFixed(2) : 0;
    
    const avgCustomerValue = customers.length > 0 ? (totalRevenue / customers.length).toFixed(2) : 0;
    const repeatCustomers = customers.filter(c => (c as any).bookingCount > 1).length;
    
    const avgMaintenanceCost = vehicles.length > 0 ? (maintenances.reduce((acc, m) => acc + m.cost, 0) / vehicles.length).toFixed(2) : 0;
    const maintenanceFrequency = vehicles.length > 0 ? (maintenances.length / vehicles.length).toFixed(2) : 0;

    return {
      revenue: { total: totalRevenue, avg: (totalRevenue / (reservations.length || 1)).toFixed(2), perVehicle: (totalRevenue / (vehicles.length || 1)).toFixed(2) },
      expenses: { total: totalExpenses, avg: (totalExpenses / (expenses.length + maintenances.length || 1)).toFixed(2) },
      profit: { total: totalProfit, margin: profitMargin },
      fleet: { total: vehicles.length, active: activeVehicles, available: availableVehicles, utilization: fleetUtilization },
      customers: { total: customers.length, repeat: repeatCustomers, avgValue: avgCustomerValue, retention: customers.length > 0 ? ((repeatCustomers / customers.length) * 100).toFixed(2) : 0 },
      reservations: { total: reservations.length, completed: reservations.filter(r => r.status === 'completed').length, active: reservations.filter(r => r.status === 'active').length },
      operations: { employees: workers.length, maintenanceFreq: maintenanceFrequency, avgMaintCost: avgMaintenanceCost }
    };
  };

  useEffect(() => {
    setInsights(calculateInsights());
  }, [vehicles, customers, reservations, workers, expenses, maintenances]);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);
    
    // Build comprehensive data context
    const dataContext = {
      insights,
      summary: lang === 'fr' ? {
        businessType: 'Agence de location de voitures',
        reportPeriod: 'Données actuelles',
        analysisCategory: selectedCategory
      } : {
        businessType: 'وكالة تأجير السيارات',
        reportPeriod: 'البيانات الحالية',
        analysisCategory: selectedCategory
      }
    };

    const categoryLabel = categories.find(c => c.id === selectedCategory)?.[lang === 'fr' ? 'labelFr' : 'labelAr'] || selectedCategory;
    const result = await getRentalAIAnalysis(categoryLabel, dataContext, lang);
    setAnalysis(result || null);
    setLoading(false);
  };

  const currentT = {
    fr: { 
      header: "🧠 Assistant IA Stratégique", 
      sub: "Analysez vos données en temps réel avec l'IA pour obtenir des conseils actionnables et des recommandations stratégiques.", 
      cta: "Générer l'Analyse", 
      analyzing: "Analyse en cours...", 
      resultTitle: "Rapport d'Analyse Détaillée",
      insights: "Informations Clés"
    },
    ar: { 
      header: "🧠 مساعد الذكاء الاصطناعي", 
      sub: "قم بتحليل بياناتك في الوقت الفعلي باستخدام الذكاء الاصطناعي للحصول على نصائح قابلة للتنفيذ والتوصيات الاستراتيجية.", 
      cta: "توليد التحليل", 
      analyzing: "جاري التحليل...", 
      resultTitle: "تقرير التحليل التفصيلي",
      insights: "المعلومات الرئيسية"
    }
  }[lang];

  return (
    <div className={`p-4 sm:p-8 animate-fade-in ${isRtl ? 'font-arabic text-right' : ''}`}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className={`flex items-center gap-6 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-5xl">🧠</div>
          <div className={isRtl ? 'text-right' : ''}>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">{currentT.header}</h1>
            <p className="text-gray-400 font-bold mt-2 text-lg">{currentT.sub}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Quick Insights Cards */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100">
              <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">{lang === 'fr' ? 'Chiffre d\'affaires' : 'الإيرادات'}</p>
              <p className="text-2xl font-black text-green-700">{insights.revenue.total.toLocaleString()}</p>
              <p className="text-xs text-green-500 mt-2 font-bold">DZ</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-3xl border border-blue-100">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">{lang === 'fr' ? 'Utilis. Flotte' : 'استخدام الأسطول'}</p>
              <p className="text-2xl font-black text-blue-700">{insights.fleet.utilization}%</p>
              <p className="text-xs text-blue-500 mt-2 font-bold">{insights.fleet.active}/{insights.fleet.total}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-3xl border border-purple-100">
              <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2">{lang === 'fr' ? 'Retention' : 'الاحتفاظ'}</p>
              <p className="text-2xl font-black text-purple-700">{insights.customers.retention}%</p>
              <p className="text-xs text-purple-500 mt-2 font-bold">{insights.customers.repeat} {lang === 'fr' ? 'clients' : 'عملاء'}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-3xl border border-orange-100">
              <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">{lang === 'fr' ? 'Marge' : 'الهامش'}</p>
              <p className="text-2xl font-black text-orange-700">{insights.profit.margin}%</p>
              <p className="text-xs text-orange-500 mt-2 font-bold">{lang === 'fr' ? 'Rentabilité' : 'الربحية'}</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 p-6 rounded-3xl border border-indigo-100">
              <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2">{lang === 'fr' ? 'Réservations' : 'الحجوزات'}</p>
              <p className="text-2xl font-black text-indigo-700">{insights.reservations.total}</p>
              <p className="text-xs text-indigo-500 mt-2 font-bold">{insights.reservations.completed} {lang === 'fr' ? 'complétées' : 'مكتملة'}</p>
            </div>
          </div>
        )}

        {/* Category Selection */}
        <div className="space-y-4">
          <p className="text-sm font-black text-gray-600 uppercase tracking-widest">{lang === 'fr' ? 'Sélectionnez un domaine' : 'اختر مجالاً'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id as AnalysisCategory)} 
                className={`relative p-6 rounded-[2.5rem] border-2 transition-all duration-500 text-left group ${
                  selectedCategory === cat.id 
                    ? 'bg-white border-blue-600 shadow-2xl scale-105' 
                    : 'bg-white border-gray-100 hover:border-blue-300 hover:shadow-lg'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-3 shadow-inner ${cat.color} group-hover:scale-110 transition-transform`}>{cat.icon}</div>
                <h3 className="text-sm font-black text-gray-900 leading-tight">{lang === 'fr' ? cat.labelFr : cat.labelAr}</h3>
                <p className="text-xs text-gray-400 font-bold mt-2 leading-tight">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center py-8">
          <GradientButton 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="!px-20 !py-6 text-xl rounded-[2.5rem] shadow-2xl"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                {currentT.analyzing}
              </div>
            ) : (
              `✨ ${currentT.cta}`
            )}
          </GradientButton>
        </div>

        {/* Analysis Result */}
        {analysis && (
          <div className="bg-white rounded-[3.5rem] shadow-lg border border-gray-200 p-8 sm:p-14 animate-fade-in relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -mr-48 -mt-48 pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">📋</div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase">{currentT.resultTitle}</h2>
                  <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest">{lang === 'fr' ? 'Powered by Google Gemini AI' : 'مدعوم بـ Google Gemini AI'}</p>
                </div>
              </div>
              
              <div className="space-y-4 border-t border-gray-100 pt-8">
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-wrap font-medium text-base text-gray-700 leading-relaxed space-y-4 bg-gradient-to-br from-gray-50 to-gray-100/50 p-10 rounded-[2rem] border border-gray-100">
                    {analysis.split('\n').map((line, idx) => (
                      line.trim() && (
                        <p key={idx} className={`${
                          line.startsWith('•') || line.startsWith('-') ? 'ml-4 text-gray-600' : 
                          line.match(/^\\d+\\.|^[A-Z]/) && line.includes(':') ? 'font-bold text-lg text-gray-900 mt-4 mb-2' :
                          'text-gray-700'
                        }`}>
                          {line}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => {
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(analysis));
                    element.setAttribute('download', `analyse-ia-${new Date().toISOString().split('T')[0]}.txt`);
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg"
                >
                  💾 {lang === 'fr' ? 'Télécharger le rapport' : 'تحميل التقرير'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalysisPage;
