import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

function randomPassword(length: number = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

interface PasswordsData {
  has_visiting: boolean;
  has_company: boolean;
  visiting_password: string | null;
  company_password: string | null;
}

const initialPasswords: PasswordsData = {
  has_visiting: false,
  has_company: false,
  visiting_password: null,
  company_password: null,
};

export function SupervisorAssessmentPasswordsPage() {
  const [passwords, setPasswords] = useState<PasswordsData>(initialPasswords);
  const [loading, setLoading] = useState(true);
  const [visitingPassword, setVisitingPassword] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState<'visiting' | 'company' | null>(null);

  const fetchPasswords = () => {
    return api
      .get<PasswordsData>('/supervisor/assessment-passwords')
      .then((data) => {
        setPasswords({
          has_visiting: data.has_visiting ?? false,
          has_company: data.has_company ?? false,
          visiting_password: data.visiting_password ?? null,
          company_password: data.company_password ?? null,
        });
      })
      .catch(() => setPasswords(initialPasswords));
  };

  useEffect(() => {
    fetchPasswords().finally(() => setLoading(false));
  }, []);

  const savePassword = async (type: 'visiting' | 'company', password: string) => {
    if (!password.trim()) return;
    setMessage(null);
    setSaving(type);
    try {
      const res = await api.post<{ success: boolean; error?: string; message?: string }>('/supervisor/assessment-passwords', {
        type,
        password: password.trim(),
      });
      if (res.success) {
        setMessage({ type: 'success', text: res.message ?? 'Password saved. You can see it below.' });
        if (type === 'visiting') setVisitingPassword('');
        else setCompanyPassword('');
        await fetchPasswords();
      } else {
        setMessage({ type: 'error', text: res.error ?? 'Failed to save' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;

  return (
    <div className="page-stack">
      <div>
        <h1 className="page-title">Assessment passwords</h1>
        <p className="page-subtitle">
          Set passwords used when opening the assessment forms from the student portal.
        </p>
        <p className="mt-2 rounded-lg border border-primary-200 bg-primary-50/50 px-4 py-2 text-sm font-medium text-slate-700">
          These passwords apply only to students assigned to you. A password will not work for a student who is not on your assigned list.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader title="Your visiting assessment password" />
          <p className="mb-3 text-sm text-slate-600">
            Use this when you open &quot;Visiting Supervisor Assessment&quot; from a student&apos;s dashboard. Works only for students assigned to you.
          </p>
          {passwords.visiting_password ? (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-slate-500">Current password (share only with yourself)</p>
              <input
                type="text"
                readOnly
                value={passwords.visiting_password}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800"
              />
            </div>
          ) : (
            <p className="mb-3 text-xs font-medium text-amber-700">Not set — set one below.</p>
          )}
          <p className="mb-2 text-xs font-medium text-slate-500">Set or update password</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={visitingPassword}
              onChange={(e) => setVisitingPassword(e.target.value)}
              placeholder="Enter or generate new password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => setVisitingPassword(randomPassword())}>
              Generate
            </Button>
            <Button size="sm" disabled={!visitingPassword.trim() || saving === 'visiting'} onClick={() => savePassword('visiting', visitingPassword)}>
              {saving === 'visiting' ? 'Saving…' : passwords.has_visiting ? 'Update' : 'Save'}
            </Button>
          </div>
        </Card>

        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader title="Company supervisor password" />
          <p className="mb-3 text-sm text-slate-600">
            Give this to company supervisors so they can open &quot;Company Supervisor Assessment&quot; from the student&apos;s dashboard. Works only for students assigned to you. Students share the link and this password with their company supervisor.
          </p>
          {passwords.company_password ? (
            <div className="mb-3">
              <p className="mb-1 text-xs font-medium text-slate-500">Current password (share with company supervisors)</p>
              <input
                type="text"
                readOnly
                value={passwords.company_password}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-800"
              />
            </div>
          ) : (
            <p className="mb-3 text-xs font-medium text-amber-700">Not set — set one below.</p>
          )}
          <p className="mb-2 text-xs font-medium text-slate-500">Set or update password</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={companyPassword}
              onChange={(e) => setCompanyPassword(e.target.value)}
              placeholder="Enter or generate new password"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <Button size="sm" variant="outline" onClick={() => setCompanyPassword(randomPassword())}>
              Generate
            </Button>
            <Button size="sm" disabled={!companyPassword.trim() || saving === 'company'} onClick={() => savePassword('company', companyPassword)}>
              {saving === 'company' ? 'Saving…' : passwords.has_company ? 'Update' : 'Save'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
