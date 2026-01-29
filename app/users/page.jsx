'use client';

import CreateUserModal from '../components/CreateUserModal';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Cookies from 'js-cookie';
import { authApi } from '../../api/ApiWrapper';



export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('benutzerverwaltung');
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAdminAccess = async () => {
    try {
      if (!authApi.isAuthenticated()) {
        router.push('/');
        return;
      }

      const userData = await authApi.getCurrentUser();
      setCurrentUser(userData);

      if (!userData.is_admin) {
        router.push('/dashboard');
        return;
      }

      fetchUsers();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.push('/');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:8000/api/auth/users/', {
        headers: {
          Authorization: `Bearer ${Cookies.get('access_token')}`,
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setErrorMsg(`Fehler beim Laden (Status ${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMsg('Netzwerkfehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
  const roleRank = (u) => {
    if (u.is_creator) return 0;
    if (u.is_admin) return 1;
    return 2;
  };

  const roleDiff = roleRank(a) - roleRank(b);
  if (roleDiff !== 0) return roleDiff;

  return a.username.localeCompare(b.username, undefined, {
    sensitivity: 'base',
  });
});
  // toggle is shown ONLY for Mitarbeiter:
  // is_admin === false AND is_creator === false
  const isMitarbeiter = (u) => !u.is_admin && !u.is_creator;

  const toggleUserActive = async (user) => {
    if (!currentUser) return;

    // hard guard: only Mitarbeiter can be toggled
    if (!isMitarbeiter(user)) return;

    // optional: don't toggle yourself
    if (user.id === currentUser.id) return;

    setErrorMsg('');

    // optimistic update
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.add(user.id);
      return next;
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
    );

    try {
        const firmId = currentUser?.firm?.id ?? currentUser?.firm;

      const res = await fetch(
        `http://localhost:8000/api/auth/toggle_active/?firm=${encodeURIComponent(firmId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Cookies.get('access_token')}`,
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );

      if (!res.ok) {
        // rollback
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
        );

        let msg = `Toggle fehlgeschlagen (Status ${res.status})`;
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {}
        setErrorMsg(msg);
      }
    } catch (err) {
      // rollback
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
      console.error('Error toggling user:', err);
      setErrorMsg('Netzwerkfehler beim Umschalten');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
            <p className="text-gray-600 mt-1">Verwalten Sie Mitarbeiter Ihrer Firma</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            + Neuer Benutzer
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMsg}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Farbe</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">E-Mail</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rolle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {sortedUsers.map((user) => {
                const showToggle = isMitarbeiter(user);
                const isBusy = togglingIds.has(user.id);

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: `#${user.hex_color || 'CCCCCC'}` }}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        {(user.first_name || user.last_name) && (
                          <p className="text-sm text-gray-600">
                            {user.first_name} {user.last_name}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-700">{user.email}</td>

                    <td className="px-6 py-4">
                      {user.is_creator ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black text-white">
                          Ersteller
                        </span>
                      ) : user.is_admin ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-white">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                          Mitarbeiter
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            user.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.is_active ? 'Aktiv' : 'Inaktiv'}
                        </span>

                        {showToggle && (
                          <button
                            type="button"
                            onClick={() => toggleUserActive(user)}
                            disabled={isBusy}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              user.is_active ? 'bg-green-600' : 'bg-gray-300'
                            } ${isBusy ? 'opacity-70 cursor-wait' : ''}`}
                            title="Aktiv/Inaktiv umschalten"
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                user.is_active ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}

                        {isBusy && <span className="text-xs text-gray-500">speichern…</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Benutzer gefunden</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchUsers();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}
