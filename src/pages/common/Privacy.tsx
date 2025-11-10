import { Shield, Eye, Lock, Database, Users, Settings, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      icon: Shield,
      content: [
        'Mon Toit s\'engage à protéger la vie privée de ses utilisateurs conformément à la législation ivoirienne sur la protection des données personnelles.',
        'Cette politique de confidentialité explique comment nous collectons, utilisons, protégeons et partageons vos informations personnelles.',
        'En utilisant Mon Toit, vous acceptez les pratiques décrites dans cette politique.'
      ]
    },
    {
      id: 'collecte',
      title: '2. Collecte des informations',
      icon: Database,
      content: [
        'Informations d\'inscription : nom, prénom, email, numéro de téléphone, pièce d\'identité.',
        'Informations de profil : photo de profil, préférences, historique de recherche.',
        'Informations de localisation : adresse IP, données de géolocalisation avec consentement.',
        'Informations de transaction : données de paiement, historique des transactions.',
        'Données d\'utilisation : pages visitées, temps passé, interactions avec la plateforme.'
      ]
    },
    {
      id: 'utilisation',
      title: '3. Utilisation des données',
      icon: Eye,
      content: [
        'Fournir et améliorer nos services immobiliers.',
        'Faciliter la mise en relation entre propriétaires et locataires.',
        'Vérifier l\'identité des utilisateurs via la certification ONECI.',
        'Traiter les paiements sécurisés via Mobile Money.',
        'Personnaliser l\'expérience utilisateur.',
        'Communiquer avec vous concernant votre compte et nos services.',
        'Analyser les tendances pour améliorer notre plateforme.'
      ]
    },
    {
      id: 'protection',
      title: '4. Protection des données',
      icon: Lock,
      content: [
        'Toutes les données sont chiffrées lors de leur transmission et de leur stockage.',
        'Accès limité aux données personnelles uniquement pour le personnel autorisé.',
        'Serveurs sécurisés situés en Côte d\'Ivoire avec des sauvegardes régulières.',
        'Audit de sécurité régulier pour identifier et corriger les vulnérabilités.',
        'Utilisation de protocoles HTTPS pour toutes les communications.'
      ]
    },
    {
      id: 'partage',
      title: '5. Partage des informations',
      icon: Users,
      content: [
        'Les propriétaires peuvent voir les informations des locataires potentiels après leur consentement.',
        'Les locataires peuvent voir les informations des propriétaires et des biens immobiliers.',
        'Partage avec les autorités compétentes en cas d\'obligation légale.',
        'Partage avec les partenaires de paiement sécurisé pour traiter les transactions.',
        'Aucune vente de données personnelles à des tiers à des fins marketing.'
      ]
    },
    {
      id: 'droits',
      title: '6. Vos droits',
      icon: Settings,
      content: [
        'Droit d\'accès : demander une copie de vos données personnelles.',
        'Droit de rectification : corriger les informations inexactes.',
        'Droit de suppression : demander la suppression de vos données (dans les limites légales).',
        'Droit de portabilité : recevoir vos données dans un format structuré.',
        'Droit d\'opposition : s\'opposer au traitement de vos données à des fins marketing.',
        'Droit de limitation : limiter le traitement de vos données dans certaines circonstances.'
      ]
    },
    {
      id: 'conservation',
      title: '7. Conservation des données',
      icon: Clock,
      content: [
        'Les données sont conservées uniquement le temps nécessaire à la fourniture des services.',
        'Les données de compte sont conservées jusqu\'à la suppression du compte.',
        'Les données transactionnelles sont conservées pendant 10 ans pour des raisons fiscales et légales.',
        'Les données d\'analyse anonymisées peuvent être conservées indéfiniment.'
      ]
    },
    {
      id: 'cookies',
      title: '8. Cookies et technologies similaires',
      icon: Database,
      content: [
        'Utilisation de cookies essentiels pour le fonctionnement du site.',
        'Cookies de performance pour analyser l\'utilisation et améliorer les services.',
        'Cookies de personnalisation pour adapter l\'expérience utilisateur.',
        'Possibilité de désactiver les cookies via les paramètres du navigateur.',
        'Cookies tiers pour les services intégrés (cartes, paiement, etc.).'
      ]
    }
  ];

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Politique de confidentialité
              </h1>
              <p className="text-cyan-100 text-lg">
                Dernière mise à jour : 10 novembre 2025
              </p>
            </div>
          </div>
          <p className="text-lg text-cyan-50 leading-relaxed">
            Chez Mon Toit, votre confidentialité est notre priorité. Découvrez comment nous protégeons
            et utilisons vos données personnelles dans le respect de la législation ivoirienne.
          </p>
        </div>
      </section>

      {/* Trust Badge */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center space-x-2 bg-olive-50 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-olive-600" />
              <span className="text-olive-800 font-medium">Certifié ONECI</span>
            </div>
            <div className="flex items-center space-x-2 bg-cyan-50 px-4 py-2 rounded-full">
              <Lock className="h-5 w-5 text-cyan-600" />
              <span className="text-cyan-800 font-medium">Chiffrement AES-256</span>
            </div>
            <div className="flex items-center space-x-2 bg-coral-50 px-4 py-2 rounded-full">
              <Database className="h-5 w-5 text-coral-600" />
              <span className="text-coral-800 font-medium">Serveurs CI</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Navigation */}
            <div className="bg-cyan-50 p-6 border-b border-cyan-200">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-cyan-100 transition-colors text-gray-700 hover:text-cyan-700"
                  >
                    <section.icon className="h-5 w-5 text-cyan-600" />
                    <span className="font-medium">{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-8 space-y-12">
              {sections.map((section, index) => (
                <div key={section.id} className="scroll-mt-8">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      index % 3 === 0 ? 'bg-cyan-100' : index % 3 === 1 ? 'bg-olive-100' : 'bg-coral-100'
                    }`}>
                      <section.icon className={`h-6 w-6 ${
                        index % 3 === 0 ? 'text-cyan-600' : index % 3 === 1 ? 'text-olive-600' : 'text-coral-600'
                      }`} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="space-y-4 pl-16">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-gray-700 leading-relaxed flex items-start">
                        <span className="text-cyan-500 mr-3 mt-1">•</span>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Security Measures */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 mt-12">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-6 w-6 text-cyan-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-cyan-900 mb-2">Mesures de sécurité renforcées</h3>
                    <ul className="space-y-2 text-cyan-800">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Authentification à deux facteurs pour les comptes sensibles</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Surveillance 24/7 des tentatives d\'intrusion</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Formation continue de notre équipe à la sécurité des données</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-cyan-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span>Respect des normes internationales de sécurité ISO 27001</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="text-center pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Exercer vos droits</h3>
                <p className="text-gray-600 mb-6">
                  Pour exercer vos droits ou poser des questions sur cette politique, contactez notre délégué à la protection des données.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="mailto:dpo@mon-toit.ci" className="btn-primary">
                    Contacter le DPO
                  </a>
                  <Link to="/contact" className="btn-secondary">
                    Support client
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Gérez vos données</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <Link to="/profile?tab=privacy" className="card-scrapbook p-4 bg-white hover:shadow-lg transition-shadow">
                <Settings className="h-8 w-8 text-olive-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">Paramètres de confidentialité</span>
              </Link>
              <Link to="/profile?tab=data" className="card-scrapbook p-4 bg-white hover:shadow-lg transition-shadow">
                <Database className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">Télécharger mes données</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}