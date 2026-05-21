import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/services/api';

export function ChangePassword() {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPass !== confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPass.length < 4) {
      setMessage({ type: 'error', text: 'New password must be at least 4 characters' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; error?: string; message?: string }>(
        '/admin/change-password',
        {
          current_password: current,
          new_password: newPass,
          confirm_password: confirm,
        }
      );
      if (res.success) {
        setMessage({
          type: 'success',
          text: res.message ?? 'Password updated successfully.',
        });
        setCurrent('');
        setNewPass('');
        setConfirm('');
      } else {
        setMessage({ type: 'error', text: res.error ?? 'Failed to update password' });
      }
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update password';
      setMessage({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">Update your admin password</p>
      </div>
      <Card className="max-w-md">
        <CardHeader title="New password" />
        {message ? (
          <div
            className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {message.text}
          </div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              autoComplete="new-password"
              required
              minLength={4}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              autoComplete="new-password"
              required
              minLength={4}
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
