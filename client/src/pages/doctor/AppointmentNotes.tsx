import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash, Check, Warning, Download } from '@phosphor-icons/react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../../components/PageTransition';

interface AppointmentNote {
  _id: string;
  appointmentId: string;
  title: string;
  content: string;
  tags?: string[];
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AppointmentNotes() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<AppointmentNote | null>(null);
  const [title, setTitle] = useState('Appointment Notes');
  const [content, setContent] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [appointmentId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `http://localhost:4000/api/doctors/appointment/${appointmentId}/notes`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success && response.data.data) {
        const noteData = response.data.data;
        setNotes(noteData);
        setTitle(noteData.title || 'Appointment Notes');
        setContent(noteData.content || '');
        setDiagnosis(noteData.diagnosis || '');
        setTreatment(noteData.treatment || '');
        setFollowUp(noteData.followUp || '');
        setTags(noteData.tags || []);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Fetch notes error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setMessage({ type: 'error', text: 'Please add some notes' });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const endpoint = notes
        ? `http://localhost:4000/api/doctors/appointment/${appointmentId}/notes`
        : `http://localhost:4000/api/doctors/appointment/${appointmentId}/notes`;

      const response = await axios({
        method: notes ? 'put' : 'post',
        url: endpoint,
        data: {
          title,
          content,
          diagnosis,
          treatment,
          followUp,
          tags
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessage({ type: 'success', text: notes ? 'Notes updated successfully' : 'Notes added successfully' });
        setNotes(response.data.data);
        setTimeout(() => {
          navigate('/doctor/appointments');
        }, 2000);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to save notes';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Notes submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    const noteContent = `
APPOINTMENT NOTES
================
Title: ${title}
Date: ${new Date().toLocaleDateString()}
Appointment ID: ${appointmentId}

DIAGNOSIS:
${diagnosis || 'Not specified'}

TREATMENT:
${treatment || 'Not specified'}

FOLLOW-UP:
${followUp || 'Not specified'}

TAGS: ${tags.length > 0 ? tags.join(', ') : 'None'}

NOTES:
${content}

================
Generated: ${new Date().toLocaleString()}
    `.trim();

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(noteContent));
    element.setAttribute('download', `appointment-notes-${appointmentId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-1 bg-purple-500 rounded-full" />
                <span className="text-[9px] font-black text-purple-500 tracking-[0.2em] uppercase italic">
                  Documentation
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
                Appointment Notes
              </h1>
            </div>
          </div>
          {notes && (
            <button
              onClick={handleDownload}
              className="p-3 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-purple-400"
              title="Download notes"
            >
              <Download size={20} weight="bold" />
            </button>
          )}
        </header>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-lg border flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <Check size={20} weight="bold" />
            ) : (
              <Warning size={20} weight="bold" />
            )}
            <span className="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Note Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Follow-up Consultation"
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>

            {/* Diagnosis, Treatment, Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Patient diagnosis..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                />
              </div>

              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Treatment Plan</label>
                <textarea
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  placeholder="Recommended treatment..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                />
              </div>

              <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Follow-up Plan</label>
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="Follow-up instructions..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Tags</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tags (Press Enter)"
                  className="flex-1 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors"
                >
                  <Plus size={18} weight="bold" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full"
                  >
                    <span className="text-sm text-purple-300 font-semibold">{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Notes Content */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6">
              <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Detailed Notes *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write detailed notes about the appointment, observations, test results, etc..."
                rows={10}
                className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 transition-all resize-none"
                required
              />
              <p className="text-xs text-slate-400 mt-2">{content.length} characters</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/doctor/appointments')}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold text-white transition-colors uppercase tracking-wide"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-all uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} weight="bold" />
                    {notes ? 'Update Notes' : 'Save Notes'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
