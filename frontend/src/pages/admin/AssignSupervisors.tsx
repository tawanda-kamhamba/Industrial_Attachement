import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

import { SUPERVISOR_FACULTIES, SUPERVISOR_REGIONS } from '@/constants/supervisor';

const REGIONS = [...SUPERVISOR_REGIONS];
const FACULTIES = [...SUPERVISOR_FACULTIES];

interface Lecturer {
  id: number;
  lecturer_name: string;
  lecturer_faculty: string;
  lecturer_department: string;
  lecturer_phone_number: string;
  lecturer_region_residence: string;
  lecturer_email: string;
  staff_id: string | null;
}

interface AssignmentsData {
  regions: string[];
  faculties: string[];
  lecturers: Lecturer[];
  assigned: Record<string, Record<string, string>>;
  regionStats: Record<string, number>;
  departments: string[];
}

export function AssignSupervisors() {
  const [data, setData] = useState<AssignmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    lecturer_name: '',
    lecturer_department: '',
    lecturer_phone_number: '',
    lecturer_faculty: '',
    lecturer_email: '',
    lecturer_region_residence: '',
    staff_id: '',
    password: '',
  });
  const [adding, setAdding] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AssignmentsData>('/admin/assign-supervisors')
      .then((res) => {
        setData(res);
        setAssignments(res.assigned ?? {});
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const lecturersByRegionFaculty = (region: string, faculty: string): Lecturer[] => {
    if (!data?.lecturers) return [];
    return data.lecturers.filter(
      (l) => l.lecturer_region_residence === region && l.lecturer_faculty === faculty
    );
  };

  const handleAssignmentChange = (region: string, faculty: string, slot: 'first' | 'second', value: string) => {
    const key = slot === 'first' ? `first_supervisor_${faculty.toLowerCase()}` : `second_supervisor_${faculty.toLowerCase()}`;
    setAssignments((prev) => ({
      ...prev,
      [region]: {
        ...(prev[region] ?? {}),
        [key]: value,
      },
    }));
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.post('/admin/assign-supervisors/save', { assignments });
      setMessage({ type: 'success', text: 'Assignments saved successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.lecturer_name.trim() || !addForm.lecturer_department || !addForm.lecturer_phone_number.trim() || !addForm.lecturer_faculty || !addForm.lecturer_region_residence) {
      setMessage({ type: 'error', text: 'Name, department, contact, faculty and region are required.' });
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      await api.post('/admin/assign-supervisors/lecturer', addForm);
      setMessage({ type: 'success', text: 'Lecturer added successfully.' });
      setAddForm({ lecturer_name: '', lecturer_department: '', lecturer_phone_number: '', lecturer_faculty: '', lecturer_email: '', lecturer_region_residence: '', staff_id: '', password: '' });
      const res = await api.get<AssignmentsData>('/admin/assign-supervisors');
      setData(res);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to add lecturer' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <div className="page-stack min-w-0">
      <div>
        <h1 className="page-title">Assign Supervisors</h1>
        <p className="page-subtitle">Assign institutional supervisors by province and faculty. Add lecturers first, then assign first and second supervisor per cell.</p>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Student stats by region */}
      <Card>
        <CardHeader title="Students per province (from assumptions)" />
        <div className="region-pills-grid">
          {(data.regions ?? REGIONS).map((region) => (
            <div
              key={region}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center sm:px-4"
            >
              <div className="text-xs font-medium uppercase text-slate-500">{region}</div>
              <div className="text-xl font-semibold text-slate-800">{(data.regionStats ?? {})[region] ?? 0}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Registered lecturers */}
      <Card>
        <CardHeader title="Registered lecturers" />
        <div className="max-h-[min(60vh,32rem)] overflow-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Name</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Faculty</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Department</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Phone</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Province</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Email</th>
                <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-700">Staff ID</th>
              </tr>
            </thead>
            <tbody>
              {(data.lecturers ?? []).map((l) => (
                <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-800">{l.lecturer_name}</td>
                  <td className="px-3 py-2 text-slate-600">{l.lecturer_faculty}</td>
                  <td className="px-3 py-2 text-slate-600">{l.lecturer_department}</td>
                  <td className="px-3 py-2 text-slate-600">{l.lecturer_phone_number}</td>
                  <td className="px-3 py-2 text-slate-600">{l.lecturer_region_residence}</td>
                  <td className="px-3 py-2 text-slate-600">{l.lecturer_email || '—'}</td>
                  <td className="px-3 py-2 text-slate-600">{l.staff_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!data.lecturers || data.lecturers.length === 0) && (
          <p className="py-6 text-center text-slate-500">No lecturers registered. Add one below.</p>
        )}
      </Card>

      {/* Add lecturer */}
      <Card>
        <button
          type="button"
          onClick={() => setAddOpen(!addOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-slate-800 hover:bg-slate-50"
        >
          <span>Add lecturer</span>
          <span className="text-slate-400">{addOpen ? '▼' : '▶'}</span>
        </button>
        {addOpen && (
          <form onSubmit={handleAddLecturer} className="border-t border-slate-200 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Name *</label>
                <input
                  value={addForm.lecturer_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, lecturer_name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Department *</label>
                <select
                  value={addForm.lecturer_department}
                  onChange={(e) => setAddForm((f) => ({ ...f, lecturer_department: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="">Select</option>
                  {(data.departments ?? []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Phone *</label>
                <input
                  value={addForm.lecturer_phone_number}
                  onChange={(e) => setAddForm((f) => ({ ...f, lecturer_phone_number: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="e.g. 0200000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Faculty *</label>
                <select
                  value={addForm.lecturer_faculty}
                  onChange={(e) => setAddForm((f) => ({ ...f, lecturer_faculty: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="">Select</option>
                  {(data.faculties ?? FACULTIES).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={addForm.lecturer_email}
                  onChange={(e) => setAddForm((f) => ({ ...f, lecturer_email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Province *</label>
                <select
                  value={addForm.lecturer_region_residence}
                  onChange={(e) => setAddForm((f) => ({ ...f, lecturer_region_residence: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                >
                  <option value="">Select</option>
                  {(data.regions ?? REGIONS).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Staff ID (institutional login)</label>
                <input
                  value={addForm.staff_id}
                  onChange={(e) => setAddForm((f) => ({ ...f, staff_id: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="e.g. STF001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password (if Staff ID set)</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Leave blank if not institutional supervisor"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button type="submit" disabled={adding}>{adding ? 'Adding...' : 'Add lecturer'}</Button>
            </div>
          </form>
        )}
      </Card>

      {/* Assign supervisors by region */}
      <Card>
        <CardHeader title="Assign first & second supervisor by province and faculty" />
        <p className="mb-4 text-sm text-slate-500">Select a province to edit assignments. Only lecturers in that province and faculty appear in each dropdown.</p>

        <div className="space-y-2">
          {(data.regions ?? REGIONS).map((region) => (
            <div key={region} className="rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveRegion(activeRegion === region ? null : region)}
                className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left font-medium text-slate-800 hover:bg-slate-100"
              >
                <span>{region}</span>
                <span className="text-slate-400">{(data.regionStats ?? {})[region] ?? 0} students</span>
                <span className="text-slate-400">{activeRegion === region ? '▼' : '▶'}</span>
              </button>
              {activeRegion === region && (
                <div className="border-t border-slate-200 bg-white p-4">
                  <div className="max-h-[min(60vh,24rem)] overflow-auto rounded-lg border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-2 pr-4 text-left font-medium text-slate-700">Faculty</th>
                          <th className="pb-2 pr-4 text-left font-medium text-slate-700">1st supervisor</th>
                          <th className="pb-2 text-left font-medium text-slate-700">2nd supervisor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.faculties ?? FACULTIES).map((faculty) => {
                          const options = lecturersByRegionFaculty(region, faculty);
                          const fKey = faculty.toLowerCase();
                          const firstVal = (assignments[region] ?? {})[`first_supervisor_${fKey}`] ?? '';
                          const secondVal = (assignments[region] ?? {})[`second_supervisor_${fKey}`] ?? '';
                          return (
                            <tr key={faculty} className="border-b border-slate-100">
                              <td className="py-2 pr-4 font-medium text-slate-700">{faculty}</td>
                              <td className="py-2 pr-4">
                                <select
                                  value={firstVal}
                                  onChange={(e) => handleAssignmentChange(region, faculty, 'first', e.target.value)}
                                  className="w-full min-w-[160px] rounded border border-slate-300 px-2 py-1.5 text-slate-800"
                                >
                                  <option value="">— Select —</option>
                                  {options.map((l) => (
                                    <option key={l.id} value={l.lecturer_name}>{l.lecturer_name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2">
                                <select
                                  value={secondVal}
                                  onChange={(e) => handleAssignmentChange(region, faculty, 'second', e.target.value)}
                                  className="w-full min-w-[160px] rounded border border-slate-300 px-2 py-1.5 text-slate-800"
                                >
                                  <option value="">— Select —</option>
                                  {options.map((l) => (
                                    <option key={l.id} value={l.lecturer_name}>{l.lecturer_name}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveAssignments} disabled={saving}>
            {saving ? 'Saving...' : 'Save assignments'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
