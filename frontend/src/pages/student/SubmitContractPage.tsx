import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

type StatusType = 'idle' | 'success' | 'error';

interface ContractStatus {
  submitted: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  submission_date?: string | null;
  original_filename?: string;
  admin_comment?: string;
  can_resubmit?: boolean;
}

const loadContractStatus = () => api.get<ContractStatus>('/student/contract');

export function SubmitContractPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [contractStatus, setContractStatus] = useState<ContractStatus | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = () => {
    setLoadingStatus(true);
    return loadContractStatus()
      .then((data) => setContractStatus(data))
      .catch(() => setContractStatus({ submitted: false }))
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    refreshStatus().catch(() => undefined);
  }, []);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setStatus('idle');
    setMessage(selected ? null : message);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('error');
      setMessage('Please choose a contract PDF to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('contract_file', file);

    setUploading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const baseUrl = '/api';
      const res = await fetch(`${baseUrl}/student/contract`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const text = await res.text();
      let data: { success?: boolean; error?: string; message?: string } = {};
      try {
        data = JSON.parse(text);
      } catch {
        // ignore
      }

      if (!res.ok) {
        setStatus('error');
        setMessage(typeof data.error === 'string' ? data.error : 'Upload failed. Please try again.');
        return;
      }

      const feedback = data.message ?? 'Contract submitted. Your contract is pending approval.';
      setStatus('success');
      setMessage(feedback);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refreshStatus();
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Unexpected error while uploading. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const statusClasses =
    status === 'success'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : status === 'error'
      ? 'bg-red-50 text-red-800 border-red-200'
      : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-display font-bold tracking-tight md:text-3xl">
          Submit Industrial Attachment Contract
        </h1>
        <p className="mt-2 text-primary-100 max-w-2xl text-sm md:text-base">
          Upload a signed copy of your industrial attachment contract. It will be reviewed by your supervisor
          or the administration.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>
          {message}
        </div>
      )}

      {loadingStatus ? (
        <p className="text-slate-500">Loading contract status…</p>
      ) : contractStatus?.submitted && !contractStatus.can_resubmit ? (
        <Card padding="lg" className="bg-white">
          <h2 className="text-lg font-semibold text-slate-800">Contract submission status</h2>
          <p className="mt-2 text-slate-600">You have already submitted your industrial attachment contract.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                contractStatus.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : contractStatus.status === 'rejected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {contractStatus.status === 'approved'
                ? 'Approved'
                : contractStatus.status === 'rejected'
                ? 'Rejected'
                : 'Pending approval'}
            </span>
            {contractStatus.original_filename && (
              <span className="text-sm text-slate-500">File: {contractStatus.original_filename}</span>
            )}
          </div>
          {contractStatus.status === 'rejected' && contractStatus.admin_comment ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <p className="font-semibold">Reason for rejection</p>
              <p className="mt-1 whitespace-pre-wrap">{contractStatus.admin_comment}</p>
            </div>
          ) : contractStatus.admin_comment ? (
            <p className="mt-3 text-sm text-slate-600">
              <span className="font-medium">Reviewer comment:</span> {contractStatus.admin_comment}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-slate-500">
            {contractStatus.status === 'approved'
              ? 'Your contract has been approved. You may proceed with your industrial attachment.'
              : contractStatus.status === 'rejected'
              ? 'Your contract was rejected. Review the reason above. If resubmission was enabled, use the form below.'
              : 'Your contract is being reviewed. You will be notified once it is approved.'}
          </p>
        </Card>
      ) : null}

      {contractStatus?.submitted && contractStatus.can_resubmit ? (
        <Card padding="lg" className="border-amber-200 bg-amber-50/50">
          <h2 className="text-lg font-semibold text-amber-900">Resubmission requested</h2>
          <p className="mt-2 text-sm text-amber-900/90">
            Your supervisor or administrator has asked you to upload a new contract PDF. Use the form below.
          </p>
          {contractStatus.admin_comment ? (
            <p className="mt-2 text-sm text-amber-950">
              <span className="font-medium">Note:</span> {contractStatus.admin_comment}
            </p>
          ) : null}
        </Card>
      ) : null}

      {!loadingStatus && (!contractStatus?.submitted || contractStatus.can_resubmit) ? (
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card padding="lg" className="flex flex-col justify-between bg-white">
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-primary-300 hover:bg-primary-50/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 shadow-sm">
              <span className="text-2xl">⬆</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-800">
              {contractStatus?.can_resubmit ? 'Upload replacement contract PDF' : 'Select Contract PDF to Upload'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Supported format: <span className="font-medium">PDF</span> only. Maximum size{' '}
              <span className="font-medium">5MB</span>.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <Button
                type="button"
                size="lg"
                onClick={handleChooseFile}
                disabled={uploading}
                className="px-6"
              >
                {file ? 'Change File' : 'Select File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-slate-500">
                {file ? (
                  <>
                    Selected file:{' '}
                    <span className="font-medium text-slate-700 break-all">{file.name}</span>
                  </>
                ) : (
                  'No file selected yet.'
                )}
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card padding="lg" className="bg-white">
            <h2 className="text-base font-semibold text-slate-800">Contract Requirements</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• File must be in <span className="font-medium">PDF format</span>.</li>
              <li>• Maximum file size is <span className="font-medium">5MB</span>.</li>
              <li>• Contract must be signed by the student, company supervisor, and institution representative.</li>
              <li>• Ensure all required terms and conditions are included.</li>
              <li className="text-amber-700">
                • <span className="font-semibold">Important:</span>{' '}
                {contractStatus?.can_resubmit
                  ? 'This will replace your previous upload and reset review to pending.'
                  : 'After submission, changes require supervisor or admin approval to resubmit.'}
              </li>
            </ul>
          </Card>

          <Card padding="lg" className="bg-white flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Ready to submit?</p>
              <p className="mt-1 text-xs text-slate-500">
                By submitting, you confirm that the contract is complete and correctly signed.
              </p>
            </div>
            <Button type="submit" size="lg" disabled={uploading} className="whitespace-nowrap">
              {uploading
                ? 'Submitting…'
                : contractStatus?.can_resubmit
                ? 'Resubmit Contract'
                : 'Submit Contract'}
            </Button>
          </Card>
        </div>
      </form>
      ) : null}
    </div>
  );
}

