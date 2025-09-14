import { useState } from 'react';
import { CreateActivityData, activitiesApi } from '@/lib/activities';

interface AddActivityFormProps {
  leadId: string;
  onActivityAdded: () => void;
}

export default function AddActivityForm({ leadId, onActivityAdded }: AddActivityFormProps) {
  const [formData, setFormData] = useState<CreateActivityData>({
    leadId,
    type: 'note',
    title: '',
    body: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await activitiesApi.createActivity(formData);
      
      // Reset form
      setFormData({
        leadId,
        type: 'note',
        title: '',
        body: '',
      });
      
      onActivityAdded();
    } catch (err: any) {
      console.error('Error creating activity:', err);
      setError('Failed to create activity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Activity</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              name="type"
              id="type"
              className="input-field mt-1"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
            </select>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              className="input-field mt-1"
              value={formData.title}
              onChange={handleChange}
              placeholder="Activity title"
            />
          </div>
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            name="body"
            id="body"
            required
            rows={3}
            className="input-field mt-1"
            value={formData.body}
            onChange={handleChange}
            placeholder="Describe the activity..."
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                leadId,
                type: 'note',
                title: '',
                body: '',
              });
              setError(null);
            }}
            className="btn-secondary"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding...' : 'Add Activity'}
          </button>
        </div>
      </form>
    </div>
  );
}
