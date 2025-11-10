import { useState } from 'react';
import {
  Building2,
  Shield,
  Heart,
  Users,
  Target,
  Award,
  Globe,
  Home,
  Sparkles,
  CheckCircle,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  const [activeTab, setActiveTab] = useState('mission');

  const stats = [
    { number: '10,000+', label: 'Utilisateurs actifs', icon: Users },
    { number: '5,000+', label: 'Logements disponibles', icon: Home },
    { number: '98%', label: 'Taux de satisfaction', icon: Heart },
    { number: '24/7', label: 'Support disponible', icon: Shield }
  ];

  const team = [
    {
      name: 'Kouadio Konan',
      role: 'CEO & Fondateur',
      bio: 'Expert en immobilier digital avec 15 ans d\'expérience',
      image: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Awa Bamba',
      role: 'Directrice Technique',
      bio: 'Ingénieure logicielle spécialisée dans les prop-tech',
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      name: 'Yao Touré',
      role: 'Head of Operations',
      bio: 'Spécialiste en gestion immobilière et customer success',
      image: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const values = [
    {
      title: 'Accessibilité Universelle',
      description: 'Nous croyons que tout le monde mérite un logement décent, quel que soit son revenu ou sa situation.',
      icon: Heart,
      color: 'from-coral-400 to-coral-600'
    },
    {
      title: 'Sécurité Maximale',
      description: 'Certification ANSUT et vérification d\'identité ONECI pour une protection totale.',
      icon: Shield,
      color: 'from-olive-400 to-olive-600'
    },
    {
      title: 'Innovation Continue',
      description: 'Intégration des dernières technologies pour une expérience utilisateur exceptionnelle.',
      icon: Sparkles,
      color: 'from-cyan-400 to-cyan-600'
    },
    {
      title: 'Transparence Totale',
      description: 'Des prix clairs, des processus simples et aucune cachette.',
      icon: CheckCircle,
      color: 'from-terracotta-400 to-terracotta-600'
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-olive-50 via-white to-cyan-50 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-olive-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">À propos</span> de Mon Toit
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              La plateforme immobilière certifiée ANSUT qui révolutionne l'accès au logement en Côte d'Ivoire
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/recherche" className="btn-primary">
                Commencer votre recherche
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link to="/inscription" className="btn-secondary">
                Rejoindre la communauté
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${index === 0 ? 'from-coral-400 to-coral-600' : index === 1 ? 'from-olive-400 to-olive-600' : index === 2 ? 'from-cyan-400 to-cyan-600' : 'from-terracotta-400 to-terracotta-600'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission/Vision Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-olive-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Notre <span className="text-gradient">Mission</span>
            </h2>
          </div>

          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-full shadow-lg p-1">
              <button
                onClick={() => setActiveTab('mission')}
                className={`px-6 py-2 rounded-full transition-colors ${
                  activeTab === 'mission'
                    ? 'bg-olive-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mission
              </button>
              <button
                onClick={() => setActiveTab('vision')}
                className={`px-6 py-2 rounded-full transition-colors ${
                  activeTab === 'vision'
                    ? 'bg-olive-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Vision
              </button>
              <button
                onClick={() => setActiveTab('values')}
                className={`px-6 py-2 rounded-full transition-colors ${
                  activeTab === 'values'
                    ? 'bg-olive-500 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Valeurs
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {activeTab === 'mission' && (
              <div className="card-scrapbook p-12 bg-white border-4 border-olive-200/50">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-olive-400 to-olive-600 rounded-2xl flex items-center justify-center">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">Notre Mission</h3>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Démocratiser l'accès au logement en Côte d'Ivoire en proposant une plateforme sécurisée,
                  transparente et accessible à tous, avec un accompagnement personnalisé à chaque étape du processus.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Nous nous engageons à réduire les barrières administratives, à garantir la sécurité des transactions
                  et à offrir des solutions innovantes qui répondent aux besoins réels de la population ivoirienne.
                </p>
              </div>
            )}

            {activeTab === 'vision' && (
              <div className="card-scrapbook p-12 bg-white border-4 border-cyan-200/50">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">Notre Vision</h3>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  Devenir la plateforme de référence pour l'immobilier en Afrique de l'Ouest,
                  en innovant continuellement et en créant un écosystème où chaque famille trouve
                  le logement idéal selon ses moyens et ses aspirations.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Nous aspirons à créer un impact social durable en facilitant l'accession
                  à la propriété et en luttant contre la précarité du logement dans la région.
                </p>
              </div>
            )}

            {activeTab === 'values' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {values.map((value, index) => (
                  <div key={index} className="card-scrapbook p-8 bg-white border-4 border-opacity-50 hover:transform hover:scale-105 transition-transform duration-300"
                    style={{
                      borderColor: index === 0 ? '#FF6B6B40' : index === 1 ? '#86B53E40' : index === 2 ? '#06B6D440' : '#E74C3C40'
                    }}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-4`}>
                      <value.icon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h4>
                    <p className="text-gray-700 leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Notre <span className="text-gradient">Équipe</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une équipe passionnée et experte au service de votre projet immobilier
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="card-scrapbook text-center bg-white"
                style={{
                  transform: `rotate(${index % 2 === 0 ? '-1deg' : '1deg'})`
                }}
              >
                <div className="relative mb-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-32 h-32 rounded-2xl mx-auto object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-olive-400 to-olive-600 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-olive-600 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-olive-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Rejoignez la <span className="text-yellow-300">révolution</span> immobilière
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Des milliers d'Ivoiriens nous font déjà confiance pour leur projet immobilier
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/inscription" className="btn-primary bg-white text-olive-600 hover:bg-gray-100">
              Commencer maintenant
            </Link>
            <Link to="/contact" className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-olive-600">
              Contacter l'équipe
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}