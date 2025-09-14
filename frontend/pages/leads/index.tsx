import { withAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import LeadList from '@/components/LeadList';
import { useState, useRef } from 'react';
import LeadEditorModal from '@/components/LeadEditorModal';
import { Lead } from '@/lib/leads';

function LeadsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const leadListRef = useRef<{ refreshLeads: () => void }>(null);

  const handleCreateLead = () => {
    setEditingLead(undefined);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = (savedLead: Lead) => {
    setIsModalOpen(false);
    setEditingLead(undefined);
    // Trigger a refresh of the lead list
    if (leadListRef.current) {
      leadListRef.current.refreshLeads();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">Manage your leads and prospects</p>
          </div>
          <button
            onClick={handleCreateLead}
            className="btn-primary mt-4 sm:mt-0"
          >
            Add New Lead
          </button>
        </div>

        <div className="card">
          <LeadList ref={leadListRef} onEditLead={handleEditLead} />
        </div>

        <LeadEditorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(undefined);
          }}
          onSave={handleSaveLead}
          lead={editingLead}
        />
      </div>
    </Layout>
  );
}

export default withAuth(LeadsPage);
