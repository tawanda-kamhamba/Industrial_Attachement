import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BackToDashboardLink } from '@/components/student/BackToDashboardLink';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api, apiBaseUrl } from '@/services/api';

type StatusType = 'idle' | 'success' | 'error';

type ReportStatusResponse = {
  submitted: boolean;
  report_files?: string[];
  original_filenames?: string[];
  submission_date?: string | null;
  status?: string | null;
  admin_comment?: string | null;
};

export function SubmitReportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportStatus, setReportStatus] = useState<ReportStatusResponse | null>(null);
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const loadReportStatus = async () => {
    try {
      const data = await api.get<ReportStatusResponse>('/student/report');
      setReportStatus(data);
      return data;
    } catch {
      setReportStatus({ submitted: false });
      return { submitted: false };
    }
  };

  useEffect(() => {
    loadReportStatus().finally(() => setLoading(false));
  }, []);

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ?? null;
    setFiles(selected && selected.length > 0 ? selected : null);
    setStatus('idle');
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setStatus('error');
      setMessage('Please select at least one report file to upload.');
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('file[]', file);
    });

    setUploading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const res = await fetch(`${apiBaseUrl}/student/report`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const text = await res.text();
      let data: { success?: boolean; error?: string; message?: string; uploaded?: string[] } = {};
      try {
        data = JSON.parse(text);
      } catch {
        // ignore non-JSON responses
      }

      if (!res.ok || data.success !== true) {
        setStatus('error');
        setMessage(
          typeof data.error === 'string'
            ? data.error
            : typeof data.message === 'string'
              ? data.message
              : text || 'Upload failed. Please try again.'
        );
        return;
      }

      setStatus('success');
      setMessage(typeof data.message === 'string' ? data.message : 'Reports uploaded successfully.');
      setFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadReportStatus();
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

  const selectedFilesSummary =
    files && files.length > 0
      ? `${files.length} file${files.length > 1 ? 's' : ''} selected`
      : 'No files selected yet.';

  const submitted = reportStatus?.submitted ?? false;
  const displayNames =
    (reportStatus?.original_filenames?.length ?? 0) > 0
      ? reportStatus!.original_filenames!
      : reportStatus?.report_files ?? [];

  const statusLabel = (() => {
    const s = reportStatus?.status;
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'pending') return 'Pending review';
    return 'Submitted';
  })();

  if (loading) {
    return (
      <div className="space-y-8">
        <BackToDashboardLink />
        <p className="text-slate-500">Loading report status…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <BackToDashboardLink />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-6 py-6 text-white shadow-lg">
        <h1 className="text-2xl font-display font-bold tracking-tight md:text-3xl">Submit Final Report</h1>
        <p className="mt-2 text-primary-100 max-w-2xl text-sm md:text-base">
          Upload your industrial attachment report in Microsoft Word format. Use your index number as the file
          name before uploading.
        </p>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-3 text-sm whitespace-pre-wrap ${statusClasses}`}>
          {message}
        </div>
      )}

      {submitted ? (
        <Card padding="lg" className="bg-white">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-lg">
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-800">Report already submitted</h2>
              <p className="mt-2 text-slate-600">
                You have already submitted your final report. Report submissions are final and cannot be replaced
                through this portal.
              </p>
              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{statusLabel}</dd>
                </div>
                {reportStatus?.submission_date ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Submitted on</dt>
                    <dd className="mt-0.5">{reportStatus.submission_date}</dd>
                  </div>
                ) : null}
                {displayNames.length > 0 ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">File(s)</dt>
                    <dd className="mt-0.5">
                      <ul className="list-disc pl-5">
                        {displayNames.map((name) => (
                          <li key={name} className="break-all">
                            {name}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                {reportStatus?.admin_comment ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Admin comment</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">{reportStatus.admin_comment}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card padding="lg" className="flex flex-col justify-between bg-white">
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-primary-300 hover:bg-primary-50/40">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 shadow-sm">
                <span className="text-2xl">⬆</span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-800">Select Report Files to Upload</h2>
              <p className="mt-2 text-sm text-slate-500">
                Supported formats:{' '}
                <span className="font-medium">
                  .doc, .docx
                </span>
                . You may upload one or more files.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleChooseFiles}
                  disabled={uploading}
                  className="px-6"
                >
                  {files && files.length > 0 ? 'Change Files' : 'Select Files'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-slate-500">{selectedFilesSummary}</p>
                {files && files.length > 0 && (
                  <ul className="mt-1 max-h-32 w-full overflow-y-auto text-left text-xs text-slate-600">
                    {Array.from(files).map((file) => (
                      <li key={file.name} className="truncate">
                        • {file.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card padding="lg" className="bg-white">
              <h2 className="text-base font-semibold text-slate-800">Report Guidelines</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  • Your report must be in{' '}
                  <span className="font-medium">Microsoft Word (.doc or .docx)</span> format.
                </li>
                <li>
                  • Name each file using your{' '}
                  <span className="font-medium">index number</span> before uploading.
                </li>
                <li>• Ensure the report is complete and proof-read before submission.</li>
                <li>• Avoid uploading executable or script files. They will be discarded.</li>
              </ul>
            </Card>

            <Card padding="lg" className="bg-white flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">Ready to upload?</p>
                <p className="mt-1 text-xs text-slate-500">
                  This will upload your report files to the system. You can only submit once.
                </p>
              </div>
              <Button type="submit" size="lg" disabled={uploading} className="whitespace-nowrap">
                {uploading ? 'Uploading…' : 'Upload Report'}
              </Button>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
