import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import { ContractViewDownloadActions } from '@/components/ContractViewDownloadActions';
import { ContractRejectDialog } from '@/components/ContractRejectDialog';
import { ContractResubmitDialog } from '@/components/ContractResubmitDialog';
import {
  ContractStatusActions,
  type ContractAction,
  type ContractActionRow,
} from '@/components/ContractStatusActions';

interface ContractRow extends ContractActionRow {
  submission_date: string | null;
  admin_comment: string;
  original_filename: string;
}

type DialogTarget = { id: number; studentLabel: string };

export function SupervisorContracts() {
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DialogTarget | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<DialogTarget | null>(null);

  const fetchContracts = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    api
      .get<ContractRow[]>(`/supervisor/contracts${params}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter]);

  const studentLabel = (row: ContractActionRow) =>
    `${row.student_name || 'Student'} (${row.index_number})`;

  const handleAction = async (contractId: number, action: ContractAction, comment = '') => {
    setActionLoading(contractId);
    setError(null);
    try {
      await api.post('/supervisor/contracts', {
        action,
        contract_id: contractId,
        comment,
      });
      setRejectTarget(null);
      setResubmitTarget(null);
      fetchContracts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const baseColumns: Column<ContractRow>[] = [
    {
      key: 'student_name',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.student_name || '-'}</p>
          <p className="text-xs text-slate-500">{row.index_number}</p>
        </div>
      ),
    },
    {
      key: 'original_filename',
      header: 'File',
      render: (row) => (
        <ContractViewDownloadActions
          role="supervisor"
          contractId={row.id}
          fileLabel={row.original_filename || 'Contract'}
          layout="stacked"
          onError={(msg) => setError(msg)}
        />
      ),
    },
    { key: 'status', header: 'Status', align: 'center' },
    {
      key: 'submission_date',
      header: 'Submitted',
      render: (row) =>
        row.submission_date
          ? new Date(row.submission_date).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      key: 'admin_comment',
      header: 'Comment / reason',
      render: (row) =>
        row.admin_comment ? (
          <span className="text-sm text-slate-700">{row.admin_comment}</span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
  ];

  const columnsWithActions: Column<ContractRow>[] = [
    ...baseColumns,
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <ContractStatusActions
          row={row}
          loading={actionLoading !== null}
          onAction={handleAction}
          onRejectClick={(r) =>
            setRejectTarget({ id: r.id, studentLabel: studentLabel(r) })
          }
          onAllowResubmitClick={(r) =>
            setResubmitTarget({ id: r.id, studentLabel: studentLabel(r) })
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ContractRejectDialog
        open={rejectTarget !== null}
        studentLabel={rejectTarget?.studentLabel}
        submitting={rejectTarget !== null && actionLoading === rejectTarget.id}
        onCancel={() => {
          if (actionLoading === null) setRejectTarget(null);
        }}
        onConfirm={(reason) => {
          if (rejectTarget) handleAction(rejectTarget.id, 'reject', reason);
        }}
      />
      <ContractResubmitDialog
        open={resubmitTarget !== null}
        studentLabel={resubmitTarget?.studentLabel}
        submitting={resubmitTarget !== null && actionLoading === resubmitTarget.id}
        onCancel={() => {
          if (actionLoading === null) setResubmitTarget(null);
        }}
        onConfirm={(note) => {
          if (resubmitTarget) handleAction(resubmitTarget.id, 'allow_resubmit', note);
        }}
      />

      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">Student Contracts</h1>
        <p className="mt-1 text-slate-500">
          Review contracts, change status, or allow students to upload again.
        </p>
      </div>

      <Card>
        <CardHeader title="Contracts" />
        <div className="mb-4 flex items-center gap-3 px-4 pt-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchContracts}>
            Refresh
          </Button>
        </div>
        {error && <p className="px-4 text-sm text-red-600">{error}</p>}
        <div className="px-4 pb-4">
          {loading ? (
            <p className="text-slate-500">Loading...</p>
          ) : (
            <DataTable
              columns={columnsWithActions}
              data={rows}
              keyField="id"
              emptyMessage="No contracts have been submitted by your assigned students."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
