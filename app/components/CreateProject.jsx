"use client"
import { useState, useEffect } from "react";
import Cookies from 'js-cookie';

export default function CreateProject({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    partner: '',
    is_one_time: true,
    recurrence_pattern: '',
    start_date: getFirstDayOfMonth(),
    end_date: ''
  });
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFirms();
    }
  }, [isOpen]);

  const fetchFirms = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/organisation/firms/', {
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFirms(data);
      }
    } catch (err) {
      console.error('Error fetching firms:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createProject();
  };

  const createProject = async () => {
    setLoading(true);
    setError('');

    const projectData = {
      name: formData.name,
      partner: parseInt(formData.partner),
      is_one_time: formData.is_one_time,
      start_date: formData.start_date,
    };

    if (!formData.is_one_time && formData.recurrence_pattern) {
      projectData.recurrence_pattern = formData.recurrence_pattern;
    }

    if (formData.end_date) {
      projectData.end_date = formData.end_date;
    }

    try {
      const response = await fetch('http://localhost:8000/api/organisation/projects/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Cookies.get('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        setFormData({
          name: '',
          partner: '',
          is_one_time: true,
          recurrence_pattern: '',
          start_date: getFirstDayOfMonth(),
          end_date: ''
        });
      } else {
        if (typeof data === 'object') {
          const errorMessages = Object.entries(data)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join('\n');
          setError(errorMessages);
        } else {
          setError(data.error || 'Ein Fehler ist aufgetreten');
        }
      }
    } catch (err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
      console.error('Error creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Neues Projekt</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 whitespace-pre-line">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Projektname *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Monatsabschluss Steuerberater"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner *
              </label>
              <select
                required
                value={formData.partner}
                onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Partner auswählen...</option>
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anfangsdatum *
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_one_time"
                checked={formData.is_one_time}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  is_one_time: e.target.checked,
                  recurrence_pattern: e.target.checked ? '' : formData.recurrence_pattern
                })}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
              />
              <label htmlFor="is_one_time" className="text-sm font-medium text-gray-700">
                Einmaliges Projekt
              </label>
            </div>

            {!formData.is_one_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wiederholungsmuster *
                </label>
                <select
                  required={!formData.is_one_time}
                  value={formData.recurrence_pattern}
                  onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="">Muster auswählen...</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="yearly">Jährlich</option>
                </select>
              </div>
            )}

            {!formData.is_one_time && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enddatum (optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird erstellt...' : 'Projekt erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getFirstDayOfMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}