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
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchFirms = async () => {
    try {
      const response = await fetch('https://cryphos.com/api/organisation/firms/', {
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

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const createProject = async () => {
    setLoading(true);
    setError('');

    const projectData = {
      name: formData.name,
      is_one_time: formData.is_one_time,
      start_date: formData.start_date,
    };

    if (formData.partner) {
      projectData.partner = parseInt(formData.partner);
    }

    if (!formData.is_one_time && formData.recurrence_pattern) {
      projectData.recurrence_pattern = formData.recurrence_pattern;
    }

    if (formData.end_date) {
      projectData.end_date = formData.end_date;
    }

    try {
      const response = await fetch('https://cryphos.com/api/organisation/projects/', {
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

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 transition-all bg-white";
  const selectClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-900 transition-all appearance-none bg-white cursor-pointer";
  const selectStyle = { 
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
    backgroundRepeat: 'no-repeat', 
    backgroundPosition: 'right 12px center', 
    backgroundSize: '20px' 
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Neues Projekt</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm whitespace-pre-line flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Projektname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Monatsabschluss Steuerberater"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Partner <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={formData.partner}
                onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                className={selectClass}
                style={selectStyle}
              >
                <option value="">Kein Partner</option>
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Anfangsdatum <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div 
              className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setFormData({ 
                ...formData, 
                is_one_time: !formData.is_one_time,
                recurrence_pattern: !formData.is_one_time ? '' : formData.recurrence_pattern
              })}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${formData.is_one_time ? 'bg-gray-900' : 'border-2 border-gray-400 bg-white'}`}>
                {formData.is_one_time && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <label className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Einmaliges Projekt
              </label>
            </div>

            <div className={`space-y-5 overflow-hidden transition-all duration-300 ${!formData.is_one_time ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Wiederholungsmuster <span className="text-red-500">*</span>
                </label>
                <select
                  required={!formData.is_one_time}
                  value={formData.recurrence_pattern}
                  onChange={(e) => setFormData({ ...formData, recurrence_pattern: e.target.value })}
                  className={selectClass}
                  style={selectStyle}
                >
                  <option value="">Muster auswählen...</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                  <option value="quarterly">Vierteljährlich</option>
                  <option value="yearly">Jährlich</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Enddatum <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Wird erstellt...</span>
                  </>
                ) : (
                  'Projekt erstellen'
                )}
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