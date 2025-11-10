import { Shield, FileText, AlertCircle, Users, Home, Gavel, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  const sections = [
    {
      id: 'acceptation',
      title: '1. Acceptation des conditions',
      icon: CheckCircle,
      content: [
        'L\'utilisation de la plateforme Mon Toit implique l\'acceptation pleine et entière des présentes conditions générales d\'utilisation.',
        'Si vous n\'acceptez pas ces conditions, vous ne devez pas utiliser notre plateforme.',
        'Mon Toit se réserve le droit de modifier ces conditions à tout moment. Les modifications prendront effet dès leur publication sur la plateforme.'
      ]
    },
    {
      id: 'services',
      title: '2. Description des services',
      icon: Home,
      content: [
        'Mon Toit est une plateforme de mise en relation entre propriétaires, locataires, et agences immobilières certifiée par l\'ANSUT.',
        'Services proposés : recherche de logements, publication d\'annonces, gestion des locations, signature électronique des contrats, paiement en ligne.',
        'Les services sont fournis "en l\'état", sans garantie de disponibilité continue ou d\'absence d\'interruption.',
        'Mon Toit n\'est pas une agence immobilière et n\'intervient pas directement dans les relations contractuelles entre utilisateurs.'
      ]
    },
    {
      id: 'responsabilites',
      title: '3. Responsabilités des utilisateurs',
      icon: Users,
      content: [
        'Les utilisateurs s\'engagent à fournir des informations exactes, complètes et à jour lors de leur inscription.',
        'Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion.',
        'Il est interdit d\'utiliser la plateforme à des fins illégales, frauduleuses ou malveillantes.',
        'Les propriétaires doivent garantir la véracité des informations concernant leurs biens immobiliers.',
        'Les locataires doivent respecter les biens et honorer leurs engagements contractuels.'
      ]
    },
    {
      id: 'verification',
      title: '4. Processus de vérification',
      icon: Shield,
      content: [
        'Mon Toit utilise la certification ONECI pour vérifier l\'identité de tous les utilisateurs.',
        'Les documents fournis sont traités de manière sécurisée et confidentielle.',
        'Une vérification réussie est obligatoire pour accéder à certaines fonctionnalités de la plateforme.',
        'Mon Toit se réserve le droit de refuser l\'accès à la plateforme en cas d\'informations inexactes ou frauduleuses.'
      ]
    },
    {
      id: 'paiement',
      title: '5. Modalités de paiement',
      icon: FileText,
      content: [
        'Les paiements s\'effectuent via les services de Mobile Money (Orange, MTN, Moov) et d\'autres moyens agréés.',
        'Mon Toit agit en tant qu\'intermédiaire de paiement pour garantir la sécurité des transactions.',
        'Les frais de service sont clairement affichés avant toute validation de paiement.',
        'Les remboursements sont soumis aux conditions générales de vente et aux politiques spécifiques de chaque service.'
      ]
    },
    {
      id: 'protection',
      title: '6. Protection des données',
      icon: Shield,
      content: [
        'Mon Toit respecte la réglementation ivoirienne sur la protection des données personnelles.',
        'Les données collectées sont utilisées uniquement dans le cadre des services proposés.',
        'Les utilisateurs disposent d\'un droit d\'accès, de modification et de suppression de leurs données.',
        'Aucune donnée personnelle n\'est vendue ou partagée avec des tiers sans consentement explicite.'
      ]
    },
    {
      id: 'litiges',
      title: '7. Résolution des litiges',
      icon: Gavel,
      content: [
        'En cas de litige, les parties s\'engagent à rechercher une solution amiable avant toute action judiciaire.',
        'Mon Toit met à disposition des services de médiation pour faciliter la résolution des conflits.',
        'Les litiges relatifs aux contrats de location relèvent de la juridiction compétente en Côte d\'Ivoire.',
        'Mon Toit ne peut être tenu responsable des litiges entre utilisateurs.'
      ]
    }
  ];

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-to-br from-olive-600 to-olive-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Conditions d'utilisation
              </h1>
              <p className="text-olive-100 text-lg">
                Dernière mise à jour : 10 novembre 2025
              </p>
            </div>
          </div>
          <p className="text-lg text-olive-50 leading-relaxed">
            Bienvenue sur Mon Toit. Veuillez lire attentivement ces conditions générales d'utilisation
            avant d'utiliser notre plateforme immobilière certifiée ANSUT.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Navigation */}
            <div className="bg-olive-50 p-6 border-b border-olive-200">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-olive-100 transition-colors text-gray-700 hover:text-olive-700"
                  >
                    <section.icon className="h-5 w-5 text-olive-600" />
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
                      index % 3 === 0 ? 'bg-olive-100' : index % 3 === 1 ? 'bg-cyan-100' : 'bg-coral-100'
                    }`}>
                      <section.icon className={`h-6 w-6 ${
                        index % 3 === 0 ? 'text-olive-600' : index % 3 === 1 ? 'text-cyan-600' : 'text-coral-600'
                      }`} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div className="space-y-4 pl-16">
                    {section.content.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-gray-700 leading-relaxed flex items-start">
                        <span className="text-olive-500 mr-3 mt-1">•</span>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              {/* Additional Information */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mt-12">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-2">Information importante</h3>
                    <p className="text-amber-800 leading-relaxed">
                      Ces conditions d'utilisation constituent un contrat juridique entre vous et Mon Toit.
                      En utilisant notre plateforme, vous reconnaissez avoir lu, compris et accepté ces termes.
                      Pour toute question, n'hésitez pas à contacter notre support client.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="text-center pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Besoin d'aide ?</h3>
                <p className="text-gray-600 mb-6">
                  Notre équipe est disponible pour répondre à toutes vos questions concernant ces conditions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/contact" className="btn-primary">
                    Contacter le support
                  </Link>
                  <Link to="/confidentialite" className="btn-secondary">
                    Politique de confidentialité
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
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Documents légaux</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/mentions-legales" className="card-scrapbook p-4 text-center bg-white hover:shadow-lg transition-shadow">
                <Gavel className="h-8 w-8 text-olive-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">Mentions légales</span>
              </Link>
              <Link to="/confidentialite" className="card-scrapbook p-4 text-center bg-white hover:shadow-lg transition-shadow">
                <Shield className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">Confidentialité</span>
              </Link>
              <Link to="/a-propos" className="card-scrapbook p-4 text-center bg-white hover:shadow-lg transition-shadow">
                <Home className="h-8 w-8 text-coral-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">À propos</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

        </>
  );
}