import { Button } from '@/components/ui/Button';

export type ContractAction = 'approve' | 'reject' | 'allow_resubmit' | 'set_pending';

export interface ContractActionRow {
  id: number;
  student_name: string;
  index_number: string;
  status: string;
  allow_resubmit?: boolean;
}

interface ContractStatusActionsProps {
  row: ContractActionRow;
  loading: boolean;
  onAction: (contractId: number, action: ContractAction) => void;
  onRejectClick: (row: ContractActionRow) => void;
  onAllowResubmitClick: (row: ContractActionRow) => void;
}

export function ContractStatusActions({
  row,
  loading,
  onAction,
  onRejectClick,
  onAllowResubmitClick,
}: ContractStatusActionsProps) {
  const status = (row.status || 'pending').toLowerCase();
  const resubmitAllowed = !!row.allow_resubmit;

  if (resubmitAllowed) {
    return (
      <span className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
          Awaiting new upload
        </span>
        <Button variant="outline" size="sm" disabled={loading} onClick={() => onAction(row.id, 'set_pending')}>
          Cancel resubmit
        </Button>
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center justify-center gap-1.5">
      {status !== 'approved' && (
        <Button variant="primary" size="sm" disabled={loading} onClick={() => onAction(row.id, 'approve')}>
          Approve
        </Button>
      )}
      {status !== 'rejected' && (
        <Button variant="outline" size="sm" disabled={loading} onClick={() => onRejectClick(row)}>
          Reject
        </Button>
      )}
      {(status === 'approved' || status === 'rejected') && (
        <>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => onAllowResubmitClick(row)}>
            Allow resubmit
          </Button>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => onAction(row.id, 'set_pending')}>
            Set pending
          </Button>
        </>
      )}
    </span>
  );
}
