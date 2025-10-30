import { useState } from 'react';
import { MessageSquare, Send, FileText, Clock, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'visite' | 'information' | 'negociation' | 'maintenance';
  userType: 'locataire' | 'proprietaire' | 'all';
}

interface MessageTemplatesProps {
  onSelect: (content: string) => void;
}

export default function MessageTemplates({ onSelect }: MessageTemplatesProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const templates: MessageTemplate[] = [
    {
      id: 't1',
      title: 'Demande de visite',
      content: 'Bonjour, je suis intéressé(e) par votre propriété. Serait-il possible d\'organiser une visite ? Je suis disponible cette semaine. Merci.',
      category: 'visite',
      userType: 'locataire'
    },
    {
      id: 't2',
      title: 'Demande d\'informations',
      content: 'Bonjour, pourriez-vous me donner plus d\'informations sur les équipements disponibles et les charges mensuelles ? Merci.',
      category: 'information',
      userType: 'locataire'
    },
    {
      id: 't3',
      title: 'Négociation de prix',
      content: 'Bonjour, votre propriété m\'intéresse beaucoup. Seriez-vous ouvert(e) à une discussion sur le montant du loyer ? Je cherche une location longue durée.',
      category: 'negociation',
      userType: 'locataire'
    },
    {
      id: 't4',
      title: 'Confirmer disponibilité',
      content: 'Bonjour, merci pour votre intérêt. Le bien est toujours disponible. Quand souhaiteriez-vous effectuer une visite ?',
      category: 'visite',
      userType: 'proprietaire'
    },
    {
      id: 't5',
      title: 'Demander documents',
      content: 'Bonjour, pour finaliser votre candidature, merci de fournir les documents suivants : copie CNI, justificatif de revenus, et références de précédents propriétaires.',
      category: 'information',
      userType: 'proprietaire'
    },
    {
      id: 't6',
      title: 'Accepter candidature',
      content: 'Bonjour, j\'ai le plaisir de vous informer que votre candidature a été retenue. Je vous propose de procéder à la signature du bail. Êtes-vous disponible cette semaine ?',
      category: 'information',
      userType: 'proprietaire'
    },
    {
      id: 't7',
      title: 'Problème urgent',
      content: 'Bonjour, je vous contacte pour un problème urgent nécessitant votre intervention. Merci de me rappeler dès que possible.',
      category: 'maintenance',
      userType: 'locataire'
    },
    {
      id: 't8',
      title: 'Intervention planifiée',
      content: 'Bonjour, votre demande a été prise en compte. J\'ai programmé une intervention pour résoudre le problème. Je vous tiendrai informé(e) de l\'avancement.',
      category: 'maintenance',
      userType: 'proprietaire'
    }
  ];

  const getFilteredTemplates = () => {
    return templates.filter(t =>
      t.userType === 'all' || t.userType === profile?.user_type
    );
  };

  const getCategoryIcon = (category: MessageTemplate['category']) => {
    switch (category) {
      case 'visite':
        return <Calendar className="h-4 w-4" />;
      case 'information':
        return <FileText className="h-4 w-4" />;
      case 'negociation':
        return <MapPin className="h-4 w-4" />;
      case 'maintenance':
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: MessageTemplate['category']) => {
    switch (category) {
      case 'visite':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'information':
        return 'bg-olive-50 text-olive-700 border-olive-200';
      case 'negociation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'maintenance':
        return 'bg-coral-50 text-coral-700 border-coral-200';
    }
  };

  const filteredTemplates = getFilteredTemplates();

  if (filteredTemplates.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm font-medium text-gray-700"
      >
        <FileText className="h-4 w-4" />
        <span>Modèles de messages</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-terracotta-50 to-coral-50 sticky top-0">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-terracotta-600" />
                <h3 className="font-bold text-gray-900">Messages prédéfinis</h3>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Cliquez pour utiliser un modèle
              </p>
            </div>

            <div className="p-3 space-y-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template.content);
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-terracotta-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm group-hover:text-terracotta-600 transition-colors">
                      {template.title}
                    </h4>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(template.category)}`}>
                      {getCategoryIcon(template.category)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.content}
                  </p>
                  <div className="mt-2 flex items-center justify-end">
                    <span className="text-xs text-terracotta-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                      <Send className="h-3 w-3" />
                      <span>Utiliser</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
