import { Building2, Mail, Phone, MapPin, Shield, Heart, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-olive-900 text-gray-300 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-terracotta-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center space-x-3 mb-6 group">
              <div className="relative">
                <Building2 className="h-10 w-10 text-terracotta-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-pulse" />
              </div>
              <span className="text-3xl font-bold text-gradient">Mon Toit</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Plateforme immobilière certifiée ANSUT pour un accès universel au logement en Côte d'Ivoire.
            </p>
            <div className="inline-flex items-center space-x-2 bg-olive-900/50 backdrop-blur-sm px-3 py-2 rounded-full border border-olive-700">
              <Shield className="h-4 w-4 text-olive-400" />
              <span className="text-xs font-bold text-olive-300">ANSUT Certifié</span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-5 text-lg flex items-center space-x-2">
              <span className="text-terracotta-400">●</span>
              <span>Liens rapides</span>
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/" className="hover:text-terracotta-400 transition-colors hover:translate-x-2 transform inline-block duration-200 font-medium">
                  🏠 Accueil
                </a>
              </li>
              <li>
                <a href="/recherche" className="hover:text-cyan-400 transition-colors hover:translate-x-2 transform inline-block duration-200 font-medium">
                  🔍 Rechercher
                </a>
              </li>
              <li>
                <a href="/a-propos" className="hover:text-amber-400 transition-colors hover:translate-x-2 transform inline-block duration-200 font-medium">
                  ℹ️ À propos
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-5 text-lg flex items-center space-x-2">
              <span className="text-cyan-400">●</span>
              <span>Légal</span>
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/conditions" className="hover:text-terracotta-400 transition-colors hover:translate-x-2 transform inline-block duration-200 font-medium">
                  📋 Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="/confidentialite" className="hover:text-cyan-400 transition-colors hover:translate-x-2 transform inline-block duration-200 font-medium">
                  🔒 Politique de confidentialité
                </a>
              </li>
              <li>
                <a href="/mentions-legales" className="hover:text-amber-400 transition-colors hover:translate-x-2 transform inline-block duration-200 font-medium">
                  ⚖️ Mentions légales
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold mb-5 text-lg flex items-center space-x-2">
              <span className="text-amber-400">●</span>
              <span>Contact</span>
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-terracotta-900/50 rounded-lg flex items-center justify-center group-hover:bg-terracotta-800 transition-colors">
                  <Mail className="h-4 w-4 text-terracotta-400" />
                </div>
                <span className="font-medium">contact@mon-toit.ci</span>
              </li>
              <li className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-cyan-900/50 rounded-lg flex items-center justify-center group-hover:bg-cyan-800 transition-colors">
                  <Phone className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="font-medium">+225 XX XX XX XX XX</span>
              </li>
              <li className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-amber-900/50 rounded-lg flex items-center justify-center group-hover:bg-amber-800 transition-colors">
                  <MapPin className="h-4 w-4 text-amber-400" />
                </div>
                <span className="font-medium">Abidjan, Côte d'Ivoire</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700/50 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              &copy; 2025 <span className="font-bold text-white">Mon Toit</span>. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-400">Fait avec</span>
              <Heart className="h-4 w-4 text-coral-500 animate-pulse" />
              <span className="text-gray-400">pour l'accès universel au logement (version 6.1.0)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
