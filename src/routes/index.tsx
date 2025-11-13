import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import RouterErrorBoundary from '../components/RouterErrorBoundary';

const Home = lazy(() => import('../pages/Home'));
const Auth = lazy(() => import('../pages/Auth'));
const AuthCallback = lazy(() => import('../pages/AuthCallback'));
const ProfileSelection = lazy(() => import('../pages/ProfileSelection'));
const Profile = lazy(() => import('../pages/Profile'));

const SearchProperties = lazy(() => import('../pages/SearchProperties'));
const PropertyDetail = lazy(() => import('../pages/PropertyDetail'));
const Favorites = lazy(() => import('../pages/Favorites'));
const SavedSearches = lazy(() => import('../pages/SavedSearches'));
const Recommendations = lazy(() => import('../pages/Recommendations'));

const ApplicationForm = lazy(() => import('../pages/ApplicationForm'));
const ApplicationDetail = lazy(() => import('../pages/ApplicationDetail'));
const ScheduleVisit = lazy(() => import('../pages/ScheduleVisit'));
const MyVisits = lazy(() => import('../pages/MyVisits'));

const Messages = lazy(() => import('../pages/Messages'));

const CreateContract = lazy(() => import('../pages/CreateContract'));
const MyContracts = lazy(() => import('../pages/MyContracts'));
const ContractDetail = lazy(() => import('../pages/ContractDetail'));
const ContractDetailEnhanced = lazy(() => import('../pages/ContractDetailEnhanced'));
const SignLease = lazy(() => import('../pages/SignLease'));
const ContractsList = lazy(() => import('../pages/ContractsList'));

const MakePayment = lazy(() => import('../pages/MakePayment'));
const PaymentHistory = lazy(() => import('../pages/PaymentHistory'));

const VerificationRequest = lazy(() => import('../pages/VerificationRequest'));
const AnsutVerification = lazy(() => import('../pages/AnsutVerification'));
const VerificationSettings = lazy(() => import('../pages/VerificationSettings'));
const MyCertificates = lazy(() => import('../pages/MyCertificates'));
const RequestTrustValidation = lazy(() => import('../pages/RequestTrustValidation'));

const RequestCEV = lazy(() => import('../pages/RequestCEV'));
const CEVRequestDetail = lazy(() => import('../pages/CEVRequestDetail'));

const TenantDashboard = lazy(() => import('../pages/TenantDashboard'));
const TenantCalendar = lazy(() => import('../pages/TenantCalendar'));
const TenantScore = lazy(() => import('../pages/TenantScore'));
const TenantMaintenance = lazy(() => import('../pages/TenantMaintenance'));

const OwnerDashboard = lazy(() => import('../pages/OwnerDashboard'));
const AddProperty = lazy(() => import('../pages/AddProperty'));
const PropertyStats = lazy(() => import('../pages/PropertyStats'));
const OwnerMaintenance = lazy(() => import('../pages/OwnerMaintenance'));

const AgencyDashboard = lazy(() => import('../pages/AgencyDashboard'));
const AgencyRegistration = lazy(() => import('../pages/AgencyRegistration'));
const AgencyTeam = lazy(() => import('../pages/AgencyTeam'));
const AgencyProperties = lazy(() => import('../pages/AgencyProperties'));
const AgencyCommissions = lazy(() => import('../pages/AgencyCommissions'));

const MaintenanceRequest = lazy(() => import('../pages/MaintenanceRequest'));

const AdminDashboard = lazy(() => import('../pages/AdminDashboard'));
const AdminUsers = lazy(() => import('../pages/AdminUsers'));
const AdminUserRoles = lazy(() => import('../pages/AdminUserRoles'));
const AdminApiKeys = lazy(() => import('../pages/AdminApiKeys'));
const AdminServiceProviders = lazy(() => import('../pages/AdminServiceProviders'));
const AdminServiceMonitoring = lazy(() => import('../pages/AdminServiceMonitoring'));
const AdminServiceConfiguration = lazy(() => import('../pages/AdminServiceConfiguration'));
const AdminTestDataGenerator = lazy(() => import('../pages/AdminTestDataGenerator'));
const AdminQuickDemo = lazy(() => import('../pages/AdminQuickDemo'));
const AdminCEVManagement = lazy(() => import('../pages/AdminCEVManagement'));
const AdminTrustAgents = lazy(() => import('../pages/AdminTrustAgents'));

const TrustAgentDashboard = lazy(() => import('../pages/TrustAgentDashboard'));
const TrustAgentModeration = lazy(() => import('../pages/TrustAgentModeration'));
const TrustAgentMediation = lazy(() => import('../pages/TrustAgentMediation'));
const TrustAgentAnalytics = lazy(() => import('../pages/TrustAgentAnalytics'));

const NotificationPreferences = lazy(() => import('../pages/NotificationPreferences'));
const MyDisputes = lazy(() => import('../pages/MyDisputes'));
const CreateDispute = lazy(() => import('../pages/CreateDispute'));
const DisputeDetail = lazy(() => import('../pages/DisputeDetail'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouterErrorBoundary />,
    children: [
      { index: true, element: <Home /> },
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
      { path: 'recherche', element: <SearchProperties /> },
      { path: 'propriete/:id', element: <PropertyDetail /> },
      { path: 'properties/:id', element: <PropertyDetail /> },
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
        path: 'add-property',
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
