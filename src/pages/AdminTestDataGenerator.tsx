import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Users,
  Home,
  FileText,
  MessageSquare,
  CreditCard,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle,
  Loader,
  BarChart3,
} from 'lucide-react';

interface GenerationStats {
  total_generated: number;
  total_tokens_used: number;
  by_type: Record<string, { count: number; tokens: number }>;
  templates_active: number;
  names_database_size: number;
}

export default function AdminTestDataGenerator() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_test_data_stats');
      if (error) throw error;
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const generateTestData = async (dataType: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedData(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Non authentifié');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-test-data`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          dataType,
          params: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de génération');
      }

      const result = await response.json();

      if (result.success) {
        setGeneratedData(result.data);
        setSuccess(`${dataType} généré avec succès !`);
        await loadStats();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const downloadGeneratedData = () => {
    if (!generatedData) return;

    const dataStr = JSON.stringify(generatedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dataTypeButtons = [
    {
      type: 'profile',
      label: 'Profil Utilisateur',
      icon: Users,
      description: 'Génère un profil complet avec nom ivoirien, emploi, revenus',
      color: 'blue',
    },
    {
      type: 'property',
      label: 'Bien Immobilier',
      icon: Home,
      description: 'Génère une annonce immobilière réaliste pour Abidjan',
      color: 'green',
    },
    {
      type: 'document',
      label: 'Document CNI',
      icon: FileText,
      description: 'Génère un document avec watermark "COPIE NON CONFORME"',
      color: 'purple',
    },
    {
      type: 'complete_scenario',
      label: 'Scénario Complet',
      icon: Sparkles,
      description: 'Génère un parcours complet: locataire, propriétaire, bien, documents',
      color: 'orange',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="h-8 w-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              Générateur de Données de Test IA
            </h1>
          </div>
          <p className="text-gray-600">
            Utilisez l'IA Azure pour générer des données de test réalistes et
            contextualisées pour la Côte d'Ivoire
          </p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Données générées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_generated}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tokens IA utilisés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_tokens_used.toLocaleString()}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Templates actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.templates_active}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Noms ivoiriens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.names_database_size}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Erreur</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Succès</p>
              <p className="text-sm text-green-600">{success}</p>
            </div>
            {generatedData && (
              <button
                onClick={downloadGeneratedData}
                className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger JSON</span>
              </button>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Générer des données de test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dataTypeButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.type}
                  onClick={() => generateTestData(btn.type)}
                  disabled={loading}
                  className={`relative p-6 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                    loading
                      ? 'opacity-50 cursor-not-allowed border-gray-300'
                      : `border-${btn.color}-200 hover:border-${btn.color}-400`
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 bg-${btn.color}-100 rounded-lg`}
                    >
                      <Icon className={`h-6 w-6 text-${btn.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {btn.label}
                      </h3>
                      <p className="text-sm text-gray-600">{btn.description}</p>
                    </div>
                  </div>
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                      <Loader className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {generatedData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Données générées
              </h2>
              <span className="text-sm text-gray-500">
                Toutes les données contiennent des mentions légales appropriées
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
              <pre className="text-xs text-gray-800">
                {JSON.stringify(generatedData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <span>Mentions légales automatiques</span>
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 ml-7">
            <li>• Tous les documents générés incluent "COPIE NON CONFORME - DOCUMENT DE TEST"</li>
            <li>• Les noms utilisés sont authentiques mais générés aléatoirement</li>
            <li>• Les données sont marquées comme données de test dans la base</li>
            <li>• Les numéros de téléphone et emails sont fictifs (.test.montoit.ci)</li>
            <li>• Parfait pour les démonstrations et tests sans risque légal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
