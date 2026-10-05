import re
with open('resources/js/Pages/PaperDetail.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Define the precise block to replace
start_idx = text.find("border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm}>")
if start_idx != -1:
    # go back to find the <div 
    start_idx = text.rfind('<div className={', 0, start_idx)

end_idx = text.find('                          {/* \xef\xbf\xbd?\xef\xbf\xbd?\xef\xbf\xbd? 1. Metadata Header \xef\xbf\xbd?\xef\xbf\xbd?\xef\xbf\xbd? */}')
if end_idx == -1:
    end_idx = text.find('{/* \xef\xbf\xbd?\xef\xbf\xbd?\xef\xbf\xbd? 1. Metadata Header')
if end_idx == -1:
    end_idx = text.find('1. Metadata Header')
    if end_idx != -1:
        end_idx = text.rfind('                          {/*', 0, end_idx)

if start_idx != -1 and end_idx != -1:
    new_banner = r"""                                    <div className={${isReadyToPublish ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200'} border rounded-2xl p-6 flex flex-col items-start gap-4 shadow-sm}>
                                        <div className="flex items-start gap-4 w-full">
                                            <div className={w-12 h-12  rounded-full flex items-center justify-center flex-shrink-0 border}>
                                                <CheckCircle2 className={w-6 h-6 } />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={	ext-lg font-bold }>
                                                    {isReadyToPublish ? "Siap Dipublikasikan!" : "Selamat! Paper Anda Diterima untuk Dipublikasikan"}
                                                </h3>
                                                <p className={	ext-sm  mt-1 mb-4}>
                                                    {isReadyToPublish ? (isFreeForAuthor ? "Paper Anda berstatus Closed Access (gratis publikasi). Klik tombol di bawah untuk mempublikasikan paper." : "Pembayaran Anda telah dikonfirmasi. Klik tombol di bawah untuk mempublikasikan paper.") : "Pilih jenis akses untuk melanjutkan administrasi jurnal."}
                                                </p>
                                                
                                                {!isReadyToPublish && !(paper as any).payment_url && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-4">
                                                        <label className={lex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors }>
                                                            <input type="radio" name="access_type" value="OPEN_ACCESS" checked={selectedAccessType === 'OPEN_ACCESS'} onChange={() => setSelectedAccessType('OPEN_ACCESS')} className="mt-0.5 accent-emerald-600" />
                                                            <div>
                                                                <p className="text-sm font-semibold text-emerald-900">Open Access</p>
                                                                <p className="text-xs text-emerald-700 mt-0.5">Saya bersedia bayar biaya publikasi</p>
                                                            </div>
                                                        </label>
                                                        <label className={lex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors }>
                                                            <input type="radio" name="access_type" value="CLOSED_ACCESS" checked={selectedAccessType === 'CLOSED_ACCESS'} onChange={() => setSelectedAccessType('CLOSED_ACCESS')} className="mt-0.5 accent-emerald-600" />
                                                            <div>
                                                                <p className="text-sm font-semibold text-emerald-900">Closed Access</p>
                                                                <p className="text-xs text-emerald-700 mt-0.5">Gratis publikasi, pembaca yang bayar</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-shrink-0 self-end mt-4">
                                            {isReadyToPublish ? (
                                                <button onClick={handlePublishPaper} className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-indigo-200">
                                                    <Send className="w-5 h-5" /><span>Publikasikan Paper</span>
                                                </button>
                                            ) : (paper as any).payment_url ? (
                                                <div className="flex flex-col items-end gap-2">
                                                    <a href={(paper as any).payment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-emerald-200">
                                                        <CreditCard className="w-5 h-5" /><span>Bayar Biaya Publikasi (DOKU)</span>
                                                    </a>
                                                    <a href={/simulasi-lunas/} className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl hover:bg-amber-200 font-semibold text-xs transition" title="Simulasi pembayaran berhasil (DEV only)">
                                                        <CheckCircle2 className="w-4 h-4" /><span>Simulasi Pembayaran Berhasil</span>
                                                    </a>
                                                </div>
                                            ) : (
                                                selectedAccessType === 'CLOSED_ACCESS' ? (
                                                    <button onClick={handlePublishPaper} className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-indigo-200">
                                                        <Send className="w-5 h-5" /><span>Publikasikan Gratis</span>
                                                    </button>
                                                ) : (
                                                    <button onClick={handleGeneratePayment} disabled={isGeneratingPayment} className="inline-flex items-center space-x-2 px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-stone-200 disabled:opacity-50">
                                                        <CreditCard className="w-5 h-5" /><span>{isGeneratingPayment ? "Memproses..." : "Generate Tagihan"}</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
"""
    new_text = text[:start_idx] + new_banner + text[end_idx:]
    with open('resources/js/Pages/PaperDetail.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("SUCCESS")
else:
    print(f"FAILED TO FIND INDEX. START: {start_idx}, END: {end_idx}")
