import { Home, Search, User, LogOut, Building2, Sparkles, MessageCircle, Calendar, FileText, Heart, Bell, Key, Award, Wrench, Users, BarChart, ChevronDown, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMessageNotifications } from '../hooks/useMessageNotifications';
import CertificationReminder from './CertificationReminder';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useMessageNotifications();
  const [verificationStatus, setVerificationStatus] = useState({
    oneciVerified: false,
    faceVerified: false,
    ansutCertified: false
  });
  const [showMaintenanceMenu, setShowMaintenanceMenu] = useState(false);
  const [showAgencyMenu, setShowAgencyMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    if (user && profile) {
      loadVerificationStatus();
    }
  }, [user, profile]);

  const loadVerificationStatus = async () => {
    try {
      const { data } = await supabase
        .from('user_verifications')
        .select('oneci_status, face_verification_status, ansut_certified')
        .eq('user_id', user?.id)
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
              <span className="text-3xl font-bold text-gradient">Mon Toit</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-gradient-to-r from-olive-100 to-olive-200 text-olive-800 px-2 py-0.5 rounded-full font-bold">
                  ANSUT Certifié
                </span>
              </div>
            </div>
          </a>

          <nav className="hidden md:flex items-center space-x-2">
            <a
              href="/"
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-terracotta-50 hover:to-coral-50 hover:text-terracotta-700 transition-all duration-300 font-semibold transform hover:scale-105"
            >
              <Home className="h-5 w-5" />
              <span>Accueil</span>
            </a>
            <a
              href="/recherche"
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-cyan-100 hover:text-cyan-700 transition-all duration-300 font-semibold transform hover:scale-105"
            >
              <Search className="h-5 w-5" />
              <span>Rechercher</span>
            </a>
            {user && (
              <>
                <a
                  href="/messages"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-300 font-semibold transform hover:scale-105 relative"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </a>
                <a
                  href="/mes-visites"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 transition-all duration-300 font-semibold transform hover:scale-105"
                >
                  <Calendar className="h-5 w-5" />
                  <span>Mes visites</span>
                </a>
                <a
                  href="/favoris"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 transition-all duration-300 font-semibold transform hover:scale-105"
                >
                  <Heart className="h-5 w-5" />
                  <span>Favoris</span>
                </a>
                <div className="relative" onMouseLeave={() => setShowNotifMenu(false)}>
                  <button
                    onMouseEnter={() => setShowNotifMenu(true)}
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 hover:text-orange-700 transition-all duration-300 font-semibold transform hover:scale-105"
                  >
                    <Bell className="h-5 w-5" />
                    <span>Alertes</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showNotifMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 py-2 z-50">
                      <a href="/recherches-sauvegardees" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                        Mes recherches sauvegardées
                      </a>
                      <a href="/notifications/preferences" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                        <Settings className="h-4 w-4 inline mr-2" />
                        Préférences
                      </a>
                    </div>
                  )}
                </div>
                <a
                  href="/mes-contrats"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 transition-all duration-300 font-semibold transform hover:scale-105"
                >
                  <FileText className="h-5 w-5" />
                  <span>Contrats</span>
                </a>

                {(profile?.user_type === 'locataire' || profile?.user_type === 'proprietaire') && (
                  <div className="relative" onMouseLeave={() => setShowMaintenanceMenu(false)}>
                    <button
                      onMouseEnter={() => setShowMaintenanceMenu(true)}
                      onClick={() => setShowMaintenanceMenu(!showMaintenanceMenu)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-700 transition-all duration-300 font-semibold transform hover:scale-105"
                    >
                      <Wrench className="h-5 w-5" />
                      <span>Maintenance</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showMaintenanceMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 py-2 z-50">
                        {profile?.user_type === 'locataire' && (
                          <>
                            <a href="/maintenance/locataire" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                              Mes demandes
                            </a>
                            <a href="/maintenance/nouvelle" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                              Nouvelle demande
                            </a>
                          </>
                        )}
                        {profile?.user_type === 'proprietaire' && (
                          <a href="/maintenance/proprietaire" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                            Gérer les demandes
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {profile?.user_type === 'locataire' && (
                  <a
                    href="/score-locataire"
                    className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-100 hover:text-yellow-700 transition-all duration-300 font-semibold transform hover:scale-105"
                  >
                    <Award className="h-5 w-5" />
                    <span>Mon Score</span>
                  </a>
                )}

                {profile?.user_type === 'agence' && (
                  <div className="relative" onMouseLeave={() => setShowAgencyMenu(false)}>
                    <button
                      onMouseEnter={() => setShowAgencyMenu(true)}
                      onClick={() => setShowAgencyMenu(!showAgencyMenu)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 transition-all duration-300 font-semibold transform hover:scale-105"
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Agence</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showAgencyMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 py-2 z-50">
                        <a href="/agence/tableau-de-bord" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <BarChart className="h-4 w-4 inline mr-2" />
                          Tableau de bord
                        </a>
                        <a href="/agence/equipe" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <Users className="h-4 w-4 inline mr-2" />
                          Mon équipe
                        </a>
                        <a href="/agence/proprietes" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <Building2 className="h-4 w-4 inline mr-2" />
                          Propriétés
                        </a>
                        <a href="/agence/commissions" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <FileText className="h-4 w-4 inline mr-2" />
                          Commissions
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <a
                  href="/profil"
                  className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 hover:text-amber-700 transition-all duration-300 font-semibold transform hover:scale-105"
                >
                  <User className="h-5 w-5" />
                  <span>Profil</span>
                </a>

                {profile?.user_type === 'admin_ansut' && (
                  <div className="relative" onMouseLeave={() => setShowAdminMenu(false)}>
                    <button
                      onMouseEnter={() => setShowAdminMenu(true)}
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-300 font-semibold transform hover:scale-105 border-2 border-blue-200"
                    >
                      <Key className="h-5 w-5" />
                      <span>Admin</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {showAdminMenu && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 py-2 z-50">
                        <a href="/admin/tableau-de-bord" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <BarChart className="h-4 w-4 inline mr-2" />
                          Dashboard
                        </a>
                        <a href="/admin/utilisateurs" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <Users className="h-4 w-4 inline mr-2" />
                          Utilisateurs
                        </a>
                        <a href="/admin/api-keys" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium">
                          <Key className="h-4 w-4 inline mr-2" />
                          API Keys
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
                <div className="hidden md:flex items-center space-x-3 bg-gradient-to-r from-amber-50 to-coral-50 px-4 py-2 rounded-2xl">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="h-10 w-10 rounded-full border-2 border-terracotta-300 shadow-md"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-terracotta-500 to-coral-500 flex items-center justify-center text-white font-bold text-lg shadow-glow">
                      {profile?.full_name?.[0] || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-bold text-gray-800">
                    {profile?.full_name || 'Utilisateur'}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-2xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-300 font-semibold transform hover:scale-105"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Déconnexion</span>
                </button>
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
              </>
            )}
          </div>
        </div>

        {showMobileMenu && user && (
          <div className="md:hidden border-t border-gray-200 py-4 px-4 bg-white">
            <div className="space-y-2">
              <a href="/" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <Home className="h-4 w-4 inline mr-2" />
                Accueil
              </a>
              <a href="/recherche" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <Search className="h-4 w-4 inline mr-2" />
                Rechercher
              </a>
              <a href="/messages" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium relative">
                <MessageCircle className="h-4 w-4 inline mr-2" />
                Messages
                {unreadCount > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
              <a href="/mes-visites" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <Calendar className="h-4 w-4 inline mr-2" />
                Mes visites
              </a>
              <a href="/favoris" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <Heart className="h-4 w-4 inline mr-2" />
                Favoris
              </a>
              <a href="/mes-contrats" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <FileText className="h-4 w-4 inline mr-2" />
                Contrats
              </a>

              {profile?.user_type === 'locataire' && (
                <>
                  <a href="/score-locataire" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <Award className="h-4 w-4 inline mr-2" />
                    Mon Score
                  </a>
                  <a href="/maintenance/locataire" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <Wrench className="h-4 w-4 inline mr-2" />
                    Mes demandes
                  </a>
                </>
              )}

              {profile?.user_type === 'proprietaire' && (
                <a href="/maintenance/proprietaire" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                  <Wrench className="h-4 w-4 inline mr-2" />
                  Demandes de maintenance
                </a>
              )}

              {profile?.user_type === 'agence' && (
                <>
                  <a href="/agence/tableau-de-bord" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <BarChart className="h-4 w-4 inline mr-2" />
                    Tableau de bord
                  </a>
                  <a href="/agence/equipe" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <Users className="h-4 w-4 inline mr-2" />
                    Mon équipe
                  </a>
                  <a href="/agence/proprietes" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    Propriétés
                  </a>
                </>
              )}

              {profile?.user_type === 'admin_ansut' && (
                <>
                  <a href="/admin/tableau-de-bord" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <BarChart className="h-4 w-4 inline mr-2" />
                    Admin Dashboard
                  </a>
                  <a href="/admin/utilisateurs" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                    <Users className="h-4 w-4 inline mr-2" />
                    Utilisateurs
                  </a>
                </>
              )}

              <a href="/notifications/preferences" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <Settings className="h-4 w-4 inline mr-2" />
                Préférences
              </a>
              <a href="/profil" className="block py-2 px-4 rounded-lg hover:bg-gray-50 font-medium">
                <User className="h-4 w-4 inline mr-2" />
                Profil
              </a>

              <div className="border-t border-gray-200 my-2"></div>

              <div className="py-2 px-4">
                <p className="text-sm font-bold text-gray-700 mb-1">{profile?.full_name || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  signOut();
                }}
                className="w-full text-left py-2 px-4 rounded-lg hover:bg-red-50 text-red-600 font-medium"
              >
                <LogOut className="h-4 w-4 inline mr-2" />
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
