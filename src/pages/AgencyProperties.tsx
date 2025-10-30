import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Home, User, Calendar, MapPin, DollarSign, Eye } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  city: string;
  price: number;
  status: string;
}

interface Assignment {
  id: string;
  property_id: string;
  agent_id: string;
  assigned_at: string;
  properties: Property;
  profiles: {
    full_name: string;
  };
}

export default function AgencyProperties() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');

  useEffect(() => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!agencyData) {
        window.location.href = '/agence/inscription';
        return;
      }

      setAgency(agencyData);

      const { data: assignmentsData } = await supabase
        .from('property_assignments')
        .select('*, properties(id, title, city, price, status), profiles(full_name)')
        .eq('agency_id', agencyData.id)
        .order('assigned_at', { ascending: false });

      setAssignments(assignmentsData || []);

      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', 'disponible');

      setAvailableProperties(propertiesData || []);

      const { data: membersData } = await supabase
        .from('agency_team_members')
        .select('*, profiles(id, full_name)')
        .eq('agency_id', agencyData.id)
        .eq('status', 'active');

      setTeamMembers(membersData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agency || !selectedProperty || !selectedAgent) return;

    try {
      const { error } = await supabase
        .from('property_assignments')
        .insert({
          agency_id: agency.id,
          property_id: selectedProperty,
          agent_id: selectedAgent
        });

      if (error) throw error;

      alert('Propriété assignée avec succès !');
      setShowAssignModal(false);
      setSelectedProperty('');
      setSelectedAgent('');
      loadData();
    } catch (err: any) {
      console.error('Error assigning property:', err);
      alert(err.message || 'Erreur lors de l\'assignation');
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('Retirer cette assignation ?')) return;

    try {
      const { error } = await supabase
        .from('property_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      loadData();
    } catch (err) {
      console.error('Error unassigning:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
              <Home className="w-10 h-10 text-terracotta-600" />
              <span>Gestion des Propriétés</span>
            </h1>
            <p className="text-xl text-gray-600">{agency?.name}</p>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn-primary"
          >
            Assigner une propriété
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-scrapbook p-6">
            <Home className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
            <p className="text-sm text-gray-600">Propriétés assignées</p>
          </div>

          <div className="card-scrapbook p-6">
            <User className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
            <p className="text-sm text-gray-600">Agents disponibles</p>
          </div>

          <div className="card-scrapbook p-6">
            <Eye className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{availableProperties.length}</p>
            <p className="text-sm text-gray-600">Propriétés disponibles</p>
          </div>
        </div>

        <div className="card-scrapbook p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Assignations actives</h3>
          <div className="space-y-4">
            {assignments.map(assignment => (
              <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">{assignment.properties.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{assignment.properties.city}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{assignment.properties.price.toLocaleString('fr-FR')} FCFA</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{assignment.profiles.full_name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(assignment.assigned_at).toLocaleDateString('fr-FR')}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnassign(assignment.id)}
                  className="btn-secondary text-sm"
                >
                  Retirer
                </button>
              </div>
            ))}

            {assignments.length === 0 && (
              <div className="text-center py-12">
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Aucune assignation</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Assigner une propriété</h3>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Propriété
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  required
                  className="input-scrapbook w-full"
                >
                  <option value="">Sélectionner une propriété</option>
                  {availableProperties.map(prop => (
                    <option key={prop.id} value={prop.id}>
                      {prop.title} - {prop.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent
                </label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  required
                  className="input-scrapbook w-full"
                >
                  <option value="">Sélectionner un agent</option>
                  {teamMembers.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profiles.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Assigner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
