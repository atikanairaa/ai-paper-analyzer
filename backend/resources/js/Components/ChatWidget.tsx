import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  evidence?: string;
}

interface ChatWidgetProps {
  paperId: number;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ paperId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Halo! Saya AI asisten yang siap membantu Anda memahami paper ini. Silakan tanyakan tentang metodologi, temuan, dataset, atau aspek lainnya.',
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post(`/api/papers/${paperId}/qa`, {
        question: userText
      });

      const responseData = response.data.data;

      const aiResponse: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseData?.answer || 'Maaf, saya tidak dapat menemukan jawaban untuk pertanyaan tersebut.',
        evidence: responseData?.evidence || undefined,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Maaf, terjadi kesalahan saat menghubungi server AI. Silakan coba beberapa saat lagi.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Tanya AI tentang paper ini"
          className="fixed bottom-6 right-6 bg-stone-900 hover:bg-stone-800 text-white font-medium px-4 py-2.5 rounded-full shadow-lg border border-stone-700 transition-all hover:scale-105 hover:shadow-2xl flex items-center justify-center space-x-2 z-50 group"
        >
          <span>💬</span>
          <span>Tanya AI Paper</span>
          {/* Pulse ring */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-[#e8e4dc] overflow-hidden flex flex-col z-50 h-[520px] max-h-[85vh]">

          {/* Header */}
          <div className="bg-gradient-to-r from-stone-800 to-stone-900 px-4 py-3 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-stone-700/60 border border-stone-600/50 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-rose-300" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm leading-tight">Asisten AI Analisis Paper</h3>
                <p className="text-[10px] text-stone-400 leading-tight">Tanya jawab seputar isi paper & sitasi</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-700/60 rounded-lg transition-colors"
              aria-label="Tutup chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#faf8f5] space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender Label */}
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 px-1">
                    {msg.sender === 'user' ? 'Anda' : 'AI Asisten'}
                  </span>

                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-tr-sm shadow-md'
                      : 'bg-white border border-[#e8e4dc] text-stone-800 rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>

                  {/* Evidence Badge */}
                  {msg.evidence && (
                    <div className="max-w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 flex flex-col space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                        📌 Kutipan Sumber
                      </span>
                      <span className="text-xs text-stone-700 italic leading-relaxed">
                        "{msg.evidence}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#e8e4dc] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center space-x-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span className="text-xs text-stone-500">AI sedang membaca paper...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e8e4dc]" />

          {/* Input Area */}
          <div className="p-3 bg-white flex-shrink-0">
            <div className="flex items-center space-x-2 bg-[#faf8f5] rounded-xl border border-[#e8e4dc] px-3 py-1.5 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                placeholder="Tanya tentang metodologi, dataset..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="w-8 h-8 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[9px] text-stone-400 text-center mt-1.5">
              Didukung oleh AI — Jawaban berdasarkan konten paper
            </p>
          </div>
        </div>
      )}
    </>
  );
};
