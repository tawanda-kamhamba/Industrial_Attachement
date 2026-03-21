import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type StatusType = 'idle' | 'success' | 'error';

export function SubmitReportPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<StatusType>('idle');
  const [message, setMessage] = useState<string | null>(null);

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
      const baseUrl = '/api';
      const res = await fetch(`${baseUrl}/student/report`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const text = await res.text();
      let data: { success?: boolean; error?: string; message?: string } = {};
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/student" className="text-sm text-primary-600 hover:underline">
          ← Back to Dashboard
        </Link>
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
                This will upload your report files to the system using the same backend process as the original
                student portal.
              </p>
            </div>
            <Button type="submit" size="lg" disabled={uploading} className="whitespace-nowrap">
              {uploading ? 'Uploading…' : 'Upload Report'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}

