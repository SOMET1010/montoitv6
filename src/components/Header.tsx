import { Home, Search, User, LogOut, Menu, X, MessageCircle, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMessageNotifications } from '../hooks/useMessageNotifications';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useMessageNotifications();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <Home className="w-8 h-8 text-primary-600" strokeWidth={2.5} />
            <span className="text-2xl font-black text-gray-900">MZAKA</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/recherche"
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              <Search className="w-5 h-5" />
              <span>Rechercher</span>
            </Link>

            {user ? (
              <>
                <Link
                  to="/messages"
                  className="relative flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/favoris"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>Favoris</span>
                </Link>

                <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                  <Link
                    to="/profil"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>{profile?.full_name || 'Profil'}</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-700 hover:text-accent-600 font-medium transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/connexion"
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/publier"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                >
                  Publier
                </Link>
              </div>
            )}
          </nav>

          {/* Menu Mobile Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700 hover:text-primary-600"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Mobile */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col gap-3">
              <Link
                to="/recherche"
                className="flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                <Search className="w-5 h-5" />
                <span>Rechercher</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/messages"
                    className="flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="bg-accent-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/favoris"
                    className="flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span>Favoris</span>
                  </Link>

                  <Link
                    to="/profil"
                    className="flex items-center gap-3 text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>{profile?.full_name || 'Profil'}</span>
                  </Link>

                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-3 text-accent-600 hover:text-accent-700 font-medium py-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/connexion"
                    className="text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/publier"
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Publier une annonce
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
