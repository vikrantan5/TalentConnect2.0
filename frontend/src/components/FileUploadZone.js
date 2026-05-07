import React, { useState, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const FileUploadZone = ({ onFilesSelected, maxFiles = 5, existingFiles = [] }) => {
  const [files, setFiles] = useState(existingFiles);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: `${file.name}: File size exceeds 10MB limit` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `${file.name}: Invalid file type. Only PDF, DOC, DOCX, ZIP allowed` };
    }

    return { valid: true };
  };

  const handleFiles = (newFiles) => {
    setError('');
    const fileArray = Array.from(newFiles);

    if (files.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validationErrors = [];
    const validFiles = [];

    fileArray.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        validationErrors.push(validation.error);
      }
    });

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    const updatedFiles = [...files, ...validFiles];
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesSelected(updatedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.zip"
        onChange={handleChange}
        className="hidden"
      />

      {/* Drop Zone */}
      <div
        className={`relative rounded-[24px] border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-cyan-400 bg-cyan-500/10 shadow-glow'
            : 'border-black/15 dark:border-white/15 bg-white/40 dark:bg-white/5 hover:border-cyan-400/60 hover:bg-cyan-500/5'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className={`w-14 h-14 rounded-2xl mx-auto grid place-items-center mb-3 transition ${
          dragActive
            ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-soft'
            : 'bg-cyan-500/10 text-cyan-500'
        }`}>
          <Upload className="w-6 h-6" />
        </div>
        <p className="font-display text-2xl text-ink-950 dark:text-white">
          {dragActive ? 'Drop files to upload' : 'Drop files or click to browse'}
        </p>
        <p className="text-xs text-ink-500 dark:text-ink-300 mt-2">
          PDF · DOC · DOCX · ZIP — up to 10MB each ({maxFiles} max)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-2xl bg-coral-500/10 border border-coral-500/30">
          <AlertCircle className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-coral-600 dark:text-coral-300">{error}</p>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-2xl glass border border-black/5 dark:border-white/10"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 grid place-items-center text-white shadow-soft">
                  <File className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-950 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-ink-500 dark:text-ink-300">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="ml-2 w-8 h-8 rounded-full grid place-items-center hover:bg-black/5 dark:hover:bg-white/10 transition"
                title="Remove file"
              >
                <X className="w-4 h-4 text-ink-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-3 flex items-center gap-2 p-3 rounded-2xl glass">
          <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          <p className="text-sm text-ink-700 dark:text-ink-200">Uploading files…</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
