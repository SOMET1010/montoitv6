import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, CheckCircle, XCircle, AlertTriangle, MessageSquare, FileText } from 'lucide-react';
import { disputeService } from '../../services/trustValidationService';
import { useAuth } from '../../contexts/AuthContext';

export default function DisputeDetail() {
  const { disputeId } = useParams<{ disputeId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [dispute, setDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [responding, setResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disputeId) {
      loadDispute();
      loadMessages();
    }
  }, [disputeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadDispute = async () => {
    try {
      setLoading(true);
      const data = await disputeService.getDispute(disputeId!);
      setDispute(data);
    } catch (err) {
      console.error('Erreur chargement litige:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await disputeService.getDisputeMessages(disputeId!);
      setMessages(data);
    } catch (err) {
      console.error('Erreur chargement messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await disputeService.sendDisputeMessage({
        disputeId: disputeId!,
        senderId: profile!.id,
        message: newMessage.trim()
      });

      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Erreur envoi message:', err);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleRespond = async (accepted: boolean) => {
    if (responding) return;

    const confirmMessage = accepted
      ? 'Êtes-vous sûr d\'accepter cette proposition ?'
      : 'Êtes-vous sûr de refuser cette proposition ?';

    if (!confirm(confirmMessage)) return;

    try {
      setResponding(true);
      await disputeService.respondToResolution(disputeId!, profile!.id, accepted);
      await loadDispute();
      await loadMessages();
    } catch (err) {
      console.error('Erreur réponse:', err);
      alert('Erreur lors de la réponse');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Litige introuvable</h2>
          <button
            onClick={() => navigate('/my-disputes')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Retour à mes litiges
          </button>
        </div>
      </div>
    );
  }

  const isOpener = dispute.opened_by === profile?.id;
  const otherParty = isOpener ? dispute.opponent : dispute.opener;
  const property = dispute.leases?.properties;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getDisputeTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'deposit_return': 'Restitution dépôt de garantie',
      'inventory_disagreement': 'Désaccord état des lieux',
      'unpaid_rent': 'Impayés de loyer',
      'maintenance_not_done': 'Maintenance non effectuée',
      'nuisance': 'Nuisances',
      'early_termination': 'Résiliation anticipée',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  const canRespond = dispute.status === 'awaiting_response' &&
                     dispute.resolution_proposed &&
                     (
                       (isOpener && dispute.resolution_accepted_by_opener === null) ||
                       (!isOpener && dispute.resolution_accepted_by_opponent === null)
                     );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/my-disputes')}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à mes litiges
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Dispute Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dispute Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {dispute.dispute_number}
                </h2>
                <p className="text-gray-600">{getDisputeTypeLabel(dispute.dispute_type)}</p>
              </div>

              {property && (
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600 mb-1">Propriété</p>
                  <p className="font-medium text-gray-900">{property.title}</p>
                  <p className="text-sm text-gray-500">{property.address}</p>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Ouvert le</p>
                  <p className="font-medium text-gray-900">{formatDate(dispute.opened_at)}</p>
                </div>

                <div>
                  <p className="text-gray-600">{isOpener ? 'Contre' : 'Par'}</p>
                  <p className="font-medium text-gray-900">
                    {otherParty?.first_name} {otherParty?.last_name}
                  </p>
                </div>

                {dispute.amount_disputed && (
                  <div>
                    <p className="text-gray-600">Montant disputé</p>
                    <p className="font-semibold text-orange-600 text-lg">
                      {formatAmount(dispute.amount_disputed)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-gray-600">Urgence</p>
                  <span className={`
                    inline-block px-2 py-1 rounded-full text-xs font-medium
                    ${dispute.urgency === 'urgent'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                    }
                  `}>
                    {dispute.urgency === 'urgent' ? '🔴 Urgent' : 'Normale'}
                  </span>
                </div>

                {dispute.trust_agents && (
                  <div>
                    <p className="text-gray-600">Médiateur</p>
                    <p className="font-medium text-gray-900">{dispute.trust_agents.full_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Description du litige
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>

              {dispute.evidence_files && dispute.evidence_files.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Preuves jointes ({dispute.evidence_files.length})
                  </p>
                  <div className="space-y-2">
                    {dispute.evidence_files.map((file: string, index: number) => (
                      <a
                        key={index}
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Paperclip className="w-4 h-4" />
                        Pièce jointe {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution Proposal Card */}
            {dispute.resolution_proposed && (
              <div className={`
                rounded-lg shadow-md p-6
                ${canRespond
                  ? 'bg-yellow-50 border-2 border-yellow-300'
                  : 'bg-white'
                }
              `}>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Proposition de résolution
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">
                  {dispute.resolution_proposed}
                </p>

                {canRespond && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-yellow-900">
                      Veuillez répondre à cette proposition :
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRespond(true)}
                        disabled={responding}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-2" />
                        Accepter
                      </button>
                      <button
                        onClick={() => handleRespond(false)}
                        disabled={responding}
                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        <XCircle className="w-4 h-4 inline mr-2" />
                        Refuser
                      </button>
                    </div>
                  </div>
                )}

                {!canRespond && dispute.status === 'awaiting_response' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      En attente de la réponse de l'autre partie...
                    </p>
                  </div>
                )}

                {dispute.status === 'resolved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-900 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Les deux parties ont accepté cette proposition
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Chat */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-[calc(100vh-200px)]">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat de médiation
                </h3>
                <p className="text-sm text-blue-100">
                  Vous, {otherParty?.first_name}
                  {dispute.trust_agents && `, et ${dispute.trust_agents.full_name} (Médiateur)`}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun message pour le moment</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Commencez la conversation avec l'autre partie
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = message.sender_id === profile?.id;
                    const sender = message.profiles;
                    const isMediator = dispute.trust_agents?.user_id === message.sender_id;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`
                          max-w-[70%] rounded-lg p-3
                          ${isMine
                            ? 'bg-blue-600 text-white'
                            : isMediator
                            ? 'bg-green-100 text-gray-900 border-2 border-green-300'
                            : 'bg-gray-100 text-gray-900'
                          }
                        `}>
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`text-xs font-semibold ${isMine ? 'text-blue-100' : 'text-gray-600'}`}>
                              {isMine ? 'Vous' : `${sender?.first_name} ${sender?.last_name}`}
                              {isMediator && ' (Médiateur)'}
                            </p>
                            <p className={`text-xs ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                              {new Date(message.sent_at).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <p className="whitespace-pre-wrap">{message.message}</p>

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((file: string, index: number) => (
                                <a
                                  key={index}
                                  href={file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1 text-xs ${isMine ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-700'}`}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  Pièce jointe
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {dispute.status !== 'resolved' && dispute.status !== 'closed' && dispute.status !== 'escalated' && (
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Écrivez votre message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 inline mr-2" />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(dispute.status === 'resolved' || dispute.status === 'closed' || dispute.status === 'escalated') && (
                <div className="border-t p-4 bg-gray-50">
                  <p className="text-center text-sm text-gray-600">
                    {dispute.status === 'resolved' && '✅ Ce litige a été résolu'}
                    {dispute.status === 'closed' && '🔒 Ce litige est fermé'}
                    {dispute.status === 'escalated' && '⚠️ Ce litige a été escaladé vers un arbitrage externe'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
