import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, NotificationPreferences as NotificationPreferencesType } from '../services/notificationService';
import {
  Bell, Mail, MessageSquare, Smartphone, Clock,
  CheckCircle, Save
} from 'lucide-react';

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const data = await notificationService.getPreferences();
      if (data) {
        setPreferences(data);
      } else {
        setPreferences({
          id: '',
          user_id: user?.id || '',
          email_enabled: true,
          sms_enabled: true,
          whatsapp_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          email_types: ['all'],
          sms_types: ['payment_reminder', 'visit_reminder', 'contract_expiring'],
          whatsapp_types: ['payment_received', 'visit_scheduled', 'contract_signed'],
          push_types: ['message_received', 'application_received'],
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00:00',
          quiet_hours_end: '08:00:00',
          whatsapp_phone: null
        });
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences || !user) return;

    setSaving(true);
    setSuccess(false);

    try {
      await notificationService.updatePreferences({
        ...preferences,
        user_id: user.id
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferencesType) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: !(preferences[field] as boolean)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
            <Bell className="w-10 h-10 text-terracotta-600" />
            <span>Préférences de notifications</span>
          </h1>
          <p className="text-xl text-gray-600">
            Gérez vos préférences de notifications multi-canaux
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Préférences enregistrées avec succès !</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="card-scrapbook p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span>Canaux de notification</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-gray-900">Notifications In-App</p>
                    <p className="text-sm text-gray-600">Notifications dans l'application</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.in_app_enabled}
                    onChange={() => handleToggle('in_app_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">Notifications par email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={() => handleToggle('email_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="font-bold text-gray-900">SMS</p>
                    <p className="text-sm text-gray-600">Notifications par SMS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.sms_enabled}
                    onChange={() => handleToggle('sms_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold text-gray-900 flex items-center space-x-2">
                      <span>WhatsApp</span>
                      <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">NOUVEAU</span>
                    </p>
                    <p className="text-sm text-gray-600">Notifications par WhatsApp via InTouch</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.whatsapp_enabled}
                    onChange={() => handleToggle('whatsapp_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {preferences.whatsapp_enabled && (
                <div className="ml-9 p-4 bg-white rounded-lg border-2 border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro WhatsApp (optionnel)
                  </label>
                  <input
                    type="tel"
                    value={preferences.whatsapp_phone || ''}
                    onChange={(e) => setPreferences({ ...preferences, whatsapp_phone: e.target.value })}
                    className="input-scrapbook w-full"
                    placeholder="Ex: 0707070707"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si vide, le numéro de votre profil sera utilisé
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-orange-600" />
                  <div>
                    <p className="font-bold text-gray-900">Push</p>
                    <p className="text-sm text-gray-600">Notifications push mobile</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push_enabled}
                    onChange={() => handleToggle('push_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="card-scrapbook p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-6 h-6 text-purple-600" />
              <span>Heures silencieuses</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-bold text-gray-900">Activer les heures silencieuses</p>
                  <p className="text-sm text-gray-600">Pas de notifications pendant ces heures</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quiet_hours_enabled}
                    onChange={() => handleToggle('quiet_hours_enabled')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Début
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
                      className="input-scrapbook w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fin
                    </label>
                    <input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
                      className="input-scrapbook w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
