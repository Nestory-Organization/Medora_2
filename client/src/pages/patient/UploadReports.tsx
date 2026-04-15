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

const FileItem = ({ file, onRemove }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="flex items-center justify-between p-4 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl hover:border-teal-500/20 transition-all duration-300"
  >
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${file.name.endsWith('.pdf') ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
        {file.name.endsWith('.pdf') ? <FilePdf size={24} weight="duotone" /> : <FileImage size={24} weight="duotone" />}
      </div>
      <div>
        <h4 className="font-semibold text-slate-100 text-sm truncate max-w-50">{file.name}</h4>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </div>
    <div className="flex gap-2">
      <button title="Download report" className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
        <DownloadSimple size={18} />
      </button>
      <button 
        title="Remove report"
        onClick={() => onRemove(file.id)}
        className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
      >
        <Trash size={18} />
      </button>
    </div>
  </motion.div>
);

export default function UploadReports() {
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // const res = await uploadMedicalReport(formData);
      // setFiles(prev => [...prev, res.data]);
      
      // Simulating for UI
      setTimeout(() => {
        const mockFile = {
            id: Date.now(),
            name: newFiles[0].name,
            size: newFiles[0].size,
            uploadedAt: new Date().toISOString()
        };
        setFiles(prev => [...prev, mockFile]);
        setIsUploading(false);
      }, 1500);
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
    }
  };

  const removeFile = (id: number) => {
    setFiles(files.filter(f => f.id !== id));
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
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-3.5 bg-gradient-to-r from-teal-400 to-blue-500 rounded-2xl font-bold text-white shadow-xl shadow-teal-500/20 active:scale-95 transition-all"
            >
              Browse Files
            </button>
          </div>
        </motion.div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Uploads</h2>
          <span className="bg-slate-800/50 px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {files.length} Total
          </span>
        </div>
        
        <div className="space-y-4 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence>
            {files.map((file) => (
              <FileItem key={file.id} file={file} onRemove={removeFile} />
            ))}
          </AnimatePresence>
          {files.length === 0 && (
            <div className="text-center py-12 border border-white/5 bg-slate-900/20 rounded-4xl">
              <p className="text-slate-500 text-sm font-medium">No documents yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
