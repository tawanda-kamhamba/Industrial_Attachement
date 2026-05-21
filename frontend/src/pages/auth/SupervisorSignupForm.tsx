import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SUPERVISOR_FACULTIES, SUPERVISOR_REGIONS } from '@/constants/supervisor';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

const theme = {
  light: {
    input:
      'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500',
    label: 'block text-sm font-medium text-slate-700',
  },
  dark: {
    input:
      'mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-primary-400 focus:ring-1 focus:ring-primary-400',
    label: 'block text-sm font-medium text-slate-300',
  },
} as const;

export function SupervisorSignupForm({
  onSuccess,
  onCancel,
  variant = 'light',
}: {
  onSuccess?: () => void;
  onCancel: () => void;
  /** Use `dark` when rendered inside the supervisor login signup modal. */
  variant?: keyof typeof theme;
}) {
  const inputClass = theme[variant].input;
  const labelClass = theme[variant].label;
  const navigate = useNavigate();
  const { applyLoggedInUser, login } = useAuth();
  const [full_name, setFull_name] = useState('');
  const [staff_id, setStaff_id] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lecturer_faculty, setLecturer_faculty] = useState('');
  const [lecturer_department, setLecturer_department] = useState('');
  const [lecturer_region_residence, setLecturer_region_residence] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirm_password] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signupCompleteManualLogin, setSignupCompleteManualLogin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (
      !full_name.trim() ||
      !staff_id.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !lecturer_faculty ||
      !lecturer_department.trim() ||
      !lecturer_region_residence ||
      !password ||
      !confirm_password
    ) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm_password) {
      setError('Password and Confirm Password do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<{
        success: boolean;
        error?: string;
        message?: string;
        user?: { id: string; name: string; role: 'supervisor'; staffId: string };
      }>('/auth/supervisor-register', {
        full_name: full_name.trim(),
        staff_id: staff_id.trim(),
        email: email.trim(),
        phone: phone.trim(),
        lecturer_faculty,
        lecturer_department: lecturer_department.trim(),
        lecturer_region_residence,
        password,
        confirm_password,
      });
      if (data.success) {
        if (data.user) {
          applyLoggedInUser(data.user);
          onSuccess?.();
          navigate('/supervisor/dashboard', { replace: true });
          return;
        }
        const loggedIn = await login('supervisor', { staffId: staff_id.trim(), password });
        if (loggedIn) {
          onSuccess?.();
          navigate('/supervisor/dashboard', { replace: true });
          return;
        }
        setSignupCompleteManualLogin(true);
        setError('Account created, but automatic sign-in failed. Please sign in with your Staff ID and password.');
      } else {
        setError(data.error ?? 'Sign up failed.');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as Error).message) : 'Sign up failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (signupCompleteManualLogin) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-900/95 p-6 text-center">
        <p className="text-primary-300 font-medium">Account created.</p>
        <p className="mt-1 text-sm text-slate-400">Please sign in with your Staff ID and password.</p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <Button type="button" onClick={onCancel} className="mt-4" variant="outline">
          Go to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="sup-fullname" className={labelClass}>Full Name</label>
        <input
          id="sup-fullname"
          type="text"
          value={full_name}
          onChange={(e) => setFull_name(e.target.value)}
          className={inputClass}
          placeholder="Enter full name"
          autoComplete="name"
        />
      </div>
      <div>
        <label htmlFor="sup-staffid" className={labelClass}>Staff ID</label>
        <input
          id="sup-staffid"
          type="text"
          value={staff_id}
          onChange={(e) => setStaff_id(e.target.value)}
          className={inputClass}
          placeholder="Enter Staff ID"
          autoComplete="username"
        />
      </div>
      <div>
        <label htmlFor="sup-email" className={labelClass}>Email</label>
        <input
          id="sup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="Enter email"
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="sup-phone" className={labelClass}>Phone Number</label>
        <input
          id="sup-phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="Enter phone number"
          autoComplete="tel"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sup-faculty" className={labelClass}>Faculty</label>
          <select
            id="sup-faculty"
            value={lecturer_faculty}
            onChange={(e) => setLecturer_faculty(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select faculty</option>
            {SUPERVISOR_FACULTIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sup-province" className={labelClass}>Province</label>
          <select
            id="sup-province"
            value={lecturer_region_residence}
            onChange={(e) => setLecturer_region_residence(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select province</option>
            {SUPERVISOR_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="sup-department" className={labelClass}>Department</label>
        <input
          id="sup-department"
          type="text"
          value={lecturer_department}
          onChange={(e) => setLecturer_department(e.target.value)}
          className={inputClass}
          placeholder="e.g. Computer Science"
          required
        />
      </div>
      <div>
        <label htmlFor="sup-password" className={labelClass}>Password</label>
        <input
          id="sup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="Enter password"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label htmlFor="sup-confirm" className={labelClass}>Confirm Password</label>
        <input
          id="sup-confirm"
          type="password"
          value={confirm_password}
          onChange={(e) => setConfirm_password(e.target.value)}
          className={inputClass}
          placeholder="Confirm password"
          autoComplete="new-password"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </Button>
        <button type="button" onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-200 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
