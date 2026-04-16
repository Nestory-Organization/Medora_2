import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUp, 
  FilePdf, 
  FileImage, 
  Trash, 
  CircleNotch,
  DownloadSimple
} from '@phosphor-icons/react';
import { usePatient } from '../../api/PatientContext';
import { uploadMedicalReport } from '../../api/patient';

const FileItem = ({ file, onRemove }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="flex items-center justify-between p-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl hover:border-teal-500/20 transition-all duration-300"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${(file.name || file.fileName || '').endsWith('.pdf') ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
        {(file.name || file.fileName || '').endsWith('.pdf') ? <FilePdf size={24} weight="duotone" /> : <FileImage size={24} weight="duotone" />}
      </div>
      <div>
        <h4 className="font-semibold text-slate-100 text-sm truncate max-w-50">{file.name || file.fileName}</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : new Date(file.uploadedAt || file.date).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="flex gap-2">
      {file.url && (
        <a 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          title="Download report" 
          className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center"
        >
          <DownloadSimple size={18} />
        </a>
      )}
      <button 
        title="Remove report"
        onClick={() => onRemove(file.id || file._id)}
        className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
      >
        <Trash size={18} />
      </button>
    </div>
  </motion.div>
);

export default function UploadReports() {
  const { history, refreshHistory, setError } = usePatient();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter history for items that have file attachments/reports
  const reportFiles = history.filter((item: any) => item.reportUrl || item.fileName || item.url);

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
      formData.append('report', newFiles[0]);
      await uploadMedicalReport(formData);
      await refreshHistory();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (_id: string) => {
    // Logic for deleting a report could go here
    console.log("Delete report", _id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-3 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Medical Reports</h1>
          <p className="text-slate-500">Securely store and share your health documents.</p>
        </div>

        <motion.div 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative h-75 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
            dragActive 
            ? 'border-teal-400 bg-teal-500/10 bg-opacity-10 scale-[0.98]' 
            : 'border-white/10 bg-slate-900/40 hover:border-white/20'
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -mr-32 -mt-32" />
          
          <input 
            type="file" 
            id="file-upload"
            ref={fileInputRef}
            className="hidden"
            title="Upload Report"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} 
          />

          <div className={`p-6 rounded-4xl bg-slate-800/50 mb-6 transition-transform duration-500 ${isUploading ? 'animate-pulse' : ''}`}>
            {isUploading ? (
              <CircleNotch size={48} className="text-teal-400 animate-spin" weight="bold" />
            ) : (
              <CloudArrowUp size={48} className="text-teal-400" weight="duotone" />
            )}
          </div>
          
          <div className="text-center px-4">
            <h3 className="text-xl font-bold mb-2">
              {isUploading ? 'Uploading your file...' : 'Drop your files here'}
            </h3>
            <p className="text-slate-500 text-sm mb-6">PDF, JPG, PNG up to 10MB</p>
            <button 
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl font-bold text-white shadow-xl shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              Browse Files
            </button>
          </div>
        </motion.div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Uploads</h2>
          <span className="bg-slate-800/50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {reportFiles.length} Total
          </span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {reportFiles.map((file: any) => (
              <FileItem key={file._id || file.id} file={file} onRemove={removeFile} />
            ))}
            {reportFiles.length === 0 && (
              <p className="text-center text-slate-600 py-10 italic">No reports uploaded yet.</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
