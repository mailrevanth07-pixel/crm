import { withAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import ActivityTimeline from '@/components/ActivityTimeline';
import AddActivityForm from '@/components/AddActivityForm';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Lead, leadsApi } from '@/lib/leads';

function LeadDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLead = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const leadData = await leadsApi.getLead(id as string);
      setLead(leadData);
    } catch (err: any) {
      console.error('Error loading lead:', err);
      // Fallback to mock lead for development
      const mockLead: Lead = {
        id: id as string,
        title: 'John Doe - Acme Corp',
        description: 'Interested in our premium package for their new project. Budget approved and ready for next steps.',
        status: 'QUALIFIED',
        owner: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        },
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T10:00:00Z',
      };
      setLead(mockLead);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id]);

  const handleActivityAdded = () => {
    // Activity will be added to timeline via real-time updates
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading lead...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error loading lead</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadLead}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Lead not found</h1>
            <p className="text-gray-600">The lead you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.title}</h1>
            <p className="text-gray-600">Owner: {lead.owner?.name || 'Unassigned'}</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button className="btn-secondary">Edit Lead</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{lead.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    lead.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                    lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                    lead.status === 'QUALIFIED' ? 'bg-green-100 text-green-800' :
                    lead.status === 'PROPOSAL' ? 'bg-purple-100 text-purple-800' :
                    lead.status === 'NEGOTIATION' ? 'bg-orange-100 text-orange-800' :
                    lead.status === 'CLOSED_WON' ? 'bg-green-100 text-green-800' :
                    lead.status === 'CLOSED_LOST' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {lead.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Owner</label>
                  <p className="text-gray-900">{lead.owner?.name || 'Unassigned'} ({lead.owner?.email || 'N/A'})</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{new Date(lead.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{new Date(lead.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              </div>
            </div>

            <AddActivityForm 
              leadId={lead.id} 
              onActivityAdded={handleActivityAdded}
            />
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
              <ActivityTimeline leadId={lead.id} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(LeadDetail);
