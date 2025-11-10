import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Mail, Lock, User, UserCircle, Sparkles, Shield, CheckCircle, Chrome, Facebook, KeyRound, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const currentPath = window.location.pathname;
  const [isLogin, setIsLogin] = useState(currentPath === '/connexion');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp, signInWithProvider, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) {
          setError('Veuillez entrer votre adresse email');
          setLoading(false);
          return;
        }
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message || 'Erreur lors de l\'envoi du lien de réinitialisation');
          return;
        }
        setSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setIsLogin(true);
          setSuccess('');
        }, 5000);
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        window.location.href = '/';
      } else {
        const { error } = await signUp(email, password, { full_name: fullName });
        if (error) {
          console.error('Signup error:', error);
          if (error.message?.includes('already registered') || error.message?.includes('User already registered')) {
            setError('Cet email est déjà utilisé. Connectez-vous.');
          } else if (error.message?.includes('Database error')) {
            setError('Erreur de base de données. Veuillez réessayer ou contacter le support.');
          } else {
            setError(error.message || 'Erreur lors de l\'inscription');
          }
          return;
        }
        setSuccess('Inscription réussie ! Redirection en cours...');
        setTimeout(() => {
          window.location.href = '/choix-profil';
        }, 1500);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError('');
    setLoading(true);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion sociale');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen custom-cursor relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-br from-terracotta-400 via-coral-300 to-amber-300" />

      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-300 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-olive-300 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200 rounded-full blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="absolute top-10 right-10 text-white/30 transform rotate-12 text-9xl font-bold animate-float">★</div>
      <div className="absolute bottom-20 left-20 text-white/30 transform -rotate-12 text-7xl font-bold animate-bounce-subtle">♥</div>

      <div className="max-w-6xl w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block text-white space-y-8 animate-slide-down">
            <div className="flex items-center space-x-3">
              <Building2 className="h-16 w-16" />
              <span className="text-5xl font-bold">Mon Toit</span>
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Votre logement idéal vous attend
            </h1>

            <p className="text-2xl text-amber-100">
              Rejoignez des milliers d'utilisateurs qui ont trouvé leur chez-soi
            </p>

            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transform hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-olive-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Certification ANSUT</h3>
                  <p className="text-amber-100 text-sm">Vérification ONECI & CNAM</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transform hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">100% Sécurisé</h3>
                  <p className="text-amber-100 text-sm">Paiements et contrats protégés</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 transform hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-coral-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Accès Universel</h3>
                  <p className="text-amber-100 text-sm">Un logement pour tous</p>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-scale-in">
            <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="lg:hidden flex justify-center mb-6">
                <div className="flex items-center space-x-2 text-terracotta-600">
                  <Building2 className="h-10 w-10" />
                  <span className="text-3xl font-bold">Mon Toit</span>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 mb-4 bg-gradient-to-r from-terracotta-100 to-coral-100 px-4 py-2 rounded-full">
                  <Sparkles className="h-4 w-4 text-terracotta-600" />
                  <span className="text-sm font-semibold text-terracotta-700">Plateforme ANSUT</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {isForgotPassword ? 'Récupération' : isLogin ? 'Bienvenue !' : 'Créez votre compte'}
                </h2>
                <p className="text-gray-600">
                  {isForgotPassword
                    ? 'Recevez un lien de réinitialisation par email'
                    : isLogin
                    ? 'Connectez-vous pour continuer'
                    : 'Rejoignez la communauté Mon Toit'
                  }
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-coral-50 border-2 border-red-200 rounded-2xl text-red-700 text-sm font-medium animate-slide-down">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-gradient-to-r from-olive-50 to-cyan-50 border-2 border-olive-200 rounded-2xl text-olive-700 text-sm font-medium animate-slide-down">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && !isForgotPassword && (
                  <div className="animate-slide-down">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-terracotta-500" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white/70"
                        placeholder="Votre nom complet"
                      />
                    </div>
                  </div>
                )}

                <div className="animate-slide-down" style={{ animationDelay: isLogin ? '0s' : '0.1s' }}>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-terracotta-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white/70"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div className="animate-slide-down" style={{ animationDelay: isLogin ? '0.1s' : '0.2s' }}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-terracotta-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-terracotta-200 focus:border-terracotta-500 transition-all bg-white/70"
                        placeholder="••••••••"
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                {isLogin && !isForgotPassword && (
                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-sm text-terracotta-600 hover:text-terracotta-700 font-semibold transition-colors hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Chargement...</span>
                    </span>
                  ) : isForgotPassword ? (
                    <span className="flex items-center justify-center space-x-2">
                      <KeyRound className="w-5 h-5" />
                      <span>Envoyer le lien</span>
                    </span>
                  ) : (
                    isLogin ? 'Se connecter' : "S'inscrire"
                  )}
                </button>
              </form>

              {isForgotPassword && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setIsForgotPassword(false);
                      setIsLogin(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="inline-flex items-center space-x-2 text-terracotta-600 hover:text-terracotta-700 font-bold text-sm transform hover:scale-105 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour à la connexion</span>
                  </button>
                </div>
              )}

              {!isForgotPassword && (
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t-2 border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">ou continuer avec</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleSocialLogin('google')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
                    >
                      <Chrome className="w-5 h-5" />
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin('facebook')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
                    >
                      <Facebook className="w-5 h-5" />
                      <span>Facebook</span>
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <a
                      href={isLogin ? '/inscription' : '/connexion'}
                      className="text-terracotta-600 hover:text-terracotta-700 font-bold text-sm transform hover:scale-105 transition-all inline-block"
                    >
                      {isLogin ? "Pas de compte ? Inscrivez-vous gratuitement" : "Déjà un compte ? Connectez-vous"}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center text-sm">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <Shield className="h-4 w-4 text-olive-600" />
                <span className="text-gray-700 font-medium">Plateforme certifiée ANSUT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
