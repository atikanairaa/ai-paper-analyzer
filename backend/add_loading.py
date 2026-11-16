import os

file_path = 'resources/js/Components/OrcidRecommendationModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add sendingInvitations state
old_state = """    const [sentInvitations, setSentInvitations] = useState<number[]>([]);"""
new_state = """    const [sentInvitations, setSentInvitations] = useState<number[]>([]);
    const [sendingInvitations, setSendingInvitations] = useState<number[]>([]);"""

text = text.replace(old_state, new_state)

# Update handleSendInvitation function
old_handle = """    const handleSendInvitation = async (rec: ReviewerRecommendation, index: number) => {
        try {
            await axios.post('/api/admin/reviewers/assign', {
                paper_id: paperId,
                orcid_email: rec.email || `${rec.name.replace(/\s+/g, '').toLowerCase()}@example.com`,
                orcid_name: rec.name
            });
            
            setSentInvitations(prev => [...prev, index]);
            setToastMessage('Undangan review berhasil dikirimkan ke email terdaftar ORCID!');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error: any) {
            setToastMessage(error.response?.data?.message || 'Gagal mengirim undangan. Silakan coba kembali.');
            setTimeout(() => setToastMessage(null), 4000);
        }
    };"""

new_handle = """    const handleSendInvitation = async (rec: ReviewerRecommendation, index: number) => {
        setSendingInvitations(prev => [...prev, index]);
        try {
            await axios.post('/api/admin/reviewers/assign', {
                paper_id: paperId,
                orcid_email: rec.email || `${rec.name.replace(/\\s+/g, '').toLowerCase()}@example.com`,
                orcid_name: rec.name
            });
            
            setSentInvitations(prev => [...prev, index]);
            setToastMessage('Undangan review berhasil dikirimkan ke email terdaftar ORCID!');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error: any) {
            setToastMessage(error.response?.data?.message || 'Gagal mengirim undangan. Silakan coba kembali.');
            setTimeout(() => setToastMessage(null), 4000);
        } finally {
            setSendingInvitations(prev => prev.filter(i => i !== index));
        }
    };"""

text = text.replace(old_handle, new_handle)

# Update the isSent const
old_is_sent = """                                const isSent = sentInvitations.includes(index);"""
new_is_sent = """                                const isSent = sentInvitations.includes(index);
                                const isSending = sendingInvitations.includes(index);"""

text = text.replace(old_is_sent, new_is_sent)

# Update the button
old_btn = """                                                disabled={isSent}
                                                className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                    isSent 
                                                        ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                                                        : 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm border border-transparent'
                                                }`}
                                            >
                                                {isSent ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span>Terkirim ✓</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✉️</span>
                                                        <span>Kirim Undangan</span>
                                                    </>
                                                )}
                                            </button>"""

new_btn = """                                                disabled={isSent || isSending}
                                                className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                    isSent 
                                                        ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                                                        : isSending
                                                        ? 'bg-stone-800 text-stone-300 border border-stone-700 cursor-wait'
                                                        : 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm border border-transparent'
                                                }`}
                                            >
                                                {isSent ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span>Terkirim ✓</span>
                                                    </>
                                                ) : isSending ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>Mengirim...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✉️</span>
                                                        <span>Kirim Undangan</span>
                                                    </>
                                                )}
                                            </button>"""

text = text.replace(old_btn, new_btn)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS")
