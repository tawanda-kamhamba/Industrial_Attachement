import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BackToDashboardLink } from '@/components/student/BackToDashboardLink';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { api } from '@/services/api';

const SUPERVISOR_UNLOCK_KEY = 'supervisor_unlocked_';

const POINTS = [0, 1, 2, 3, 4, 5] as const;

type SectionB = 'abilityToCompleteWorkOnTime' | 'abilityToFollowInstructionsCarefully' | 'abilityToTakeInitiatives' | 'abilityToWorkWithLittleSupervision' | 'adherenceToOrganizationsRules' | 'adherenceToSafety' | 'resourcefulness';
type SectionC = 'attendanceToWork' | 'punctuality' | 'desireToWork' | 'willingnessToAcceptIdeas';
type SectionD = 'relationshipWithColleagues' | 'relationshipWithSuperiors' | 'abilityToControlEmotions';

const SECTION_B_LABELS: Record<SectionB, string> = {
  abilityToCompleteWorkOnTime: 'Ability to complete work on time',
  abilityToFollowInstructionsCarefully: 'Ability to follow instructions carefully',
  abilityToTakeInitiatives: 'Ability to make initiatives',
  abilityToWorkWithLittleSupervision: 'Ability to work with little supervision',
  adherenceToOrganizationsRules: "Adherence to organization's rules and regulations",
  adherenceToSafety: 'Adherence to safety and environmental rules',
  resourcefulness: 'Resourcefulness',
};
const SECTION_C_LABELS: Record<SectionC, string> = {
  attendanceToWork: 'Attendance to work',
  punctuality: 'Punctuality',
  desireToWork: 'Desire to work',
  willingnessToAcceptIdeas: 'Willingness to accept new ideas',
};
const SECTION_D_LABELS: Record<SectionD, string> = {
  relationshipWithColleagues: 'Relationship with colleagues',
  relationshipWithSuperiors: 'Relationship with superiors',
  abilityToControlEmotions: 'Ability to control emotions when provoked',
};

interface FormState {
  specificSkill1: string;
  specificSkill1Score: number;
  specificSkill2: string;
  specificSkill2Score: number;
  specificSkill3: string;
  specificSkill3Score: number;
  specificSkill4: string;
  specificSkill4Score: number;
  specificSkill5: string;
  specificSkill5Score: number;
  abilityToCompleteWorkOnTime: number;
  abilityToFollowInstructionsCarefully: number;
  abilityToTakeInitiatives: number;
  abilityToWorkWithLittleSupervision: number;
  adherenceToOrganizationsRules: number;
  adherenceToSafety: number;
  resourcefulness: number;
  attendanceToWork: number;
  punctuality: number;
  desireToWork: number;
  willingnessToAcceptIdeas: number;
  relationshipWithColleagues: number;
  relationshipWithSuperiors: number;
  abilityToControlEmotions: number;
  generalRemarks: string;
}

const initialForm: FormState = {
  specificSkill1: '',
  specificSkill1Score: 0,
  specificSkill2: '',
  specificSkill2Score: 0,
  specificSkill3: '',
  specificSkill3Score: 0,
  specificSkill4: '',
  specificSkill4Score: 0,
  specificSkill5: '',
  specificSkill5Score: 0,
  abilityToCompleteWorkOnTime: 0,
  abilityToFollowInstructionsCarefully: 0,
  abilityToTakeInitiatives: 0,
  abilityToWorkWithLittleSupervision: 0,
  adherenceToOrganizationsRules: 0,
  adherenceToSafety: 0,
  resourcefulness: 0,
  attendanceToWork: 0,
  punctuality: 0,
  desireToWork: 0,
  willingnessToAcceptIdeas: 0,
  relationshipWithColleagues: 0,
  relationshipWithSuperiors: 0,
  abilityToControlEmotions: 0,
  generalRemarks: '',
};

const tableCell = 'border border-slate-300 px-3 py-2 bg-white';
const tableCellCenter = `${tableCell} text-center`;

export function SupervisorGradeFormPage() {
  const location = useLocation();
  const pathname = location.pathname;
  const type = pathname.includes('/company') ? 'company' : pathname.includes('/visiting') ? 'visiting' : undefined;
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isVisiting = type === 'visiting';
  const title = isVisiting ? 'Visiting Supervisor Grades' : 'Company Supervisor Grades';

  useEffect(() => {
    if (type !== 'visiting' && type !== 'company') {
      navigate('/student', { replace: true });
      return;
    }
    const key = `${SUPERVISOR_UNLOCK_KEY}${type}`;
    if (!sessionStorage.getItem(key)) {
      navigate(`/student/supervisor/${type}`, { replace: true });
    }
  }, [type, navigate]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post<{ success: boolean; grade?: number }>('/student/supervisor/grade', {
        type,
        ...form,
      });
      setSuccessMessage('Assessment submitted successfully.');
      sessionStorage.removeItem(`${SUPERVISOR_UNLOCK_KEY}${type}`);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : 'Failed to submit';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (type !== 'visiting' && type !== 'company') return null;

  return (
    <div className="space-y-4">
      <SuccessModal
        open={!!successMessage}
        message={successMessage ?? ''}
        onClose={() => {
          setSuccessMessage(null);
          navigate('/student');
        }}
      />
      <div className="flex items-center gap-4">
        <BackToDashboardLink />
      </div>

      {/* Panel: contained width, not stretched (portable) */}
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-slate-300 shadow-md">
        <div className="bg-[rgba(27,27,187,0.83)] px-5 py-4 text-center text-base font-bold text-white">
          {title}
        </div>
        <div className="bg-[rgba(232,232,232,0.56)] px-4 py-4">
          <form onSubmit={handleSubmit}>
            <table className="border-collapse border border-slate-400 bg-white text-left text-slate-800 w-full">
              <caption className="border border-slate-400 bg-slate-50 px-3 py-2 text-left">
                <strong><u> DIRECTIONS </u> : </strong> Please indicate by clicking the options below to indicate the degree to which the student best measures up to the competencies stated below
              </caption>
              <tbody>
                <tr>
                  <td rowSpan={2} className={`${tableCellCenter} w-[60%] align-middle`}> COMPETENCIES </td>
                  <td colSpan={6} className={`${tableCell} w-[40%]`}> 0 - ABSENT &nbsp;&nbsp;&nbsp; 1 - WEAK &nbsp;&nbsp; 2 - BELOW AVERAGE </td>
                </tr>
                <tr>
                  <td colSpan={6} className={tableCell}> 3 - AVERAGE &nbsp;&nbsp; 4 - GOOD &nbsp;&nbsp; 5 - OUTSTANDING </td>
                </tr>
                <tr className="text-center font-bold">
                  <td className={tableCell}>Grade Points</td>
                  {POINTS.map((p) => <td key={p} className={tableCell}>{p}</td>)}
                </tr>

                {/* A. SPECIFIC SKILLS */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}> A. &nbsp; SPECIFIC SKILLS ( Skills related to work assigned to student ) </td>
                </tr>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <tr key={n} className="text-center">
                    <td className={tableCell}>
                      <input
                        type="text"
                        value={form[`specificSkill${n}` as keyof FormState] as string}
                        onChange={(e) => set(`specificSkill${n}` as keyof FormState, e.target.value)}
                        placeholder={`Enter ${n === 1 ? 'first' : n === 2 ? 'second' : n === 3 ? 'third' : n === 4 ? 'fourth' : 'fifth'} specific skill`}
                        className="w-full border-0 bg-transparent px-1 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`skill-${n}`}
                          checked={(form[`specificSkill${n}Score` as keyof FormState] as number) === p}
                          onChange={() => set(`specificSkill${n}Score` as keyof FormState, p)}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* B. GENERAL EMPLOYABLE SKILLS */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}> B. &nbsp; GENERAL EMPLOYABLE SKILLS </td>
                </tr>
                {(Object.keys(SECTION_B_LABELS) as SectionB[]).map((key) => (
                  <tr key={key}>
                    <td className={tableCell}><span className="text-[1.1em]">{SECTION_B_LABELS[key]}</span></td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`b-${key}`}
                          checked={form[key] === p}
                          onChange={() => set(key, p)}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* C. ATTITUDE TO WORK */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}> C. &nbsp; ATTITUDE TO WORK </td>
                </tr>
                {(Object.keys(SECTION_C_LABELS) as SectionC[]).map((key) => (
                  <tr key={key}>
                    <td className={tableCell}><span className="text-[1.1em]">{SECTION_C_LABELS[key]}</span></td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`c-${key}`}
                          checked={form[key] === p}
                          onChange={() => set(key, p)}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* D. HUMAN RELATIONS */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}> D. &nbsp; HUMAN RELATIONS </td>
                </tr>
                {(Object.keys(SECTION_D_LABELS) as SectionD[]).map((key) => (
                  <tr key={key}>
                    <td className={tableCell}><span className="text-[1.1em]">{SECTION_D_LABELS[key]}</span></td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`d-${key}`}
                          checked={form[key] === p}
                          onChange={() => set(key, p)}
                          className="h-4 w-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4">
              <label htmlFor="general_remarks" className="block text-slate-700">General Remarks :</label>
              <textarea
                id="general_remarks"
                value={form.generalRemarks}
                onChange={(e) => set('generalRemarks', e.target.value)}
                rows={4}
                className="mt-1 w-full resize-none rounded border border-slate-300 bg-white px-3 py-2 text-slate-800"
                style={{ minHeight: '120px' }}
              />
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
