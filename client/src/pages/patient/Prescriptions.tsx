import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, 
  Calendar, 
  Note, 
  CaretDown, 
  CaretUp,
  DownloadSimple,
  Syringe,
  FirstAid,
  Clock,
  Timer
} from '@phosphor-icons/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePatient } from '../../api/PatientContext';
import { getDoctorProfileById } from '../../api/doctor';
import { useRefreshOnNavigate } from '../../hooks/useRefreshOnNavigate';
import { TableSkeleton } from '../../components/Skeleton';

const PrescriptionCard = ({ prescription }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { profile: patientProfile } = usePatient();

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;

    try {
      setIsDownloading(true);
      
      // Try to fetch doctor profile for details if doctorId exists
      let doctorProfile = null;
      if (prescription.doctorId) {
        try {
          const profileResponse = await getDoctorProfileById(prescription.doctorId);
          if (profileResponse?.success) {
            doctorProfile = profileResponse.data;
          } else if (profileResponse) {
            // Some APIs return data directly without a success flag
            doctorProfile = profileResponse;
          }
        } catch (err) {
          console.error("Failed to fetch doctor profile for receipt:", err);
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(24);
      doc.setTextColor(20, 158, 136); // Teal-500
      doc.text("Medora Medical Prescription", pageWidth / 2, 20, { align: "center" });
      
      doc.setDrawColor(20, 158, 136);
      doc.setLineWidth(0.5);
      doc.line(20, 25, pageWidth - 20, 25);
      
      // Doctor Details (Left Side)
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`Dr. ${prescription.doctorName}`, 20, 35);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      
      const specialty = doctorProfile?.specialization || prescription.doctorSpecialty || "Medical Practitioner";
      doc.text(specialty, 20, 41);
      
      if (doctorProfile?.clinicAddress) {
        const addressLines = doc.splitTextToSize(doctorProfile.clinicAddress, 80);
        doc.text(addressLines, 20, 47);
      }
      if (doctorProfile?.phone) {
        const phoneY = doctorProfile.clinicAddress ? 58 : 47;
        doc.text(`Phone: ${doctorProfile.phone}`, 20, phoneY);
      }

      // Patient & Date Details (Right Side)
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      const patientName = patientProfile ? `${patientProfile.firstName} ${patientProfile.lastName}` : "Valued Patient";
      doc.text(`Patient: ${patientName}`, pageWidth - 20, 35, { align: "right" });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Date: ${new Date(prescription.date).toLocaleDateString()}`, pageWidth - 20, 41, { align: "right" });
      if (prescription._id) {
        doc.text(`Prescription ID: ${prescription._id.substring(0, 8).toUpperCase()}`, pageWidth - 20, 47, { align: "right" });
      }

      // Divider
      doc.setDrawColor(230, 230, 230);
      doc.line(20, 65, pageWidth - 20, 65);

      // Section Title
      doc.setFontSize(14);
      doc.setTextColor(20, 158, 136);
      doc.setFont("helvetica", "bold");
      doc.text("Rx Medications", 20, 75);

      const medicines = (prescription.medicines?.length > 0 ? prescription.medicines : prescription.medications || []);
      
      const tableData = medicines.map((med: any) => [
        med.name,
        med.dosage,
        med.frequency,
        med.duration || '-',
        med.instructions || '-'
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Medicine Name', 'Dosage', 'Frequency', 'Duration', 'Instructions']],
        body: tableData,
        headStyles: { 
          fillColor: [20, 158, 136],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [245, 252, 251] 
        },
        margin: { left: 20, right: 20 },
        theme: 'striped'
      });

      // Notes Section
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(13);
      doc.setTextColor(20, 158, 136);
      doc.setFont("helvetica", "bold");
      doc.text("Doctor's Notes & Instructions", 20, finalY);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      
      const notes = prescription.notes || "Follow as prescribed. If symptoms persist or worsen, please consult your doctor immediately.";
      const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
      doc.text(splitNotes, 20, finalY + 8);

      // Footer
      const footerY = 280;
      doc.setDrawColor(230, 230, 230);
      doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
      
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(9);
      doc.text("This is a digitally generated medical prescription and does not require a physical signature.", pageWidth / 2, footerY, { align: "center" });
      doc.setFontSize(8);
      doc.text("Generated via Medora Telehealth Platform", pageWidth / 2, footerY + 5, { align: "center" });

      doc.save(`Medora_Prescription_${new Date(prescription.date).toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-4xl shadow-2xl relative overflow-hidden group hover:border-teal-500/20 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 p-8 pointer-events-none text-teal-400 opacity-20 group-hover:opacity-40 transition-opacity">
        <FirstAid size={80} weight="duotone" />
      </div>
      
      <div className="p-8 cursor-pointer relative z-10" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between items-start gap-4">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/10 group-hover:scale-110 transition-transform duration-500">
              <Syringe size={28} weight="duotone" />
            </div>
            <div>
              <p className="font-bold text-white text-xl tracking-tight leading-tight mb-1">Dr. {prescription.doctorName}</p>
              <div className="flex items-center gap-3">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} weight="duotone" /> {new Date(prescription.date).toLocaleDateString()}
                </p>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Pill size={12} weight="duotone" /> {prescription.medicines?.length || 0} Meds
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download Prescription" 
              className="p-3 bg-slate-800/80 rounded-xl text-slate-400 hover:bg-teal-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-xl group/btn disabled:opacity-50"
            >
              {isDownloading ? (
                <div className="w-4.5 h-4.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              ) : (
                <DownloadSimple size={18} weight="bold" />
              )}
            </button>
            <div className="p-2 text-slate-500 shadow-xl group-hover:text-teal-400 transition-colors">
              {isOpen ? <CaretUp size={24} weight="bold" /> : <CaretDown size={24} weight="bold" />}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-white/5 relative z-10"
          >
            <div className="p-8 bg-slate-950/20 backdrop-blur-2xl space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Prescribed Medicines</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(prescription.medicines?.length > 0 ? prescription.medicines : prescription.medications || []).map((med: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-teal-500/20 transition-colors group/item relative">
                        <div className="flex items-center gap-3 mb-2">
                            <FirstAid size={20} weight="fill" className="text-teal-400 group-hover/item:rotate-12 transition-transform" />
                            <p className="text-sm font-bold text-slate-200">{med.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                              <Clock size={12} weight="duotone" /> {med.dosage} • {med.frequency}
                          </p>
                          {med.duration && (
                            <p className="text-[11px] font-bold text-teal-600 uppercase flex items-center gap-2">
                                <Timer size={12} weight="duotone" /> Duration: {med.duration}
                            </p>
                          )}
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-slate-400 mt-3 font-medium border-t border-white/5 pt-2 italic">"{med.instructions}"</p>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-3xl p-5 border border-white/5 border-dashed">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Note size={14} weight="duotone" /> Doctor's Instructions
                </p>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {prescription.notes || "No additional instructions provided."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function Prescriptions() {
  const { prescriptions, loading, refreshPrescriptions } = usePatient();

  // Refresh prescriptions when navigating to this page
  useRefreshOnNavigate(refreshPrescriptions);

  useEffect(() => {
    refreshPrescriptions();
    // Intentionally run once when page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const refreshOnFocus = () => {
      refreshPrescriptions();
    };

    const pollId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshPrescriptions();
      }
    }, 20000);

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      window.clearInterval(pollId);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [refreshPrescriptions]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1 leading-tight">My Prescriptions</h1>
        <p className="text-base font-medium text-slate-500 max-w-lg leading-relaxed">View and download your prescribed medications directly from your doctors.</p>
      </div>

      {loading && prescriptions.length === 0 ? (
        <div className="py-12">
          <TableSkeleton rows={4} />
        </div>
      ) : (
        <div className="space-y-6">
          {prescriptions.length > 0 ? (
            prescriptions.map((p, idx) => <PrescriptionCard key={p._id || idx} prescription={p} />)
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-slate-900/20">
              <div className="p-4 bg-slate-800/40 inline-block rounded-2xl mb-4 text-slate-500">
                <Pill size={32} weight="duotone" />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No prescriptions found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
