import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { api, apiBaseUrl } from '@/services/api';
import { ContractViewDownloadActions } from '@/components/ContractViewDownloadActions';
import { ContractRejectDialog } from '@/components/ContractRejectDialog';
import { ContractResubmitDialog } from '@/components/ContractResubmitDialog';
import {
  ContractStatusActions,
  type ContractAction,
  type ContractActionRow,
} from '@/components/ContractStatusActions';
import { TableFilters } from '@/components/ui/TableFilters';
import { filterRows, STUDENT_FILTER_FIELDS } from '@/utils/tableSearch';

interface ContractRow extends ContractActionRow {
  submission_date: string | null;
  admin_comment: string;
  original_filename: string;
  contract_file: string;
}

type DialogTarget = { id: number; studentLabel: string };

export function ManageContracts() {
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DialogTarget | null>(null);
  const [resubmitTarget, setResubmitTarget] = useState<DialogTarget | null>(null);

  const fetchContracts = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    api
      .get<ContractRow[]>(`/admin/contracts${params}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
  }, [statusFilter]);

  const studentLabel = (row: ContractActionRow) =>
    `${row.student_name || 'Student'} (${row.index_number})`;

  const postAction = async (contractId: number, action: ContractAction, adminComment = '') => {
    const id = Number(contractId);
    if (!Number.isInteger(id) || id < 1) {
      setError('Invalid contract id. Please refresh the page.');
      return;
    }
    setActionLoading(contractId);
    setError(null);
    try {
      const query = `?contract_id=${id}&action=${encodeURIComponent(action)}`;
      const form = new URLSearchParams();
      form.set('contract_id', String(id));
      form.set('action', action);
      form.set('admin_comment', adminComment);
      const res = await fetch(`${apiBaseUrl}/admin/contracts${query}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Request failed: ${res.status}`);
      }
      if (!data.success) {
        throw new Error(data.error || 'Action failed');
      }
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
    { key: 'index_number', header: 'Index Number' },
    { key: 'student_name', header: 'Student Name' },
    { key: 'status', header: 'Status' },
    { key: 'submission_date', header: 'Submitted At' },
    {
      key: 'original_filename',
      header: 'File',
      render: (row) =>
        row.contract_file ? (
          <ContractViewDownloadActions
            role="admin"
            contractId={row.id}
            fileLabel={row.original_filename || 'Contract'}
            layout="stacked"
            onError={(msg) => setError(msg)}
          />
        ) : (
          row.original_filename
        ),
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

  const fieldGetters = {
    index_number: (r: ContractRow) => r.index_number,
    student_name: (r: ContractRow) => r.student_name,
    company_name: (r: ContractRow) => r.original_filename,
    status: (r: ContractRow) => r.status,
  };

  const filtered = useMemo(
    () => filterRows(rows, search, filterBy, fieldGetters),
    [rows, search, filterBy]
  );

  const columnsWithActions: Column<ContractRow>[] = [
    ...baseColumns,
    {
      key: 'id',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <ContractStatusActions
          row={row}
          loading={actionLoading !== null}
          onAction={postAction}
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
    <div className="page-stack">
      <ContractRejectDialog
        open={rejectTarget !== null}
        studentLabel={rejectTarget?.studentLabel}
        submitting={rejectTarget !== null && actionLoading === rejectTarget.id}
        onCancel={() => {
          if (actionLoading === null) setRejectTarget(null);
        }}
        onConfirm={(reason) => {
          if (rejectTarget) postAction(rejectTarget.id, 'reject', reason);
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
          if (resubmitTarget) postAction(resubmitTarget.id, 'allow_resubmit', note);
        }}
      />

      <div>
        <h1 className="page-title">View Contracts</h1>
        <p className="page-subtitle">Review contracts, change status, or allow resubmission</p>
      </div>
      <Card>
        <CardHeader title="Contracts" />
        <TableFilters
          filterBy={filterBy}
          onFilterByChange={setFilterBy}
          filterOptions={STUDENT_FILTER_FIELDS}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search contracts…"
          resultCount={filtered.length}
          totalCount={rows.length}
          leading={
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchContracts}>
                Refresh
              </Button>
            </>
          }
        />
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <DataTable
            columns={columnsWithActions}
            data={filtered}
            keyField="id"
            emptyMessage={search.trim() ? 'No contracts match your search.' : 'No contracts to review.'}
          />
        )}
      </Card>
    </div>
  );
}
