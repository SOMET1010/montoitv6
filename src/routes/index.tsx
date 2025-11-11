import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { Layout, RouterErrorBoundary } from '../components/ui';
import { ProtectedRoute } from '../components/auth';

const Home = lazy(() => import('../pages/common/Home'));
const About = lazy(() => import('../pages/common/About'));
const Terms = lazy(() => import('../pages/common/Terms'));
const Privacy = lazy(() => import('../pages/common/Privacy'));
const Legal = lazy(() => import('../pages/common/Legal'));
const Auth = lazy(() => import('../components/auth/Auth'));
const AuthCallback = lazy(() => import('../components/auth/AuthCallback'));
const ProfileSelection = lazy(() => import('../components/auth/ProfileSelection'));
const Profile = lazy(() => import('../pages/user/Profile'));
const RoleChangeRequest = lazy(() => import('../pages/user/RoleChangeRequest'));

const SearchProperties = lazy(() => import('../pages/marketplace/SearchProperties'));
const PropertyDetail = lazy(() => import('../pages/marketplace/PropertyDetail'));
const Favorites = lazy(() => import('../pages/user/Favorites'));
const SavedSearches = lazy(() => import('../pages/user/SavedSearches'));
const Recommendations = lazy(() => import('../pages/marketplace/Recommendations'));

const ApplicationForm = lazy(() => import('../pages/marketplace/ApplicationForm'));
const ApplicationDetail = lazy(() => import('../pages/marketplace/ApplicationDetail'));
const ScheduleVisit = lazy(() => import('../pages/marketplace/ScheduleVisit'));
const MyVisits = lazy(() => import('../pages/user/MyVisits'));

const Messages = lazy(() => import('../pages/user/Messages'));

const CreateContract = lazy(() => import('../pages/common/CreateContract'));
const MyContracts = lazy(() => import('../pages/user/MyContracts'));
const ContractDetail = lazy(() => import('../pages/common/ContractDetail'));
const ContractDetailEnhanced = lazy(() => import('../pages/common/ContractDetailEnhanced'));
const SignLease = lazy(() => import('../pages/common/SignLease'));
const ContractsList = lazy(() => import('../pages/common/ContractsList'));

const MakePayment = lazy(() => import('../pages/user/MakePayment'));
const PaymentHistory = lazy(() => import('../pages/user/PaymentHistory'));

const VerificationRequest = lazy(() => import('../pages/user/VerificationRequest'));
const AnsutVerification = lazy(() => import('../pages/user/AnsutVerification'));
const VerificationSettings = lazy(() => import('../pages/user/VerificationSettings'));
const MyCertificates = lazy(() => import('../pages/user/MyCertificates'));
const RequestTrustValidation = lazy(() => import('../pages/user/RequestTrustValidation'));

const RequestCEV = lazy(() => import('../pages/user/RequestCEV'));
const CEVRequestDetail = lazy(() => import('../pages/common/CEVRequestDetail'));

const TenantDashboard = lazy(() => import('../pages/user/TenantDashboard'));
const TenantCalendar = lazy(() => import('../pages/user/TenantCalendar'));
const TenantScore = lazy(() => import('../pages/user/TenantScore'));
const TenantMaintenance = lazy(() => import('../pages/user/TenantMaintenance'));

const OwnerDashboard = lazy(() => import('../pages/user/OwnerDashboard'));
const AddProperty = lazy(() => import('../pages/marketplace/AddProperty'));
const PropertyStats = lazy(() => import('../pages/marketplace/PropertyStats'));
const OwnerMaintenance = lazy(() => import('../pages/user/OwnerMaintenance'));

const AgencyDashboard = lazy(() => import('../pages/agency/AgencyDashboard'));
const AgencyRegistration = lazy(() => import('../pages/agency/AgencyRegistration'));
const AgencyTeam = lazy(() => import('../pages/agency/AgencyTeam'));
const AgencyProperties = lazy(() => import('../pages/agency/AgencyProperties'));
const AgencyCommissions = lazy(() => import('../pages/agency/AgencyCommissions'));

const MaintenanceRequest = lazy(() => import('../pages/user/MaintenanceRequest'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminUserRoles = lazy(() => import('../pages/admin/AdminUserRoles'));
const AdminApiKeys = lazy(() => import('../pages/admin/AdminApiKeys'));
const AdminServiceProviders = lazy(() => import('../pages/admin/AdminServiceProviders'));
const AdminServiceMonitoring = lazy(() => import('../pages/admin/AdminServiceMonitoring'));
const AdminServiceConfiguration = lazy(() => import('../pages/admin/AdminServiceConfiguration'));
const AdminTestDataGenerator = lazy(() => import('../pages/admin/AdminTestDataGenerator'));
const AdminQuickDemo = lazy(() => import('../pages/admin/AdminQuickDemo'));
const AdminCEVManagement = lazy(() => import('../pages/admin/AdminCEVManagement'));
const AdminTrustAgents = lazy(() => import('../pages/admin/AdminTrustAgents'));

const TrustAgentDashboard = lazy(() => import('../pages/trust-agent/TrustAgentDashboard'));
const TrustAgentModeration = lazy(() => import('../pages/trust-agent/TrustAgentModeration'));
const TrustAgentMediation = lazy(() => import('../pages/trust-agent/TrustAgentMediation'));
const TrustAgentAnalytics = lazy(() => import('../pages/trust-agent/TrustAgentAnalytics'));

const NotificationPreferences = lazy(() => import('../pages/user/NotificationPreferences'));
const MyDisputes = lazy(() => import('../pages/user/MyDisputes'));
const CreateDispute = lazy(() => import('../pages/common/CreateDispute'));
const DisputeDetail = lazy(() => import('../pages/common/DisputeDetail'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouterErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
      { path: 'a-propos', element: <About /> },
      { path: 'conditions', element: <Terms /> },
      { path: 'confidentialite', element: <Privacy /> },
      { path: 'mentions-legales', element: <Legal /> },
      { path: 'connexion', element: <Auth /> },
      { path: 'inscription', element: <Auth /> },
      { path: 'auth/callback', element: <AuthCallback /> },
      {
        path: 'choix-profil',
        element: (
          <ProtectedRoute>
            <ProfileSelection />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profil',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'changer-role',
        element: (
          <ProtectedRoute>
            <RoleChangeRequest />
          </ProtectedRoute>
        ),
      },
      { path: 'recherche', element: <SearchProperties /> },
      { path: 'propriete/:id', element: <PropertyDetail /> },
      { path: 'properties/:id', element: <PropertyDetail /> },
      { path: 'add-property', element: <AddProperty /> },
      {
        path: 'favoris',
        element: (
          <ProtectedRoute>
            <Favorites />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recherches-sauvegardees',
        element: (
          <ProtectedRoute>
            <SavedSearches />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recommandations',
        element: (
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        ),
      },
      {
        path: 'candidature/:id',
        element: (
          <ProtectedRoute>
            <ApplicationForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'visiter/:id',
        element: (
          <ProtectedRoute>
            <ScheduleVisit />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mes-visites',
        element: (
          <ProtectedRoute>
            <MyVisits />
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'creer-contrat/:propertyId',
        element: (
          <ProtectedRoute allowedRoles={['proprietaire', 'agence']}>
            <CreateContract />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mes-contrats',
        element: (
          <ProtectedRoute>
            <MyContracts />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tous-les-contrats',
        element: (
          <ProtectedRoute>
            <ContractsList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contrat/:id',
        element: (
          <ProtectedRoute>
            <ContractDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bail/:id/details',
        element: (
          <ProtectedRoute>
            <ContractDetailEnhanced />
          </ProtectedRoute>
        ),
      },
      {
        path: 'signer-bail/:id',
        element: (
          <ProtectedRoute>
            <SignLease />
          </ProtectedRoute>
        ),
      },
      {
        path: 'bail/signer/:id',
        element: (
          <ProtectedRoute>
            <SignLease />
          </ProtectedRoute>
        ),
      },
      {
        path: 'effectuer-paiement',
        element: (
          <ProtectedRoute>
            <MakePayment />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mes-paiements',
        element: (
          <ProtectedRoute>
            <PaymentHistory />
          </ProtectedRoute>
        ),
      },
      {
        path: 'verification',
        element: (
          <ProtectedRoute>
            <VerificationRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: 'certification-ansut',
        element: (
          <ProtectedRoute>
            <AnsutVerification />
          </ProtectedRoute>
        ),
      },
      {
        path: 'ansut-verification',
        element: (
          <ProtectedRoute>
            <AnsutVerification />
          </ProtectedRoute>
        ),
      },
      {
        path: 'verification/parametres',
        element: (
          <ProtectedRoute>
            <VerificationSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mes-certificats',
        element: (
          <ProtectedRoute>
            <MyCertificates />
          </ProtectedRoute>
        ),
      },
      {
        path: 'request-cev',
        element: (
          <ProtectedRoute>
            <RequestCEV />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cev-request/:id',
        element: (
          <ProtectedRoute>
            <CEVRequestDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/locataire',
        element: (
          <ProtectedRoute allowedRoles={['locataire']}>
            <TenantDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/locataire/calendrier',
        element: (
          <ProtectedRoute allowedRoles={['locataire']}>
            <TenantCalendar />
          </ProtectedRoute>
        ),
      },
      {
        path: 'score-locataire',
        element: (
          <ProtectedRoute allowedRoles={['locataire']}>
            <TenantScore />
          </ProtectedRoute>
        ),
      },
      {
        path: 'maintenance/locataire',
        element: (
          <ProtectedRoute allowedRoles={['locataire']}>
            <TenantMaintenance />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/proprietaire',
        element: (
          <ProtectedRoute allowedRoles={['proprietaire']}>
            <OwnerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/ajouter-propriete',
        element: (
          <ProtectedRoute allowedRoles={['proprietaire', 'agence']}>
            <AddProperty />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/propriete/:id/stats',
        element: (
          <ProtectedRoute allowedRoles={['proprietaire', 'agence']}>
            <PropertyStats />
          </ProtectedRoute>
        ),
      },
      {
        path: 'maintenance/proprietaire',
        element: (
          <ProtectedRoute allowedRoles={['proprietaire']}>
            <OwnerMaintenance />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/candidature/:id',
        element: (
          <ProtectedRoute allowedRoles={['proprietaire', 'agence']}>
            <ApplicationDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agence/tableau-de-bord',
        element: (
          <ProtectedRoute allowedRoles={['agence']}>
            <AgencyDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agence/inscription',
        element: (
          <ProtectedRoute>
            <AgencyRegistration />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agence/equipe',
        element: (
          <ProtectedRoute allowedRoles={['agence']}>
            <AgencyTeam />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agence/proprietes',
        element: (
          <ProtectedRoute allowedRoles={['agence']}>
            <AgencyProperties />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agence/commissions',
        element: (
          <ProtectedRoute allowedRoles={['agence']}>
            <AgencyCommissions />
          </ProtectedRoute>
        ),
      },
      {
        path: 'maintenance/nouvelle',
        element: (
          <ProtectedRoute>
            <MaintenanceRequest />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/tableau-de-bord',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/utilisateurs',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/gestion-roles',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUserRoles />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/api-keys',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminApiKeys />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/service-providers',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminServiceProviders />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/service-monitoring',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminServiceMonitoring />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/service-configuration',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminServiceConfiguration />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/test-data-generator',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTestDataGenerator />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/demo-rapide',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminQuickDemo />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/cev-management',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCEVManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/cev/:id',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCEVManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/trust-agents',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTrustAgents />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trust-agent/dashboard',
        element: (
          <ProtectedRoute allowedRoles={['trust_agent']}>
            <TrustAgentDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trust-agent/moderation',
        element: (
          <ProtectedRoute allowedRoles={['trust_agent']}>
            <TrustAgentModeration />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trust-agent/mediation',
        element: (
          <ProtectedRoute allowedRoles={['trust_agent']}>
            <TrustAgentMediation />
          </ProtectedRoute>
        ),
      },
      {
        path: 'trust-agent/analytics',
        element: (
          <ProtectedRoute allowedRoles={['trust_agent']}>
            <TrustAgentAnalytics />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications/preferences',
        element: (
          <ProtectedRoute>
            <NotificationPreferences />
          </ProtectedRoute>
        ),
      },
      {
        path: 'mes-litiges',
        element: (
          <ProtectedRoute>
            <MyDisputes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'creer-litige',
        element: (
          <ProtectedRoute>
            <CreateDispute />
          </ProtectedRoute>
        ),
      },
      {
        path: 'litige/:id',
        element: (
          <ProtectedRoute>
            <DisputeDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page non trouvée</h2>
              <p className="text-gray-600 mb-8">La page que vous recherchez n'existe pas.</p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-terracotta-500 text-white rounded-lg hover:bg-terracotta-600 transition-colors"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        ),
      },
    ],
  },
];
