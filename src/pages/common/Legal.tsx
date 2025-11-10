import { Building2, MapPin, Phone, Mail, Shield, FileText, Globe, Award, Users, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Legal() {
  const companyInfo = {
    name: 'MON TOIT CI',
    legalForm: 'Société Anonyme',
    capital: '10 000 000 FCFA',
    rccm: 'CI-ABJ-2025-A-1234',
    siret: '12345678900012',
    address: 'Abidjan, Cocody, Zone 4, Rue des Entreprises',
    postalCode: 'BP 1234 Abidjan 01',
    phone: '+225 27 20 00 00 00',
    email: 'contact@mon-toit.ci',
    website: 'https://mon-toit.ci',
    director: 'Kouadio Konan'
  };

  const certifications = [
    {
      name: 'ANSUT',
      description: 'Autorité Nationale de la Sécurité et de la Fiabilité des Transactions Numériques',
      number: 'ANSUT/2025/001234',
      date: '15 janvier 2025'
    },
    {
      name: 'ONECI',
      description: 'Office National d\'Identification',
      number: 'PARTNER-ONECI-2025',
      date: '10 janvier 2025'
    }
  ];

  const hosting = {
    provider: 'Orange Côte d\'Ivoire',
    address: 'Abidjan, Plateau, Immeuble Orange',
    contact: 'support@orange.ci',
    website: 'https://orange.ci'
  };

  const dataProtection = {
    dpoName: 'Délegué à la Protection des Données',
    email: 'dpo@mon-toit.ci',
    address: companyInfo.address,
    registrationNumber: 'CI-DPO-2025-001'
  };

  return (
    <>
      {/* Header Section */}
      <section className="bg-gradient-to-br from-gray-700 to-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Mentions légales
              </h1>
              <p className="text-gray-300 text-lg">
                Informations légales et conformité de Mon Toit CI
              </p>
            </div>
          </div>
          <p className="text-lg text-gray-300 leading-relaxed">
            Conformément aux dispositions de la loi n°2013-450 relative à la protection des données
            personnelles en Côte d'Ivoire et aux exigences de l'ANSUT.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">

            {/* Company Information */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-gray-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Informations sur l'entreprise</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Dénomination sociale</h3>
                    <p className="text-gray-700">{companyInfo.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Forme juridique</h3>
                    <p className="text-gray-700">{companyInfo.legalForm}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Capital social</h3>
                    <p className="text-gray-700">{companyInfo.capital}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">RCCM</h3>
                    <p className="text-gray-700">{companyInfo.rccm}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Directeur général</h3>
                    <p className="text-gray-700">{companyInfo.director}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Adresse du siège</h3>
                    <p className="text-gray-700">{companyInfo.address}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        {companyInfo.phone}
                      </p>
                      <p className="text-gray-700 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {companyInfo.email}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Site web</h3>
                    <a href={companyInfo.website} className="text-cyan-600 hover:text-cyan-700">
                      {companyInfo.website}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Certifications */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-olive-100 rounded-xl flex items-center justify-center">
                  <Award className="h-6 w-6 text-olive-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Certifications et autorisations</h2>
              </div>

              <div className="space-y-6">
                {certifications.map((cert, index) => (
                  <div key={index} className="border-l-4 border-olive-400 pl-4">
                    <h3 className="font-bold text-gray-900 mb-1">{cert.name}</h3>
                    <p className="text-gray-600 mb-2">{cert.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="bg-olive-100 text-olive-800 px-3 py-1 rounded-full">
                        N° {cert.number}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                        {cert.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Protection */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-cyan-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Protection des données</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Déclaration CNIL</h3>
                  <p className="text-gray-700">
                    Mon Toit CI a déclaré ses traitements de données personnelles auprès de la CNIL ivoirienne
                    sous le numéro {dataProtection.registrationNumber}.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Délegué à la Protection des Données (DPO)</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Fonction :</span> {dataProtection.dpoName}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Email :</span> {dataProtection.email}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Adresse :</span> {dataProtection.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hosting */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-coral-100 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-coral-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Hébergement</h2>
              </div>

              <div className="bg-coral-50 rounded-lg p-6">
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <span className="font-semibold">Prestataire :</span> {hosting.provider}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Adresse :</span> {hosting.address}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Support technique :</span> {hosting.contact}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">Site web :</span>
                    <a href={hosting.website} className="text-cyan-600 hover:text-cyan-700 ml-1">
                      {hosting.website}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Propriété intellectuelle</h2>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  L'ensemble du contenu de ce site web, incluant mais non limité aux textes, images,
                  graphismes, logos, icônes, logiciels et applications, est la propriété exclusive de
                  Mon Toit CI et est protégé par les lois ivoiriennes et internationales sur la
                  propriété intellectuelle.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-900">
                    <strong>Toute reproduction, distribution, modification, adaptation, transmission ou
                    publication, même partielle, des éléments du site est strictement interdite sans
                    l'autorisation écrite préalable de Mon Toit CI.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Liability */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-gray-700" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Limitation de responsabilité</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Responsabilité éditoriale</h3>
                  <p className="text-gray-700">
                    Mon Toit CI s\'efforce de fournir des informations exactes et à jour sur la plateforme.
                    Cependant, nous ne garantissons pas l\'exhaustivité ni la précision absolue des informations
                    publiées par les utilisateurs.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Responsabilité technique</h3>
                  <p className="text-gray-700">
                    Mon Toit CI ne peut être tenu responsable des dommages directs ou indirects résultant
                    de l\'utilisation ou de l\'impossibilité d\'utiliser la plateforme, y compris les pertes
                    de données, de revenus ou de profits.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Liens externes</h3>
                  <p className="text-gray-700">
                    La plateforme peut contenir des liens vers des sites web tiers. Mon Toit CI décline toute
                    responsabilité quant au contenu de ces sites externes.
                  </p>
                </div>
              </div>
            </div>

            {/* Update Information */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-olive-100 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-olive-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Mise à jour des mentions légales</h2>
              </div>

              <div className="space-y-4">
                <p className="text-gray-700">
                  Les présentes mentions légales ont été mises à jour le 10 novembre 2025 et sont
                  susceptibles d\'être modifiées à tout moment. Nous vous invitons à les consulter
                  régulièrement pour rester informé des éventuelles modifications.
                </p>

                <div className="bg-olive-50 rounded-lg p-4">
                  <p className="text-olive-900">
                    <strong>Dernière mise à jour :</strong> 10 novembre 2025<br/>
                    <strong>Prochaine révision prévue :</strong> 10 novembre 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Legal */}
            <div className="text-center bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions juridiques ?</h3>
              <p className="text-gray-600 mb-6">
                Pour toute question concernant ces mentions légales ou des aspects juridiques de notre service,
                n'hésitez pas à contacter notre service juridique.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:legal@mon-toit.ci" className="btn-primary">
                  Contact juridique
                </a>
                <Link to="/conditions" className="btn-secondary">
                  Conditions d'utilisation
                </Link>
                <Link to="/confidentialite" className="btn-secondary">
                  Politique de confidentialité
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}