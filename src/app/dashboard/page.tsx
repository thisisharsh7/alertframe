'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Bell, Plus, Clock, CheckCircle, Pause, Trash2, Play, Edit } from 'lucide-react';
import Link from 'next/link';
import BellLoader from '@/components/BellLoader';

interface Alert {
  id: string;
  url: string;
  cssSelector: string;
  elementType: string;
  title: string | null;
  frequencyMinutes: number;
  frequencyLabel: string | null;
  lastCheckedAt: Date | null;
  nextCheckAt: Date | null;
  status: string;
  createdAt: Date;
  _count: {
    changes: number;
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFrequencyMinutes, setEditFrequencyMinutes] = useState<number>(600);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const created = searchParams?.get('created');
    if (created) {
      setJustCreated(created);
      setTimeout(() => setJustCreated(null), 5000);
    }
    if (status === 'authenticated') {
      fetchAlerts();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [searchParams, status]);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.status === 401) {
        // Unauthorized - redirect to sign in
        router.push('/');
        return;
      }
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // No need for formatFrequency - we display frequencyLabel directly!

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100';
    }
  };

  const toggleAlertStatus = async (alertId: string, currentStatus: string) => {
    setTogglingId(alertId);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchAlerts();
      } else {
        alert('Failed to update alert status');
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      alert('Failed to update alert status');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteAlert = (alert: Alert) => {
    setAlertToDelete(alert);
    setShowDeleteModal(true);
  };

  const deleteAlert = async () => {
    if (!alertToDelete) return;

    setDeletingId(alertToDelete.id);
    try {
      const response = await fetch(`/api/alerts/${alertToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAlerts();
        setShowDeleteModal(false);
        setAlertToDelete(null);
      } else {
        alert('Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert');
    } finally {
      setDeletingId(null);
    }
  };

  const updateFrequency = async (alertId: string, frequencyMinutes: number, label: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequencyMinutes,
          frequencyLabel: label,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        await fetchAlerts();
      } else {
        alert('Failed to update check frequency');
      }
    } catch (error) {
      console.error('Error updating frequency:', error);
      alert('Failed to update check frequency');
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center">
            <BellLoader />
          </div>
          <p className="mt-4 text-[14px] font-bold uppercase tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <div className="max-w-md w-full border-[3px] border-black bg-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-10 h-10" />
            <h1 className="text-[32px] font-black uppercase tracking-tight">Sign In Required</h1>
          </div>
          <p className="text-[16px] font-medium mb-6 leading-relaxed">
            You need to sign in to view your alerts and monitor website changes.
          </p>
          <button
            onClick={() => {
              setIsSigningIn(true);
              setTimeout(() => {
                signIn('google', { callbackUrl: '/dashboard' }).catch(() => setIsSigningIn(false));
              }, 0);
            }}
            disabled={isSigningIn}
            className="w-full bg-black text-white py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-[#FFE500] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full mt-3 bg-white text-black py-3 px-4 text-[14px] font-bold uppercase tracking-wide border-[3px] border-black hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-[3px] border-black">
        <div className="max-w-[1400px] mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 group cursor-pointer">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12">
                <path d="M14 4C11 4 9 6 9 9V13L7 17H21L19 13V9C19 6 17 4 14 4Z" fill="#FFE500" stroke="#000000" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M12 17V18C12 19.1 12.9 20 14 20C15.1 20 16 19.1 16 18V17" stroke="#000000" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="19" cy="7.5" r="3" fill="#FF3366" stroke="#000000" strokeWidth="2"/>
              </svg>
              <span className="text-[18px] font-black tracking-tight uppercase leading-none">AlertFrame</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
              >
                Settings
              </Link>
              <Link
                href="/"
                className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px] flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Alert
              </Link>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-12 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FFE500] border-[3px] border-black shadow-[6px_6px_0_0_#000]">
              <Bell className="w-12 h-12 text-black animate-pulse" />
            </div>
          </div>
        ) : alerts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FFE500] border-[3px] border-black shadow-[6px_6px_0_0_#000] mb-8">
              <Bell className="w-12 h-12 text-black" />
            </div>
            <h2 className="text-[48px] font-black uppercase mb-4 tracking-tight">
              No Alerts Yet
            </h2>
            <p className="text-[18px] font-medium mb-8 max-w-md mx-auto">
              Create your first alert to start monitoring websites for changes.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-3 px-8 py-4 text-[15px] font-bold uppercase tracking-wide border-[3px] border-black bg-black text-white hover:bg-[#FFE500] hover:text-black transition-all duration-200 active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Plus className="w-5 h-5" />
              Create First Alert
            </Link>
          </div>
        ) : (
          /* Alerts Grid */
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[32px] font-black uppercase tracking-tight">
                Your Alerts ({alerts.length})
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white border-[3px] border-black p-6 shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_0_#000] transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-[18px] mb-2 truncate uppercase tracking-tight">
                        {alert.title || `Monitor ${new URL(alert.url).hostname}`}
                      </h3>
                      <p className="text-[13px] font-medium opacity-60 truncate mb-3">
                        {alert.url}
                      </p>
                      <span className={`inline-block px-3 py-1 border-[2px] border-black text-[11px] font-bold uppercase tracking-wide ${
                        alert.status === 'active' ? 'bg-[#00FF00]' :
                        alert.status === 'paused' ? 'bg-[#FFE500]' :
                        'bg-[#FF3366] text-white'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    {editingId === alert.id ? (
                      <div className="bg-[#F5F5F5] p-3 border-[2px] border-black">
                        <label className="block text-[12px] font-black uppercase tracking-wide mb-2">
                          Check Frequency
                        </label>
                        <select
                          value={editFrequencyMinutes}
                          onChange={(e) => setEditFrequencyMinutes(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border-[2px] border-black bg-white text-[14px] font-bold uppercase mb-2 cursor-pointer hover:bg-white focus:outline-none focus:shadow-[2px_2px_0_0_#000] transition-all"
                        >
                          <optgroup label="Minutes">
                            <option value="1">Every 1 minute</option>
                            <option value="2">Every 2 minutes</option>
                            <option value="5">Every 5 minutes</option>
                            <option value="10">Every 10 minutes</option>
                            <option value="20">Every 20 minutes</option>
                            <option value="30">Every 30 minutes</option>
                          </optgroup>
                          <optgroup label="Hours">
                            <option value="60">Every hour</option>
                            <option value="360">Every 6 hours</option>
                            <option value="600">Every 10 hours</option>
                            <option value="1440">Daily</option>
                            <option value="10080">Weekly</option>
                          </optgroup>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const select = document.querySelector(`select[value="${editFrequencyMinutes}"]`) as HTMLSelectElement;
                              const label = select?.selectedOptions[0]?.text || `Every ${editFrequencyMinutes} minutes`;
                              updateFrequency(alert.id, editFrequencyMinutes, label);
                            }}
                            className="flex-1 px-4 py-2 bg-black text-white text-[13px] font-bold uppercase tracking-wide border-[2px] border-black hover:bg-[#00FF00] hover:text-black transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-4 py-2 border-[2px] border-black bg-white text-[13px] font-bold uppercase tracking-wide hover:bg-black hover:text-white transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[13px] font-bold opacity-70">
                          <Clock className="w-4 h-4" />
                          <span className="uppercase tracking-wide">
                            {alert.frequencyLabel || `Every ${alert.frequencyMinutes} minutes`}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingId(alert.id);
                            setEditFrequencyMinutes(alert.frequencyMinutes);
                          }}
                          className="p-1 hover:bg-black hover:text-white transition-all border-[2px] border-transparent hover:border-black"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {alert._count.changes > 0 && (
                      <div className="flex items-center gap-2 text-[13px] font-bold">
                        <div className="px-2 py-1 bg-[#FF3366] border-[2px] border-black text-white flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          <span className="uppercase tracking-wide">{alert._count.changes} Changes</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[12px] font-medium opacity-60 mb-4 space-y-1 bg-[#F5F5F5] p-3 border-[2px] border-black">
                    <p><strong>Last:</strong> {formatDate(alert.lastCheckedAt)}</p>
                    <p><strong>Next:</strong> {formatDate(alert.nextCheckAt)}</p>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => toggleAlertStatus(alert.id, alert.status)}
                      disabled={togglingId === alert.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide border-[2px] border-black bg-white hover:bg-black hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      {togglingId === alert.id ? (
                        <div className="w-4 h-4 border-[2px] border-current border-t-transparent animate-spin rounded-full"></div>
                      ) : alert.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => confirmDeleteAlert(alert)}
                      disabled={deletingId === alert.id}
                      className="px-4 py-2.5 text-[13px] font-bold uppercase tracking-wide border-[2px] border-black bg-[#FF3366] text-white hover:bg-black hover:border-black transition-all disabled:opacity-40 disabled:cursor-not-allowed active:translate-x-[1px] active:translate-y-[1px]"
                    >
                      {deletingId === alert.id ? (
                        <div className="w-4 h-4 border-[2px] border-white border-t-transparent animate-spin rounded-full"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t-[3px] border-black mt-16 py-2 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-60">
            © 2025 AlertFrame
          </p>
        </div>
      </footer>

      {/* Delete Alert Confirmation Modal */}
      {showDeleteModal && alertToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-[#FF3366] max-w-sm w-full p-6">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#FF3366] border-[3px] border-black flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-[20px] font-black uppercase tracking-tight text-center mb-3 text-[#FF3366]">
              Delete Alert?
            </h2>

            {/* Alert Info */}
            <div className="border-[2px] border-[#FF3366] bg-[#FFF5F7] p-3 mb-4">
              <p className="text-[12px] font-bold uppercase tracking-wide mb-1 text-[#FF3366]">
                ⚠️ This cannot be undone!
              </p>
              <p className="text-[13px] font-medium truncate">
                <strong className="font-black">{alertToDelete.title || new URL(alertToDelete.url).hostname}</strong>
              </p>
              <p className="text-[11px] font-medium opacity-70 mt-1">
                All snapshots and change history will be deleted.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAlertToDelete(null);
                }}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide border-[3px] border-black bg-white hover:bg-black hover:text-white transition-all duration-200 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={deleteAlert}
                disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wide border-[3px] border-[#FF3366] bg-[#FF3366] text-white hover:bg-black hover:border-black transition-all duration-200 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deletingId ? (
                  <>
                    <div className="w-3 h-3 border-[2px] border-white border-t-transparent animate-spin rounded-full"></div>
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
