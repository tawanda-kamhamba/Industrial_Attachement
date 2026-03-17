import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistData {
  completed: boolean;
  student_name?: string;
  index_number?: string;
  host_institution?: string;
  general_staff_introduction?: number;
  general_facilities_location?: number;
  general_tea_coffee_lunch?: number;
  general_transport_arrangements?: number;
  general_dress_code?: number;
  general_code_of_conduct?: number;
  general_policies_regulations?: number;
  work_workspace?: number;
  work_duty_arrangements?: number;
  work_schedule_meetings?: number;
  work_first_meeting_supervisor?: number;
  health_emergency_procedures?: number;
  health_safety_policy?: number;
  health_first_aid_arrangements?: number;
  health_fire_procedures?: number;
  health_accident_reporting?: number;
  health_manual_handling?: number;
  health_safety_regulations?: number;
  health_equipment_instruction?: number;
  others_student_info_form?: number;
  others_social_media_guidelines?: number;
  others_it_systems_equipment?: number;
  student_signature?: string;
  student_signature_date?: string | null;
  host_supervisor_signature?: string;
  host_supervisor_date?: string | null;
  wrl_coordinator_signature?: string;
  wrl_coordinator_date?: string | null;
  completed_at?: string | null;
}

const CHECKBOX_KEYS = [
  { key: 'general_staff_introduction', label: 'Introduction to key staff members and their roles explained' },
  { key: 'general_facilities_location', label: 'Location of facilities such as rest rooms, canteen, etc.' },
  { key: 'general_tea_coffee_lunch', label: 'Tea/coffee and lunch arrangements' },
  { key: 'general_transport_arrangements', label: 'Transport arrangements (if applicable)' },
  { key: 'general_dress_code', label: 'Dress code' },
  { key: 'general_code_of_conduct', label: 'Code of conduct' },
  { key: 'general_policies_regulations', label: 'Policies and regulations' },
  { key: 'work_workspace', label: 'Work space' },
  { key: 'work_duty_arrangements', label: 'Duty arrangements' },
  { key: 'work_schedule_meetings', label: 'Schedule of meetings' },
  { key: 'work_first_meeting_supervisor', label: 'First meeting with host supervisor' },
  { key: 'health_emergency_procedures', label: 'Emergency procedures' },
  { key: 'health_safety_policy', label: 'Safety policy received or location known' },
  { key: 'health_first_aid_arrangements', label: 'First aid arrangements such as location of first aid box, names of first aiders, etc.' },
  { key: 'health_fire_procedures', label: 'Fire procedures and location of fire extinguishers' },
  { key: 'health_accident_reporting', label: 'Accident reporting and location of accident book' },
  { key: 'health_manual_handling', label: 'Manual handling procedures' },
  { key: 'health_safety_regulations', label: 'Safety regulations' },
  { key: 'health_equipment_instruction', label: 'Instruction on equipment and their use' },
  { key: 'others_student_info_form', label: 'Student information form (Contract form)' },
  { key: 'others_social_media_guidelines', label: 'Social media guidelines' },
  { key: 'others_it_systems_equipment', label: 'IT systems and equipment' },
] as const;

type CheckItem = (typeof CHECKBOX_KEYS)[number];
const SECTIONS: { title: string; keys: CheckItem[] }[] = [
  { title: 'General', keys: CHECKBOX_KEYS.slice(0, 7) as CheckItem[] },
  { title: 'Work-related', keys: CHECKBOX_KEYS.slice(7, 11) as CheckItem[] },
  { title: 'Health and Safety', keys: CHECKBOX_KEYS.slice(11, 19) as CheckItem[] },
  { title: 'Others', keys: CHECKBOX_KEYS.slice(19, 22) as CheckItem[] },
];

const documentStyles = {
  checklistDocument: {
    maxWidth: '900px',
    margin: '20px auto',
    padding: '40px',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  documentHeader: { textAlign: 'center' as const, marginBottom: '30px' },
  universityLogo: { width: '120px', height: '120px', margin: '0 auto 15px', display: 'block' },
  universityName: { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#000' },
  documentTitle: { fontSize: '20px', fontWeight: 'bold', color: '#0066cc', textAlign: 'center' as const, marginBottom: '30px' },
  studentInfo: { marginBottom: '20px', fontSize: '14px' },
  infoLine: { marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const },
  infoField: { borderBottom: '1px dotted #000', flex: 1, margin: '0 10px', minHeight: '20px' },
  instructions: { fontSize: '12px', fontStyle: 'italic', marginBottom: '25px', color: '#555', lineHeight: 1.6 },
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: '30px' },
  th: { backgroundColor: '#f0f0f0', border: '2px solid #000', padding: '10px', textAlign: 'center' as const, fontWeight: 'bold' },
  td: { border: '1px solid #000', padding: '10px', verticalAlign: 'top' as const },
  tdFirst: { width: '75%' },
  tdLast: { width: '25%', textAlign: 'center' as const },
  sectionHeader: { backgroundColor: '#e9ecef', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center' as const, padding: '8px' },
  checklistItem: { padding: '5px' },
  tickBox: { width: 18, height: 18, border: '2px solid #000', display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 },
  tickBoxChecked: { width: 18, height: 18, border: '2px solid #000', display: 'inline-flex', verticalAlign: 'middle', marginLeft: 4, backgroundColor: '#000', color: 'white', fontSize: 14, fontWeight: 'bold', alignItems: 'center', justifyContent: 'center' },
  hostInstitutionInput: { border: 'none', borderBottom: '1px dotted #000', background: 'transparent', padding: '2px 5px', width: '300px', fontSize: '14px' },
  signatureBlock: { marginBottom: '40px' },
  signatureLine: { borderBottom: '1px solid #000', marginBottom: '5px', minHeight: '50px' },
  signatureField: { borderBottom: '1px dotted #000', marginTop: '5px', minHeight: '20px', display: 'inline-block', width: '200px' },
  dateField: { borderBottom: '1px dotted #000', marginTop: '5px', minHeight: '20px', display: 'inline-block', width: '150px' },
  signatureInput: { border: 'none', background: 'transparent', width: '100%', padding: 0 },
  submitSection: { textAlign: 'center' as const, marginTop: '30px' },
};

export function OrientationChecklistPage() {
  const { user } = useAuth();
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    host_institution: '',
    ...Object.fromEntries(CHECKBOX_KEYS.map(({ key }) => [key, false])),
    student_signature: '',
    student_signature_date: '',
    host_supervisor_signature: '',
    host_supervisor_date: '',
    wrl_coordinator_signature: '',
    wrl_coordinator_date: '',
  });

  useEffect(() => {
    api
      .get<ChecklistData>('/student/orientation')
      .then((res) => {
        setData(res);
        if (res.completed && res.host_institution) {
          setForm((f) => ({ ...f, host_institution: res.host_institution ?? '' }));
        }
      })
      .catch(() => setData({ completed: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleCheck = (key: string, checked: boolean) => {
    setForm((f) => ({ ...f, [key]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.host_institution.trim()) {
      setMessage({ type: 'error', text: 'Host institution is required.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        host_institution: form.host_institution,
        student_signature: form.student_signature,
        student_signature_date: form.student_signature_date || undefined,
        host_supervisor_signature: form.host_supervisor_signature,
        host_supervisor_date: form.host_supervisor_date || undefined,
        wrl_coordinator_signature: form.wrl_coordinator_signature,
        wrl_coordinator_date: form.wrl_coordinator_date || undefined,
      };
      CHECKBOX_KEYS.forEach(({ key }) => {
        body[key] = (form as Record<string, unknown>)[key] === true;
      });
      const res = await api.post<{ success: boolean; error?: string }>('/student/orientation', body);
      if (res.success) {
        setMessage({ type: 'success', text: 'Orientation checklist submitted successfully!' });
        setData((d) => ({ ...d!, completed: true, ...form }));
      } else {
        setMessage({ type: 'error', text: res.error ?? 'Submit failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Submit failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Loading...</p>;
  }

  const completed = data?.completed === true;
  const studentFullName = data?.student_name ?? user?.name ?? '';
  const studentIndex = data?.index_number ?? (user as { id?: string })?.id ?? '';

  const DocHeader = () => (
    <div style={documentStyles.documentHeader}>
      <img src="/img/header_log.png" alt="University Logo" style={documentStyles.universityLogo} />
      <div style={documentStyles.universityName}>UNIVERSITY OF ZIMBABWE</div>
      <div style={documentStyles.documentTitle}>Work Related Learning Placement Student Orientation Checklist</div>
    </div>
  );

  const Instructions = () => (
    <div style={documentStyles.instructions}>
      (Please date the items below when they occur and inform the WRL Coordinator of any items not covered within one week of the start of the attachment period. *Complete where applicable according to Faculty expectations).
    </div>
  );

  const TickCell = ({ checked }: { checked: boolean }) => (
    <td style={{ ...documentStyles.td, ...documentStyles.tdLast }}>
      <span style={checked ? { ...documentStyles.tickBox, ...documentStyles.tickBoxChecked } : documentStyles.tickBox}>
        {checked ? '✓' : ''}
      </span>
    </td>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">← Back to Dashboard</Link>
      </div>

      {/* Panel: same as PHP */}
      <div className="overflow-hidden rounded-lg border border-slate-300 shadow-md">
        <div className="bg-[rgba(27,27,187,0.83)] px-5 py-4 text-center text-base font-bold text-white">
          Work Related Learning Placement - Student Orientation Checklist
        </div>
        <div className="bg-[rgba(232,232,232,0.56)] p-4">
          {message && (
            <div
              className={`mb-4 rounded p-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {message.text}
            </div>
          )}

          <div style={documentStyles.checklistDocument}>
            <DocHeader />

            {/* Student info */}
            <div style={documentStyles.studentInfo}>
              <div style={documentStyles.infoLine}>
                <span className="font-normal">Name of student:</span>
                <span style={documentStyles.infoField}>{completed ? (data?.student_name ?? '') : studentFullName}</span>
                <span className="font-normal">Reg. Number:</span>
                <span style={documentStyles.infoField}>{completed ? (data?.index_number ?? '') : studentIndex}</span>
              </div>
              <div style={documentStyles.infoLine}>
                <span className="font-normal">Host Institution:</span>
                <span style={documentStyles.infoField}>
                  {completed ? (
                    data?.host_institution ?? ''
                  ) : (
                    <input
                      type="text"
                      value={form.host_institution}
                      onChange={(e) => setForm((f) => ({ ...f, host_institution: e.target.value }))}
                      placeholder="Enter host institution name"
                      required
                      style={documentStyles.hostInstitutionInput}
                    />
                  )}
                </span>
              </div>
            </div>

            <Instructions />

            {completed ? (
              <>
                <table style={documentStyles.table}>
                  <thead>
                    <tr>
                      <th style={documentStyles.th}>Item</th>
                      <th style={documentStyles.th}>Tick done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SECTIONS.map((section) => (
                      <React.Fragment key={section.title}>
                        <tr>
                          <td colSpan={2} style={{ ...documentStyles.td, ...documentStyles.sectionHeader }}>
                            <strong><em>{section.title}</em></strong>
                          </td>
                        </tr>
                        {section.keys.map(({ key, label }) => (
                          <tr key={key}>
                            <td style={{ ...documentStyles.td, ...documentStyles.tdFirst, ...documentStyles.checklistItem }}>{label}</td>
                            <TickCell checked={!!(data && (data as unknown as Record<string, unknown>)[key])} />
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 40, marginBottom: 30 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '33%', padding: 10, verticalAlign: 'top' }}>
                          <div style={documentStyles.signatureBlock}>
                            <div style={documentStyles.signatureLine} />
                            <strong>Student:</strong><br />
                            <div style={documentStyles.signatureField}>{data?.student_signature ?? ''}</div>
                            <br /><strong>Date:</strong>
                            <div style={documentStyles.dateField}>
                              {data?.student_signature_date ? new Date(data.student_signature_date).toISOString().slice(0, 10) : ''}
                            </div>
                          </div>
                        </td>
                        <td style={{ width: '33%', padding: 10, verticalAlign: 'top' }}>
                          <div style={documentStyles.signatureBlock}>
                            <div style={documentStyles.signatureLine} />
                            <strong>Host Supervisor:</strong><br />
                            <div style={documentStyles.signatureField}>{data?.host_supervisor_signature ?? ''}</div>
                            <br /><strong>Date:</strong>
                            <div style={documentStyles.dateField}>
                              {data?.host_supervisor_date ? new Date(data.host_supervisor_date).toISOString().slice(0, 10) : ''}
                            </div>
                          </div>
                        </td>
                        <td style={{ width: '33%', padding: 10, verticalAlign: 'top' }}>
                          <div style={documentStyles.signatureBlock}>
                            <div style={documentStyles.signatureLine} />
                            <strong>WRL Coordinator:</strong><br />
                            <div style={documentStyles.signatureField}>{data?.wrl_coordinator_signature ?? ''}</div>
                            <br /><strong>Date:</strong>
                            <div style={documentStyles.dateField}>
                              {data?.wrl_coordinator_date ? new Date(data.wrl_coordinator_date).toISOString().slice(0, 10) : ''}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center mt-4">
                  <p><strong>Completed on:</strong> {data?.completed_at ? new Date(data.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <table style={documentStyles.table}>
                  <thead>
                    <tr>
                      <th style={documentStyles.th}>Item</th>
                      <th style={documentStyles.th}>Tick done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SECTIONS.map((section) => (
                      <React.Fragment key={section.title}>
                        <tr>
                          <td colSpan={2} style={{ ...documentStyles.td, ...documentStyles.sectionHeader }}>
                            <strong><em>{section.title}</em></strong>
                          </td>
                        </tr>
                        {section.keys.map(({ key, label }) => (
                          <tr key={key}>
                            <td style={{ ...documentStyles.td, ...documentStyles.tdFirst, ...documentStyles.checklistItem }}>{label}</td>
                            <td style={{ ...documentStyles.td, ...documentStyles.tdLast }}>
                              <label style={{ cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  name={key}
                                  checked={!!form[key as keyof typeof form]}
                                  onChange={(e) => handleCheck(key, e.target.checked)}
                                  style={{ width: 18, height: 18, margin: 0, verticalAlign: 'middle' }}
                                />
                                <span style={{ ...documentStyles.tickBox, marginLeft: 4, ...(form[key as keyof typeof form] ? documentStyles.tickBoxChecked : {}) }}>
                                  {form[key as keyof typeof form] ? '✓' : ''}
                                </span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: 40, marginBottom: 30 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '33%', padding: 10, verticalAlign: 'top' }}>
                          <div style={documentStyles.signatureBlock}>
                            <div style={documentStyles.signatureLine} />
                            <strong>Student:</strong><br />
                            <div style={documentStyles.signatureField}>
                              <input
                                type="text"
                                value={form.student_signature}
                                onChange={(e) => setForm((f) => ({ ...f, student_signature: e.target.value }))}
                                placeholder="Student name/signature"
                                style={documentStyles.signatureInput}
                              />
                            </div>
                            <br /><strong>Date:</strong>
                            <div style={documentStyles.dateField}>
                              <input
                                type="date"
                                value={form.student_signature_date}
                                onChange={(e) => setForm((f) => ({ ...f, student_signature_date: e.target.value }))}
                                style={documentStyles.signatureInput}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{ width: '33%', padding: 10, verticalAlign: 'top' }}>
                          <div style={documentStyles.signatureBlock}>
                            <div style={documentStyles.signatureLine} />
                            <strong>Host Supervisor:</strong><br />
                            <div style={documentStyles.signatureField}>
                              <input
                                type="text"
                                value={form.host_supervisor_signature}
                                onChange={(e) => setForm((f) => ({ ...f, host_supervisor_signature: e.target.value }))}
                                placeholder="Supervisor name/signature"
                                style={documentStyles.signatureInput}
                              />
                            </div>
                            <br /><strong>Date:</strong>
                            <div style={documentStyles.dateField}>
                              <input
                                type="date"
                                value={form.host_supervisor_date}
                                onChange={(e) => setForm((f) => ({ ...f, host_supervisor_date: e.target.value }))}
                                style={documentStyles.signatureInput}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{ width: '33%', padding: 10, verticalAlign: 'top' }}>
                          <div style={documentStyles.signatureBlock}>
                            <div style={documentStyles.signatureLine} />
                            <strong>WRL Coordinator:</strong><br />
                            <div style={documentStyles.signatureField}>
                              <input
                                type="text"
                                value={form.wrl_coordinator_signature}
                                onChange={(e) => setForm((f) => ({ ...f, wrl_coordinator_signature: e.target.value }))}
                                placeholder="Coordinator name/signature"
                                style={documentStyles.signatureInput}
                              />
                            </div>
                            <br /><strong>Date:</strong>
                            <div style={documentStyles.dateField}>
                              <input
                                type="date"
                                value={form.wrl_coordinator_date}
                                onChange={(e) => setForm((f) => ({ ...f, wrl_coordinator_date: e.target.value }))}
                                style={documentStyles.signatureInput}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div style={documentStyles.submitSection}>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Orientation Checklist'}
                  </Button>
                  <p className="mt-3 text-sm text-slate-500">
                    You can only submit this checklist once. Please ensure all applicable items are ticked before submitting.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
