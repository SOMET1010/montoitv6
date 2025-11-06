import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* À propos */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Home className="w-8 h-8 text-primary-400" strokeWidth={2.5} />
              <span className="text-2xl font-black">MZAKA</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              La marketplace immobilière du Burkina Faso. Trouvez votre logement idéal en toute simplicité.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-lg font-bold mb-6">Liens rapides</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/recherche" className="text-gray-400 hover:text-white transition-colors">
                  Rechercher un logement
                </Link>
              </li>
              <li>
                <Link to="/publier" className="text-gray-400 hover:text-white transition-colors">
                  Publier une annonce
                </Link>
              </li>
              <li>
                <Link to="/connexion" className="text-gray-400 hover:text-white transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link to="/inscription" className="text-gray-400 hover:text-white transition-colors">
                  Créer un compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold mb-6">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Centre d'aide
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Conditions d'utilisation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Politique de confidentialité
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <span>Ouagadougou, Burkina Faso</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>+226 XX XX XX XX</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>contact@mzaka.bf</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Barre du bas */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} MZAKA. Tous droits réservés.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-600"></div>
              <div className="w-6 h-6 rounded-full bg-secondary-600"></div>
              <div className="w-6 h-6 rounded-full bg-accent-600"></div>
              <span className="text-gray-400 text-sm ml-2">Made with ❤️ in Burkina Faso</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
