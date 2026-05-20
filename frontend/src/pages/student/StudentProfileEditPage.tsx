import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProfilePhotoLightbox } from '@/components/ui/ProfilePhotoLightbox';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

const PHOTO_CACHE_KEY = 'iasms_profile_photo_updated';

interface ProfileData {
  first_name: string;
  last_name: string;
  index_number: string;
  has_photo: boolean;
}

export function StudentProfileEditPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProfileData>('/student/profile')
      .then((data) => {
        setProfile(data);
        setFirstName(data.first_name ?? '');
        setLastName(data.last_name ?? '');
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load profile' }))
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image (jpg, png, gif, webp)' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be under 5MB' });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      setMessage(null);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName.trim());
      formData.append('last_name', lastName.trim());
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch('/api/student/profile', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Do not set Content-Type: browser must set multipart/form-data with boundary
      });

      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string; message?: string };
      if (!res.ok || data.success === false) {
        setMessage({ type: 'error', text: data.error ?? 'Update failed' });
        return;
      }
      setMessage({ type: 'success', text: data.message ?? 'Profile updated' });
      setPhotoFile(null);
      setPhotoPreview(null);
      if ((e.target as HTMLFormElement).querySelector('input[type="file"]')) {
        (e.target as HTMLFormElement).querySelector<HTMLInputElement>('input[type="file"]')!.value = '';
      }
      localStorage.setItem(PHOTO_CACHE_KEY, String(Date.now()));
      window.dispatchEvent(new CustomEvent('profilePhotoUpdated'));
      await refreshUser();
    } catch {
      setMessage({ type: 'error', text: 'Request failed' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  const photoUrl = '/api/student/profile/photo';
  const photoVersion = typeof localStorage !== 'undefined' ? localStorage.getItem(PHOTO_CACHE_KEY) : '';
  const photoSrc = photoVersion ? `${photoUrl}?t=${photoVersion}` : photoUrl;
  const initials = [firstName || user?.name?.split(' ')[0], lastName || user?.name?.split(' ')[1]]
    .filter(Boolean)
    .map((s) => s![0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Edit profile</h1>
        <Link to="/student" className="text-sm text-primary-600 hover:underline">
          ← Dashboard
        </Link>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card padding="lg">
        <CardHeader title="Account profile" />
        <form onSubmit={handleSubmit} className="page-stack">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative">
              <ProfilePhotoLightbox
                src={photoPreview ?? (profile?.has_photo ? photoSrc : null)}
                className="cursor-zoom-in rounded-full border-0 bg-transparent p-0"
              >
                <div className="relative h-24 w-24">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200"
                    />
                  ) : profile?.has_photo ? (
                    <img
                      src={photoSrc}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover ring-2 ring-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (next) next.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary-100 text-2xl font-semibold text-primary-700"
                    style={{ display: photoPreview ? 'none' : !profile?.has_photo ? 'flex' : 'none' }}
                  >
                    {initials}
                  </div>
                </div>
              </ProfilePhotoLightbox>
              <label className="mt-2 block">
                <span className="sr-only">Choose photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>
              {profile?.index_number && (
                <p className="text-sm text-slate-500">Index number: {profile.index_number}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Link to="/student">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
