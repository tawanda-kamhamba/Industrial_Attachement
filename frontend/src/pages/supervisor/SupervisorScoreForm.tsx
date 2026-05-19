import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

const POINTS = [0, 1, 2, 3, 4, 5] as const;

type SectionB =
  | 'abilityToCompleteWorkOnTime'
  | 'abilityToFollowInstructionsCarefully'
  | 'abilityToTakeInitiatives'
  | 'abilityToWorkWithLittleSupervision'
  | 'adherenceToOrganizationsRules'
  | 'adherenceToSafety'
  | 'resourcefulness';

type SectionC =
  | 'attendanceToWork'
  | 'punctuality'
  | 'desireToWork'
  | 'willingnessToAcceptIdeas';

type SectionD =
  | 'relationshipWithColleagues'
  | 'relationshipWithSuperiors'
  | 'abilityToControlEmotions';

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
  visitNumber: 1 | 2;
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
  visitNumber: 1,
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

export function SupervisorScoreForm({
  indexNumber,
  onClose,
  initialVisitNumber,
}: {
  indexNumber: string;
  onClose: () => void;
  initialVisitNumber?: 1 | 2;
}) {
  /** Unique radio groups so selections never leak to another form (e.g. student grade page). */
  const radioScope = useId().replace(/:/g, '');
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    visitNumber: initialVisitNumber ?? 1,
  }));
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const idx = String(indexNumber ?? '').trim();
    if (!idx) {
      setError('Missing student index. Close this form and open it again from the student row.');
      return;
    }
    setSubmitting(true);
    try {
      const {
        visitNumber,
        specificSkill1,
        specificSkill1Score,
        specificSkill2,
        specificSkill2Score,
        specificSkill3,
        specificSkill3Score,
        specificSkill4,
        specificSkill4Score,
        specificSkill5,
        specificSkill5Score,
        abilityToCompleteWorkOnTime,
        abilityToFollowInstructionsCarefully,
        abilityToTakeInitiatives,
        abilityToWorkWithLittleSupervision,
        adherenceToOrganizationsRules,
        adherenceToSafety,
        resourcefulness,
        attendanceToWork,
        punctuality,
        desireToWork,
        willingnessToAcceptIdeas,
        relationshipWithColleagues,
        relationshipWithSuperiors,
        abilityToControlEmotions,
        generalRemarks,
      } = form;
      await api.post<{ success: boolean; grade?: number }>('/supervisor/grade', {
        index_number: idx,
        visitNumber,
        specificSkill1,
        specificSkill1Score,
        specificSkill2,
        specificSkill2Score,
        specificSkill3,
        specificSkill3Score,
        specificSkill4,
        specificSkill4Score,
        specificSkill5,
        specificSkill5Score,
        abilityToCompleteWorkOnTime,
        abilityToFollowInstructionsCarefully,
        abilityToTakeInitiatives,
        abilityToWorkWithLittleSupervision,
        adherenceToOrganizationsRules,
        adherenceToSafety,
        resourcefulness,
        attendanceToWork,
        punctuality,
        desireToWork,
        willingnessToAcceptIdeas,
        relationshipWithColleagues,
        relationshipWithSuperiors,
        abilityToControlEmotions,
        generalRemarks,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to submit';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-emerald-600">
          Assessment submitted successfully.
        </p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-700">Select visit:</p>
        <div className="flex gap-3 text-xs">
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name={`${radioScope}-visit`}
              checked={form.visitNumber === 1}
              onChange={() => set('visitNumber', 1)}
              className="h-3.5 w-3.5"
            />
            <span>First visit</span>
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="radio"
              name={`${radioScope}-visit`}
              checked={form.visitNumber === 2}
              onChange={() => set('visitNumber', 2)}
              className="h-3.5 w-3.5"
            />
            <span>Second visit</span>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-300 shadow-sm">
        <div className="bg-slate-800 px-5 py-3 text-center text-sm font-semibold text-white">
          Visiting Supervisor Grades
        </div>
        <div className="bg-slate-100 px-3 py-3 text-xs text-slate-700">
          <strong className="font-semibold underline">Directions:</strong> Select the option
          that best describes the student&apos;s performance for each competency.
        </div>
        <div className="px-3 pb-3 pt-2">
          <div className="overflow-x-auto rounded border border-slate-300 bg-white">
            <table className="w-full border-collapse text-left text-[11px] text-slate-800">
              <tbody>
                <tr>
                  <td rowSpan={2} className={`${tableCellCenter} w-[60%] align-middle`}>
                    COMPETENCIES
                  </td>
                  <td colSpan={6} className={`${tableCell} w-[40%]`}>
                    0 - ABSENT &nbsp;&nbsp;&nbsp; 1 - WEAK &nbsp;&nbsp; 2 - BELOW AVERAGE
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className={tableCell}>
                    3 - AVERAGE &nbsp;&nbsp; 4 - GOOD &nbsp;&nbsp; 5 - OUTSTANDING
                  </td>
                </tr>
                <tr className="text-center font-bold">
                  <td className={tableCell}>Grade Points</td>
                  {POINTS.map((p) => (
                    <td key={p} className={tableCell}>
                      {p}
                    </td>
                  ))}
                </tr>

                {/* A. SPECIFIC SKILLS */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}>
                    A. &nbsp; SPECIFIC SKILLS ( Skills related to work assigned to student )
                  </td>
                </tr>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <tr key={n} className="text-center">
                    <td className={tableCell}>
                      <input
                        type="text"
                        value={form[`specificSkill${n}` as keyof FormState] as string}
                        onChange={(e) =>
                          set(`specificSkill${n}` as keyof FormState, e.target.value)
                        }
                        placeholder={`Enter ${
                          n === 1
                            ? 'first'
                            : n === 2
                            ? 'second'
                            : n === 3
                            ? 'third'
                            : n === 4
                            ? 'fourth'
                            : 'fifth'
                        } specific skill`}
                        className="w-full border-0 bg-transparent px-1 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`${radioScope}-skill-${n}`}
                          checked={
                            (form[`specificSkill${n}Score` as keyof FormState] as number) === p
                          }
                          onChange={() =>
                            set(`specificSkill${n}Score` as keyof FormState, p as number)
                          }
                          className="h-3.5 w-3.5"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* B. GENERAL EMPLOYABLE SKILLS */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}>
                    B. &nbsp; GENERAL EMPLOYABLE SKILLS
                  </td>
                </tr>
                {(Object.keys(SECTION_B_LABELS) as SectionB[]).map((key) => (
                  <tr key={key}>
                    <td className={tableCell}>
                      <span className="text-[1.05em]">{SECTION_B_LABELS[key]}</span>
                    </td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`${radioScope}-b-${key}`}
                          checked={form[key] === p}
                          onChange={() => set(key, p as number)}
                          className="h-3.5 w-3.5"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* C. ATTITUDE TO WORK */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}>
                    C. &nbsp; ATTITUDE TO WORK
                  </td>
                </tr>
                {(Object.keys(SECTION_C_LABELS) as SectionC[]).map((key) => (
                  <tr key={key}>
                    <td className={tableCell}>
                      <span className="text-[1.05em]">{SECTION_C_LABELS[key]}</span>
                    </td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`${radioScope}-c-${key}`}
                          checked={form[key] === p}
                          onChange={() => set(key, p as number)}
                          className="h-3.5 w-3.5"
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* D. HUMAN RELATIONS */}
                <tr className="font-bold">
                  <td colSpan={7} className={tableCell}>
                    D. &nbsp; HUMAN RELATIONS
                  </td>
                </tr>
                {(Object.keys(SECTION_D_LABELS) as SectionD[]).map((key) => (
                  <tr key={key}>
                    <td className={tableCell}>
                      <span className="text-[1.05em]">{SECTION_D_LABELS[key]}</span>
                    </td>
                    {POINTS.map((p) => (
                      <td key={p} className={tableCellCenter}>
                        <input
                          type="radio"
                          name={`${radioScope}-d-${key}`}
                          checked={form[key] === p}
                          onChange={() => set(key, p as number)}
                          className="h-3.5 w-3.5"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-2">
        <label htmlFor="general_remarks" className="block text-xs font-medium text-slate-700">
          General remarks
        </label>
        <textarea
          id="general_remarks"
          value={form.generalRemarks}
          onChange={(e) => set('generalRemarks', e.target.value)}
          rows={3}
          className="mt-1 w-full resize-none rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
          style={{ minHeight: '90px' }}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit score'}
        </Button>
      </div>
    </form>
  );
}

