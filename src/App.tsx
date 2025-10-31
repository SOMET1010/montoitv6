import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Auth from './pages/Auth';
import SearchProperties from './pages/SearchProperties';
import PropertyDetail from './pages/PropertyDetail';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationDetail from './pages/ApplicationDetail';
import OwnerDashboard from './pages/OwnerDashboard';
import PropertyStats from './pages/PropertyStats';
import TenantDashboard from './pages/TenantDashboard';
import TenantCalendar from './pages/TenantCalendar';
import AddProperty from './pages/AddProperty';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import ScheduleVisit from './pages/ScheduleVisit';
import MyVisits from './pages/MyVisits';
import CreateContract from './pages/CreateContract';
import MyContracts from './pages/MyContracts';
import ContractDetail from './pages/ContractDetail';
import Favorites from './pages/Favorites';
import SavedSearches from './pages/SavedSearches';
import MakePayment from './pages/MakePayment';
import PaymentHistory from './pages/PaymentHistory';
import VerificationRequest from './pages/VerificationRequest';
import AnsutVerification from './pages/AnsutVerification';
import SignLease from './pages/SignLease';
import MyCertificates from './pages/MyCertificates';
import AdminApiKeys from './pages/AdminApiKeys';
import AdminServiceProviders from './pages/AdminServiceProviders';
import AdminServiceMonitoring from './pages/AdminServiceMonitoring';
import AdminServiceConfiguration from './pages/AdminServiceConfiguration';
import AdminTestDataGenerator from './pages/AdminTestDataGenerator';
import AdminQuickDemo from './pages/AdminQuickDemo';
import AdminUserRoles from './pages/AdminUserRoles';
import TenantScore from './pages/TenantScore';
import ContractsList from './pages/ContractsList';
import AgencyDashboard from './pages/AgencyDashboard';
import AgencyTeam from './pages/AgencyTeam';
import AgencyProperties from './pages/AgencyProperties';
import AgencyCommissions from './pages/AgencyCommissions';
import AgencyRegistration from './pages/AgencyRegistration';
import NotificationPreferences from './pages/NotificationPreferences';
import TenantMaintenance from './pages/TenantMaintenance';
import OwnerMaintenance from './pages/OwnerMaintenance';
import MaintenanceRequest from './pages/MaintenanceRequest';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AuthCallback from './pages/AuthCallback';
import ContractDetailEnhanced from './pages/ContractDetailEnhanced';
import ProfileSelection from './pages/ProfileSelection';
import VerificationSettings from './pages/VerificationSettings';
import RequestCEV from './pages/RequestCEV';
import CEVRequestDetail from './pages/CEVRequestDetail';
import AdminCEVManagement from './pages/AdminCEVManagement';

function App() {
  const path = window.location.pathname;

  const renderPage = () => {
    if (path === '/connexion' || path === '/inscription') {
      return <Auth />;
    }

    if (path === '/choix-profil') {
      return <ProfileSelection />;
    }

    if (path === '/recherche') {
      return (
        <>
          <Header />
          <main>
            <SearchProperties />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/propriete/')) {
      return (
        <>
          <Header />
          <main>
            <PropertyDetail />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/candidature/')) {
      return (
        <>
          <Header />
          <main>
            <ApplicationForm />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/dashboard/candidature/')) {
      return (
        <>
          <Header />
          <main>
            <ApplicationDetail />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/dashboard/proprietaire') {
      return (
        <>
          <Header />
          <main>
            <OwnerDashboard />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/dashboard/propriete/') && path.endsWith('/stats')) {
      return (
        <>
          <Header />
          <main>
            <PropertyStats />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/dashboard/locataire') {
      return (
        <>
          <Header />
          <main>
            <TenantDashboard />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/dashboard/locataire/calendrier') {
      return (
        <>
          <Header />
          <main>
            <TenantCalendar />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/dashboard/ajouter-propriete') {
      return (
        <>
          <Header />
          <main>
            <AddProperty />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/profil') {
      return (
        <>
          <Header />
          <main>
            <Profile />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/messages') {
      return <Messages />;
    }

    if (path.startsWith('/visiter/')) {
      return <ScheduleVisit />;
    }

    if (path === '/mes-visites') {
      return <MyVisits />;
    }

    if (path.startsWith('/creer-contrat/')) {
      return <CreateContract />;
    }

    if (path === '/mes-contrats') {
      return <MyContracts />;
    }

    if (path.startsWith('/contrat/')) {
      return <ContractDetail />;
    }

    if (path === '/favoris') {
      return <Favorites />;
    }

    if (path === '/recherches-sauvegardees') {
      return <SavedSearches />;
    }

    if (path === '/effectuer-paiement') {
      return <MakePayment />;
    }

    if (path === '/mes-paiements') {
      return <PaymentHistory />;
    }

    if (path === '/verification') {
      return <VerificationRequest />;
    }

    if (path === '/certification-ansut') {
      return <AnsutVerification />;
    }

    if (path === '/verification/parametres') {
      return (
        <>
          <Header />
          <main>
            <VerificationSettings />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/signer-bail/')) {
      return <SignLease />;
    }

    if (path === '/mes-certificats') {
      return <MyCertificates />;
    }

    if (path === '/admin/api-keys') {
      return <AdminApiKeys />;
    }

    if (path === '/admin/service-providers') {
      return <AdminServiceProviders />;
    }

    if (path === '/score-locataire') {
      return (
        <>
          <Header />
          <main>
            <TenantScore />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/tous-les-contrats') {
      return (
        <>
          <Header />
          <main>
            <ContractsList />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/agence/tableau-de-bord') {
      return (
        <>
          <Header />
          <main>
            <AgencyDashboard />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/agence/equipe') {
      return (
        <>
          <Header />
          <main>
            <AgencyTeam />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/agence/proprietes') {
      return (
        <>
          <Header />
          <main>
            <AgencyProperties />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/agence/commissions') {
      return (
        <>
          <Header />
          <main>
            <AgencyCommissions />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/agence/inscription') {
      return (
        <>
          <Header />
          <main>
            <AgencyRegistration />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/notifications/preferences') {
      return (
        <>
          <Header />
          <main>
            <NotificationPreferences />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/maintenance/locataire') {
      return (
        <>
          <Header />
          <main>
            <TenantMaintenance />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/maintenance/proprietaire') {
      return (
        <>
          <Header />
          <main>
            <OwnerMaintenance />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/maintenance/nouvelle') {
      return (
        <>
          <Header />
          <main>
            <MaintenanceRequest />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/admin/tableau-de-bord') {
      return <AdminDashboard />;
    }

    if (path === '/admin/utilisateurs') {
      return <AdminUsers />;
    }

    if (path === '/admin/service-monitoring') {
      return <AdminServiceMonitoring />;
    }

    if (path === '/admin/service-configuration') {
      return <AdminServiceConfiguration />;
    }

    if (path === '/admin/test-data-generator') {
      return <AdminTestDataGenerator />;
    }

    if (path === '/admin/demo-rapide') {
      return <AdminQuickDemo />;
    }

    if (path === '/admin/gestion-roles') {
      return <AdminUserRoles />;
    }

    if (path === '/auth/callback') {
      return <AuthCallback />;
    }

    if (path.startsWith('/bail/') && path.includes('/details')) {
      return (
        <>
          <Header />
          <main>
            <ContractDetailEnhanced />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/bail/signer/')) {
      return (
        <>
          <Header />
          <main>
            <SignLease />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/request-cev' || path.startsWith('/request-cev?')) {
      return (
        <>
          <Header />
          <main>
            <RequestCEV />
          </main>
          <Footer />
        </>
      );
    }

    if (path.startsWith('/cev-request/')) {
      return (
        <>
          <Header />
          <main>
            <CEVRequestDetail />
          </main>
          <Footer />
        </>
      );
    }

    if (path === '/admin/cev-management' || path.startsWith('/admin/cev/')) {
      return <AdminCEVManagement />;
    }

    return (
      <>
        <Header />
        <main className="min-h-screen">
          <Home />
        </main>
        <Footer />
      </>
    );
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        {renderPage()}
        <Chatbot />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
