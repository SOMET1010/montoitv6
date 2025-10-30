import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

interface StartConversationButtonProps {
  ownerId: string;
  propertyId?: string;
  ownerName?: string;
}

export default function StartConversationButton({
  ownerId,
  propertyId,
  ownerName
}: StartConversationButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const startConversation = async () => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    if (user.id === ownerId) {
      alert('Vous ne pouvez pas vous envoyer un message à vous-même');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_conversation', {
          p_user1_id: user.id,
          p_user2_id: ownerId,
          p_property_id: propertyId || null
        });

      if (error) throw error;

      window.location.href = '/messages';
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Erreur lors de la création de la conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={startConversation}
      disabled={loading}
      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <MessageCircle className="w-5 h-5" />
      <span>{loading ? 'Chargement...' : `Contacter ${ownerName || 'le propriétaire'}`}</span>
    </button>
  );
}
