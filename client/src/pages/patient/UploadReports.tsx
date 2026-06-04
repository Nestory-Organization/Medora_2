import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUp, 
  FilePdf, 
  FileImage, 
  Trash, 
  CircleNotch,
  DownloadSimple,
  Info,
  ShieldCheck,
  MagnifyingGlass,
  Lightbulb
} from '@phosphor-icons/react';
import { usePatient } from '../../api/PatientContext';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { uploadMedicalReport, deleteMedicalDocument } from '../../api/patient';

const FILE_BASE_URL = import.meta.env.VITE_PATIENT_FILES_BASE_URL || 'http://localhost:4002';

const resolveFileUrl = (value: string | undefined) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `${FILE_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
};

interface MedicalDocument {
  _id?: string;
  id?: string;
  originalName?: string;
  fileName?: string;
  fileUrl?: string;
  size?: number;
  uploadedAt?: string;
  date?: string;
}

const FileItem = ({ file, onRemove }: { file: MedicalDocument; onRemove: (id: string) => void }) => {
  const isPdf = (file.originalName || file.fileName || '').toLowerCase().endsWith('.pdf');
  const dateStr = file.uploadedAt || file.date || new Date().toISOString();
  const date = new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="group relative flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        <div className={`relative p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 ${isPdf ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
          {isPdf ? <FilePdf size={24} weight="duotone" /> : <FileImage size={24} weight="duotone" />}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${isPdf ? 'bg-rose-500' : 'bg-blue-500'}`} />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-slate-100 text-sm truncate max-w-45 md:max-w-60 group-hover:text-teal-400 transition-colors">{file.originalName || file.fileName}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded-md border border-white/5">
              {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Size N/A'}
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{date}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
        {file.fileUrl && (
          <a 
            href={resolveFileUrl(file.fileUrl)} 
            target="_blank" 
            rel="noopener noreferrer"
            title="Download report" 
            className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:bg-teal-500/20 hover:text-teal-400 transition-all flex items-center justify-center border border-white/5"
          >
            <DownloadSimple size={18} weight="bold" />
          </a>
        )}
        <button 
          title="Remove report"
          onClick={() => onRemove((file._id || file.id)!)}
          className="p-2.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all border border-white/5"
        >
          <Trash size={18} weight="bold" />
        </button>
      </div>
    </motion.div>
  );
};

export default function UploadReports() {
  const { documents, refreshDocuments, setError } = usePatient();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh documents when navigating to this page
  useRefreshOnNavigate(refreshDocuments);

  const reportFiles = documents;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (newFiles: FileList) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', newFiles[0]);
      formData.append('documentType', 'other');
      await uploadMedicalReport(formData);
      await refreshDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (_id: string) => {
    try {
      await deleteMedicalDocument(_id);
      await refreshDocuments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete report";
      setError(msg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-xl">
              <MagnifyingGlass size={28} weight="fill" className="text-teal-400" />
            </div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter">Medical <span className="text-teal-400">Reports</span></h1>
          </div>
          <p className="text-slate-400 font-medium max-w-md">Securely centralize your clinical documents for instant AI-powered health tracking.</p>
        </div>

        <div className="flex items-center gap-4 bg-white/3 border border-white/5 p-4 rounded-3xl backdrop-blur-xl">
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                <ShieldCheck size={20} weight="fill" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest leading-none mb-1">Privacy Protocol</p>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">256-bit AES Encrypted</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <motion.div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative group h-95 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all duration-700 ease-out overflow-hidden shadow-2xl ${
              dragActive 
              ? 'border-teal-400 bg-teal-500/10 scale-[0.99] shadow-teal-500/20' 
              : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4'
            }`}
          >
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -ml-40 -mb-40" />
            
            <input 
              type="file" 
              id="file-upload"
              ref={fileInputRef}
              className="hidden"
              title="Upload Report"
              onChange={(e) => e.target.files && handleFiles(e.target.files)} 
            />

            <div className={`relative mb-8 group-hover:scale-110 transition-transform duration-500`}>
              <div className={`p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/5 shadow-2xl transition-all duration-500 ${isUploading ? 'animate-pulse scale-90' : 'group-hover:border-teal-500/30'}`}>
                {isUploading ? (
                  <CircleNotch size={64} className="text-teal-400 animate-spin" weight="bold" />
                ) : (
                  <CloudArrowUp size={64} className={`${dragActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-teal-400'} transition-colors duration-500`} weight="duotone" />
                )}
              </div>
              {!isUploading && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                  <div className="w-4 h-0.5 bg-white rounded-full rotate-90" />
                  <div className="w-4 h-0.5 bg-white rounded-full absolute" />
                </div>
              )}
            </div>
            
            <div className="text-center px-10 relative z-10">
              <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
                {isUploading ? 'Secure Transmission...' : dragActive ? 'Release to Upload' : 'Intelligent Document Vault'}
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-8 max-w-xs mx-auto leading-relaxed">
                Connect your medical records for holistic health analytics. Supports PDF, high-res JPG or PNG (Max 10MB).
              </p>
              <button 
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="group/btn relative px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-teal-400 hover:text-white hover:scale-105 active:scale-95 shadow-[0_15px_30px_-5px_rgba(255,255,255,0.1)] disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10">Select Laboratory Files</span>
                <div className="absolute inset-0 bg-linear-to-r from-teal-400 to-blue-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </motion.div>

          {/* New Support Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white/2 border border-white/5 flex items-start gap-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                <Info size={20} weight="bold" />
              </div>
              <div>
                <h5 className="text-xs font-black text-white uppercase tracking-widest mb-1">Expert Review</h5>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">AI analyzes and flags critical markers for your doctor's priority review.</p>
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-white/2 border border-white/5 flex items-start gap-4">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-500 shrink-0">
                <Lightbulb size={20} weight="fill" />
              </div>
              <div>
                <h5 className="text-xs font-black text-white uppercase tracking-widest mb-1">AI Extraction</h5>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">Automatic data extraction turns images into clinical health trends.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight italic">Registry <span className="text-slate-500 ml-1">Archive</span></h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Verified Medical Documents</p>
            </div>
            <span className="bg-teal-500/10 border border-teal-500/20 px-4 py-1.5 rounded-full text-[10px] font-black text-teal-400 uppercase tracking-widest">
               {reportFiles.length} Records
            </span>
          </div>

          <div className="space-y-4 max-h-160 overflow-y-auto pr-3 custom-scrollbar">
            <AnimatePresence mode="popLayout" initial={false}>
              {reportFiles.length > 0 ? (
                reportFiles.map((file: MedicalDocument) => (
                  <FileItem key={file._id || file.id} file={file} onRemove={removeFile} />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 border border-white/5 rounded-[2.5rem] bg-white/1"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 opacity-40">
                    <CloudArrowUp size={32} className="text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic text-center">No Clinical Data Synchronized</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
