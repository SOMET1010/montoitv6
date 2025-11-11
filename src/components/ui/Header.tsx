import { Home, Search, User, LogOut, Building2, Sparkles, MessageCircle, Calendar, FileText, Heart, Bell, Key, Award, Wrench, Users, BarChart, ChevronDown, Settings, Menu, X, Shield, Database, Activity, Cog, TestTube, Zap, UserCheck, CheckCircle, FileCheck, CreditCard, Plus, FolderOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessageNotifications } from '../../hooks/useMessageNotifications';
import { useLocation } from 'react-router-dom';
import CertificationReminder from '../CertificationReminder';
import LanguageSelector from './LanguageSelector';
import RoleSwitcher from './RoleSwitcher';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useMessageNotifications();
  const location = useLocation();
  const [verificationStatus, setVerificationStatus] = useState({
    oneciVerified: false,
    faceVerified: false,
    ansutCertified: false
  });
  
  // États pour les sous-menus réorganisés
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAgencyMenu, setShowAgencyMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showTrustAgentMenu, setShowTrustAgentMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const hoverTimeouts = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  const clearHoverTimeout = (menu: string) => {
    if (hoverTimeouts.current[menu]) {
      clearTimeout(hoverTimeouts.current[menu]!);
      hoverTimeouts.current[menu] = null;
    }
  };

  const handleMenuEnter = (menu: string, setter: (value: boolean) => void) => {
    clearHoverTimeout(menu);
    setter(true);
  };

  const handleMenuLeave = (menu: string, setter: (value: boolean) => void) => {
    clearHoverTimeout(menu);
    hoverTimeouts.current[menu] = setTimeout(() => {
      setter(false);
      hoverTimeouts.current[menu] = null;
    }, 150);
  };

  // Fonction pour vérifier si un lien est actif
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  useEffect(() => {
    if (user && profile) {
      loadVerificationStatus();
    }
  }, [user, profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAccountMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(hoverTimeouts.current).forEach((timeoutId) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, []);

  const loadVerificationStatus = async () => {
    try {
      const { data } = await supabase
        .from('user_verifications')
        .select('oneci_status, face_verification_status, ansut_certified')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (data) {
        setVerificationStatus({
          oneciVerified: data.oneci_status === 'verifie',
          faceVerified: data.face_verification_status === 'verifie',
          ansutCertified: data.ansut_certified || false
        });
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  return (
    <>
      {user && profile && (
        <CertificationReminder
          userType={profile.user_type}
          oneciVerified={verificationStatus.oneciVerified}
          faceVerified={verificationStatus.faceVerified}
          ansutCertified={verificationStatus.ansutCertified}
        />
      )}
      <header className="bg-white/80 backdrop-blur-xl shadow-lg border-b-2 border-terracotta-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <a href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Building2 className="h-10 w-10 text-terracotta-600 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gradient">Mon Toit</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-gradient-to-r from-olive-100 to-olive-200 text-olive-800 px-2 py-0.5 rounded-full font-bold">
                  ANSUT Certifié
                </span>
              </div>
            </div>
          </a>

          <nav className="hidden md:flex flex-1 min-w-0 items-center space-x-1 overflow-x-auto overflow-y-visible lg:overflow-visible relative z-40">
            {/* Navigation principale - toujours visible */}
            <a
              href="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 ${
                isActive('/')
                  ? 'bg-gradient-to-r from-terracotta-500 to-coral-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-terracotta-50 hover:to-coral-50 hover:text-terracotta-700'
              }`}
            >
              <Home className="h-5 w-5" />
              <span>Accueil</span>
            </a>
            
            <a
              href="/recherche"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 ${
                isActive('/recherche')
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-cyan-100 hover:text-cyan-700'
              }`}
            >
              <Search className="h-5 w-5" />
              <span>Rechercher</span>
            </a>

            {user && (
              <>
                {/* Menu Propriétés et Services */}
                <div className="relative">
                  <button
                    onMouseEnter={() => handleMenuEnter('property', setShowPropertyMenu)}
                    onMouseLeave={() => handleMenuLeave('property', setShowPropertyMenu)}
                    onClick={() => setShowPropertyMenu((prev) => !prev)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 ${
                      isActive('/favoris') || isActive('/mes-visites') || isActive('/mes-contrats')
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700'
                    }`}
                  >
                    <FolderOpen className="h-5 w-5" />
                    <span>Propriétés</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showPropertyMenu && (
                    <div
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border-2 border-purple-100 py-2 z-[60]"
                      onMouseEnter={() => handleMenuEnter('property', setShowPropertyMenu)}
                      onMouseLeave={() => handleMenuLeave('property', setShowPropertyMenu)}
                    >
                      <div className="px-4 py-2 border-b border-purple-100">
                        <p className="text-xs font-bold text-purple-600 uppercase">Immobilier</p>
                      </div>
                      <a href="/favoris" className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 font-medium">
                        <Heart className="h-4 w-4 mr-3 text-red-500" />
                        Mes favoris
                      </a>
                      <a href="/mes-visites" className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 font-medium">
                        <Calendar className="h-4 w-4 mr-3 text-green-500" />
                        Visites programmées
                      </a>
                      <a href="/mes-contrats" className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 font-medium">
                        <FileText className="h-4 w-4 mr-3 text-blue-500" />
                        Mes contrats
                      </a>
                      {(profile?.user_type === 'proprietaire' || profile?.user_type === 'agence') && (
                        <a href="/dashboard/ajouter-propriete" className="flex items-center px-4 py-2 text-gray-700 hover:bg-purple-50 font-medium">
                          <Building2 className="h-4 w-4 mr-3 text-orange-500" />
                          Ajouter une propriété
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Menu Services */}
                <div className="relative">
                  <button
                    onMouseEnter={() => handleMenuEnter('services', setShowServicesMenu)}
                    onMouseLeave={() => handleMenuLeave('services', setShowServicesMenu)}
                    onClick={() => setShowServicesMenu((prev) => !prev)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 ${
                      isActive('/maintenance') || isActive('/score-locataire') || isActive('/effectuer-paiement')
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700'
                    }`}
                  >
                    <Wrench className="h-5 w-5" />
                    <span>Services</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showServicesMenu && (
                    <div
                      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border-2 border-orange-100 py-2 z-[60]"
                      onMouseEnter={() => handleMenuEnter('services', setShowServicesMenu)}
                      onMouseLeave={() => handleMenuLeave('services', setShowServicesMenu)}
                    >
                      <div className="px-4 py-2 border-b border-orange-100">
                        <p className="text-xs font-bold text-orange-600 uppercase">Services</p>
                      </div>
                      
                      {(profile?.user_type === 'locataire' || profile?.user_type === 'proprietaire') && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500">Maintenance</p>
                          </div>
                          {profile?.user_type === 'locataire' && (
                            <>
                              <a href="/maintenance/locataire" className="flex items-center px-4 py-2 text-gray-700 hover:bg-orange-50 font-medium">
                                <Wrench className="h-4 w-4 mr-3 text-red-500" />
                                Mes demandes
                              </a>
                              <a href="/maintenance/nouvelle" className="flex items-center px-4 py-2 text-gray-700 hover:bg-orange-50 font-medium">
                                <Plus className="h-4 w-4 mr-3 text-green-500" />
                                Nouvelle demande
                              </a>
                            </>
                          )}
                          {profile?.user_type === 'proprietaire' && (
                            <a href="/maintenance/proprietaire" className="flex items-center px-4 py-2 text-gray-700 hover:bg-orange-50 font-medium">
                              <Settings className="h-4 w-4 mr-3 text-blue-500" />
                              Gérer les demandes
                            </a>
                          )}
                        </>
                      )}
                      
                      {profile?.user_type === 'locataire' && (
                        <>
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500">Locataire</p>
                          </div>
                          <a href="/score-locataire" className="flex items-center px-4 py-2 text-gray-700 hover:bg-orange-50 font-medium">
                            <Award className="h-4 w-4 mr-3 text-yellow-500" />
                            Mon score locataire
                          </a>
                          <a href="/effectuer-paiement" className="flex items-center px-4 py-2 text-gray-700 hover:bg-orange-50 font-medium">
                            <CreditCard className="h-4 w-4 mr-3 text-green-500" />
                            Payer un loyer
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Messages avec compteur */}
                <a
                  href="/messages"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 relative ${
                    isActive('/messages')
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700'
                  }`}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </a>

                {/* Menu Agence */}
                {profile?.user_type === 'agence' && (
                  <div className="relative">
                    <button
                      onMouseEnter={() => handleMenuEnter('agency', setShowAgencyMenu)}
                      onMouseLeave={() => handleMenuLeave('agency', setShowAgencyMenu)}
                      onClick={() => setShowAgencyMenu((prev) => !prev)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 border-2 ${
                        isActive('/agence')
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg border-teal-300'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 border-teal-200'
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Agence</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showAgencyMenu && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border-2 border-teal-100 py-2 z-[60]"
                        onMouseEnter={() => handleMenuEnter('agency', setShowAgencyMenu)}
                        onMouseLeave={() => handleMenuLeave('agency', setShowAgencyMenu)}
                      >
                        <div className="px-4 py-2 border-b border-teal-100">
                          <p className="text-xs font-bold text-teal-600 uppercase">Espace Agence</p>
                        </div>
                        <a href="/agence/tableau-de-bord" className="flex items-center px-4 py-2 text-gray-700 hover:bg-teal-50 font-medium">
                          <BarChart className="h-4 w-4 mr-3 text-blue-500" />
                          Tableau de bord
                        </a>
                        <a href="/agence/equipe" className="flex items-center px-4 py-2 text-gray-700 hover:bg-teal-50 font-medium">
                          <Users className="h-4 w-4 mr-3 text-green-500" />
                          Mon équipe
                        </a>
                        <a href="/agence/proprietes" className="flex items-center px-4 py-2 text-gray-700 hover:bg-teal-50 font-medium">
                          <Building2 className="h-4 w-4 mr-3 text-orange-500" />
                          Propriétés
                        </a>
                        <a href="/agence/commissions" className="flex items-center px-4 py-2 text-gray-700 hover:bg-teal-50 font-medium">
                          <TrendingUp className="h-4 w-4 mr-3 text-purple-500" />
                          Commissions
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Menu Admin */}
                {(profile?.user_type === 'admin_ansut' || profile?.available_roles?.includes('admin')) && (
                  <div className="relative">
                    <button
                      onMouseEnter={() => handleMenuEnter('admin', setShowAdminMenu)}
                      onMouseLeave={() => handleMenuLeave('admin', setShowAdminMenu)}
                      onClick={() => setShowAdminMenu((prev) => !prev)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 border-2 ${
                        isActive('/admin')
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg border-red-300'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 border-red-200'
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                      <span>Admin</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showAdminMenu && (
                      <div
                        className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border-2 border-red-100 py-2 z-[60] max-h-96 overflow-y-auto"
                        onMouseEnter={() => handleMenuEnter('admin', setShowAdminMenu)}
                        onMouseLeave={() => handleMenuLeave('admin', setShowAdminMenu)}
                      >
                        <div className="px-4 py-2 border-b border-red-100">
                          <p className="text-xs font-bold text-red-600 uppercase">Administration ANSUT</p>
                        </div>
                        
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500">Gestion principale</p>
                        </div>
                        <a href="/admin/tableau-de-bord" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <BarChart className="h-4 w-4 mr-3 text-blue-500" />
                          Dashboard Principal
                        </a>
                        <a href="/admin/utilisateurs" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Users className="h-4 w-4 mr-3 text-green-500" />
                          Gestion Utilisateurs
                        </a>
                        <a href="/admin/gestion-roles" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Shield className="h-4 w-4 mr-3 text-purple-500" />
                          Attribuer des Rôles
                        </a>
                        <a href="/admin/trust-agents" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <UserCheck className="h-4 w-4 mr-3 text-orange-500" />
                          Agents de Confiance
                        </a>

                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500">Services techniques</p>
                        </div>
                        <a href="/admin/api-keys" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Key className="h-4 w-4 mr-3 text-yellow-500" />
                          Clés API
                        </a>
                        <a href="/admin/service-providers" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Database className="h-4 w-4 mr-3 text-indigo-500" />
                          Fournisseurs Services
                        </a>
                        <a href="/admin/service-monitoring" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Activity className="h-4 w-4 mr-3 text-red-500" />
                          Monitoring Services
                        </a>
                        <a href="/admin/service-configuration" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Cog className="h-4 w-4 mr-3 text-gray-500" />
                          Configuration
                        </a>

                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500">Vérifications</p>
                        </div>
                        <a href="/admin/cev-management" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <FileCheck className="h-4 w-4 mr-3 text-teal-500" />
                          CEV/ONECI
                        </a>
                        <a href="/ansut-verification" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                          ANSUT Certifications
                        </a>

                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500">Outils de test</p>
                        </div>
                        <a href="/admin/demo-rapide" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <Zap className="h-4 w-4 mr-3 text-yellow-500" />
                          Démo Rapide
                        </a>
                        <a href="/admin/test-data-generator" className="flex items-center px-4 py-2 text-gray-700 hover:bg-red-50 font-medium">
                          <TestTube className="h-4 w-4 mr-3 text-purple-500" />
                          Générateur de Données
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Menu Trust Agent */}
                {profile?.available_roles?.includes('trust_agent') && (
                  <div className="relative">
                    <button
                      onMouseEnter={() => handleMenuEnter('trustAgent', setShowTrustAgentMenu)}
                      onMouseLeave={() => handleMenuLeave('trustAgent', setShowTrustAgentMenu)}
                      onClick={() => setShowTrustAgentMenu((prev) => !prev)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold transform hover:scale-105 border-2 ${
                        isActive('/trust-agent')
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg border-green-300'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 border-green-200'
                      }`}
                    >
                      <UserCheck className="h-5 w-5" />
                      <span>Trust Agent</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showTrustAgentMenu && (
                      <div
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-green-100 py-2 z-[60]"
                        onMouseEnter={() => handleMenuEnter('trustAgent', setShowTrustAgentMenu)}
                        onMouseLeave={() => handleMenuLeave('trustAgent', setShowTrustAgentMenu)}
                      >
                        <div className="px-4 py-2 border-b border-green-100">
                          <p className="text-xs font-bold text-green-600 uppercase">Espace Trust Agent</p>
                        </div>
                        <a href="/trust-agent/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 font-medium">
                          <BarChart className="h-4 w-4 mr-3 text-blue-500" />
                          Dashboard Agent
                        </a>
                        <a href="/trust-agent/moderation" className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 font-medium">
                          <Shield className="h-4 w-4 mr-3 text-purple-500" />
                          Modération
                        </a>
                        <a href="/trust-agent/mediation" className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 font-medium">
                          <Users className="h-4 w-4 mr-3 text-orange-500" />
                          Médiation
                        </a>
                        <a href="/trust-agent/analytics" className="flex items-center px-4 py-2 text-gray-700 hover:bg-green-50 font-medium">
                          <Activity className="h-4 w-4 mr-3 text-red-500" />
                          Analytiques
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden lg:block">
                  <RoleSwitcher />
                </div>
                <div className="hidden md:block relative" ref={accountMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowAccountMenu((prev) => !prev)}
                    className="flex items-center space-x-3 bg-gradient-to-r from-amber-50 to-coral-50 px-4 py-2 rounded-2xl shadow-inner border border-amber-100 hover:shadow-lg transition-all duration-300"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar utilisateur"
                        className="h-10 w-10 rounded-full border-2 border-terracotta-300 shadow-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-terracotta-500 to-coral-500 flex items-center justify-center text-white font-bold text-lg shadow-glow">
                        {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 leading-tight">
                        {profile?.full_name || 'Utilisateur'}
                      </p>
                      <span className="text-xs text-gray-500">Mon compte</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showAccountMenu && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-amber-50 to-coral-50 border-b border-gray-100">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Avatar utilisateur"
                            className="h-12 w-12 rounded-full border-2 border-white shadow"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-terracotta-500 to-coral-500 flex items-center justify-center text-white font-bold text-xl shadow-glow">
                            {profile?.full_name?.[0] || user?.email?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-base font-semibold text-gray-900">{profile?.full_name || 'Utilisateur'}</p>
                          <p className="text-xs text-gray-600">{profile?.email || user?.email}</p>
                        </div>
                      </div>

                      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/60">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mon compte</p>
                      </div>
                      <a
                        href="/profil"
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                      >
                        <User className="h-4 w-4 mr-3 text-blue-500" />
                        Mon profil
                      </a>
                      <a
                        href="/notifications/preferences"
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                      >
                        <Bell className="h-4 w-4 mr-3 text-orange-500" />
                        Préférences de notification
                      </a>

                      <div className="px-4 py-2 border-y border-gray-100 bg-gray-50/60">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Mon espace</p>
                      </div>
                      <a
                        href="/recherches-sauvegardees"
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                      >
                        <Search className="h-4 w-4 mr-3 text-purple-500" />
                        Recherches sauvegardées
                      </a>
                      <a
                        href="/mes-certificats"
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                      >
                        <Award className="h-4 w-4 mr-3 text-yellow-500" />
                        Mes certificats
                      </a>

                      <div className="px-4 py-3 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Langue</p>
                        <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1">
                          <LanguageSelector />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 font-semibold hover:bg-red-50 border-t border-gray-100 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <>
                <a
                  href="/connexion"
                  className="text-terracotta-600 hover:text-terracotta-700 font-bold transition-colors transform hover:scale-105 transition-all duration-300"
                >
                  Connexion
                </a>
                <a
                  href="/inscription"
                  className="btn-primary"
                >
                  Inscription
                </a>
                <div className="hidden md:block">
                  <LanguageSelector />
                </div>
              </>
            )}
          </div>
        </div>

        {showMobileMenu && user && (
          <div className="md:hidden border-t border-gray-200 py-4 px-4 bg-white max-h-96 overflow-y-auto">
            <div className="mb-4">
              <RoleSwitcher />
            </div>
            
            {/* Navigation principale mobile */}
            <div className="space-y-1">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-bold text-terracotta-600 uppercase">Navigation principale</p>
              </div>
              
              <a 
                href="/" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive('/') ? 'bg-gradient-to-r from-terracotta-50 to-coral-50 text-terracotta-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Home className="h-5 w-5 mr-3" />
                Accueil
              </a>
              
              <a 
                href="/recherche" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive('/recherche') ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Search className="h-5 w-5 mr-3" />
                Rechercher
              </a>
              
              <a 
                href="/messages" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors relative ${
                  isActive('/messages') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <MessageCircle className="h-5 w-5 mr-3" />
                Messages
                {unreadCount > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
            </div>

            {/* Section Propriétés */}
            <div className="space-y-1 mt-4">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-bold text-purple-600 uppercase">Propriétés</p>
              </div>
              
              <a 
                href="/favoris" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive('/favoris') ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Heart className="h-5 w-5 mr-3 text-red-500" />
                Mes favoris
              </a>
              
              <a 
                href="/mes-visites" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive('/mes-visites') ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Calendar className="h-5 w-5 mr-3 text-green-500" />
                Visites programmées
              </a>
              
              <a 
                href="/mes-contrats" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive('/mes-contrats') ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <FileText className="h-5 w-5 mr-3 text-blue-500" />
                Mes contrats
              </a>
              
              {(profile?.user_type === 'proprietaire' || profile?.user_type === 'agence') && (
                <a 
                  href="/dashboard/ajouter-propriete" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Plus className="h-5 w-5 mr-3 text-orange-500" />
                  Ajouter une propriété
                </a>
              )}
            </div>

            {/* Section Services */}
            {(profile?.user_type === 'locataire' || profile?.user_type === 'proprietaire') && (
              <div className="space-y-1 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-bold text-orange-600 uppercase">Services</p>
                </div>
                
                {profile?.user_type === 'locataire' && (
                  <>
                    <a 
                      href="/maintenance/locataire" 
                      className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <Wrench className="h-5 w-5 mr-3 text-red-500" />
                      Mes demandes de maintenance
                    </a>
                    <a 
                      href="/maintenance/nouvelle" 
                      className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <Plus className="h-5 w-5 mr-3 text-green-500" />
                      Nouvelle demande
                    </a>
                    <a 
                      href="/score-locataire" 
                      className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                        isActive('/score-locataire') ? 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Award className="h-5 w-5 mr-3 text-yellow-500" />
                      Mon score locataire
                    </a>
                    <a 
                      href="/effectuer-paiement" 
                      className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                    >
                      <CreditCard className="h-5 w-5 mr-3 text-green-500" />
                      Payer un loyer
                    </a>
                  </>
                )}
                
                {profile?.user_type === 'proprietaire' && (
                  <a 
                    href="/maintenance/proprietaire" 
                    className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                  >
                    <Settings className="h-5 w-5 mr-3 text-blue-500" />
                    Gérer les demandes
                  </a>
                )}
              </div>
            )}

            {/* Section Agence */}
            {profile?.user_type === 'agence' && (
              <div className="space-y-1 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-bold text-teal-600 uppercase">Espace Agence</p>
                </div>
                
                <a 
                  href="/agence/tableau-de-bord" 
                  className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                    isActive('/agence') ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <BarChart className="h-5 w-5 mr-3 text-blue-500" />
                  Tableau de bord
                </a>
                
                <a 
                  href="/agence/equipe" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Users className="h-5 w-5 mr-3 text-green-500" />
                  Mon équipe
                </a>
                
                <a 
                  href="/agence/proprietes" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Building2 className="h-5 w-5 mr-3 text-orange-500" />
                  Propriétés
                </a>
                
                <a 
                  href="/agence/commissions" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <TrendingUp className="h-5 w-5 mr-3 text-purple-500" />
                  Commissions
                </a>
              </div>
            )}

            {/* Section Admin */}
            {(profile?.user_type === 'admin_ansut' || profile?.available_roles?.includes('admin')) && (
              <div className="space-y-1 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-bold text-red-600 uppercase">Administration ANSUT</p>
                </div>
                
                <a 
                  href="/admin/tableau-de-bord" 
                  className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                    isActive('/admin') ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <BarChart className="h-5 w-5 mr-3 text-blue-500" />
                  Dashboard Principal
                </a>
                
                <a 
                  href="/admin/utilisateurs" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Users className="h-5 w-5 mr-3 text-green-500" />
                  Gestion Utilisateurs
                </a>
                
                <a 
                  href="/admin/gestion-roles" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Shield className="h-5 w-5 mr-3 text-purple-500" />
                  Attribuer des Rôles
                </a>
                
                <a 
                  href="/admin/api-keys" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Key className="h-5 w-5 mr-3 text-yellow-500" />
                  Clés API
                </a>
                
                <a 
                  href="/admin/service-monitoring" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Activity className="h-5 w-5 mr-3 text-red-500" />
                  Monitoring Services
                </a>
                
                <a 
                  href="/admin/cev-management" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <FileCheck className="h-5 w-5 mr-3 text-teal-500" />
                  CEV/ONECI
                </a>
              </div>
            )}

            {/* Section Trust Agent */}
            {profile?.available_roles?.includes('trust_agent') && (
              <div className="space-y-1 mt-4">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-bold text-green-600 uppercase">Espace Trust Agent</p>
                </div>
                
                <a 
                  href="/trust-agent/dashboard" 
                  className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                    isActive('/trust-agent') ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <BarChart className="h-5 w-5 mr-3 text-blue-500" />
                  Dashboard Agent
                </a>
                
                <a 
                  href="/trust-agent/moderation" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Shield className="h-5 w-5 mr-3 text-purple-500" />
                  Modération
                </a>
                
                <a 
                  href="/trust-agent/mediation" 
                  className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
                >
                  <Users className="h-5 w-5 mr-3 text-orange-500" />
                  Médiation
                </a>
              </div>
            )}

            {/* Section Mon Compte */}
            <div className="space-y-1 mt-4">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-bold text-green-600 uppercase">Mon compte</p>
              </div>
              
              <a 
                href="/profil" 
                className={`flex items-center py-3 px-4 rounded-lg font-medium transition-colors ${
                  isActive('/profil') ? 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <User className="h-5 w-5 mr-3 text-blue-500" />
                Mon profil
              </a>
              
              <a 
                href="/recherches-sauvegardees" 
                className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
              >
                <Search className="h-5 w-5 mr-3 text-purple-500" />
                Recherches sauvegardées
              </a>
              
              <a 
                href="/notifications/preferences" 
                className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
              >
                <Bell className="h-5 w-5 mr-3 text-orange-500" />
                Préférences de notification
              </a>
              
              <a 
                href="/mes-certificats" 
                className="flex items-center py-3 px-4 rounded-lg font-medium transition-colors hover:bg-gray-50 text-gray-700"
              >
                <Award className="h-5 w-5 mr-3 text-yellow-500" />
                Mes certificats
              </a>
            </div>

            {/* Infos utilisateur et déconnexion */}
            <div className="border-t border-gray-200 mt-6 pt-4">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg mb-3">
                <p className="text-sm font-bold text-gray-800">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-xs text-gray-600">{profile?.email}</p>
                <p className="text-xs text-terracotta-600 font-semibold mt-1">
                  {profile?.user_type === 'locataire' && '🏠 Locataire'}
                  {profile?.user_type === 'proprietaire' && '🔑 Propriétaire'}
                  {profile?.user_type === 'agence' && '🏢 Agence'}
                  {profile?.user_type === 'admin_ansut' && '🛡️ Admin ANSUT'}
                </p>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 rounded-lg mb-3">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Langue</p>
                <LanguageSelector />
              </div>
              
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  signOut();
                }}
                className="w-full flex items-center py-3 px-4 rounded-lg hover:bg-red-50 text-red-600 font-medium transition-colors"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
}
