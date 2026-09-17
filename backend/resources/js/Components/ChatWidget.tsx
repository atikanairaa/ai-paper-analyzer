import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
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
      text: 'Halo! Saya AI asisten Anda. Ada yang ingin ditanyakan tentang paper ini?',
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
      // Panggil backend Laravel yang akan meneruskan ke FastAPI
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
        text: 'Maaf, terjadi kesalahan saat menghubungi server AI.',
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
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center justify-center z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 md:w-96 bg-white/95 dark:bg-[#1e293b]/90 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50 h-[500px] max-h-[80vh]">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold">Tanya AI</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/95 dark:bg-[#1e293b]/90 border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                  <p className="text-sm">{msg.text}</p>
                  {msg.evidence && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/30 text-blue-800 text-xs p-2 rounded border border-blue-100 flex flex-col">
                      <span className="font-semibold text-blue-900 mb-1">Sumber Bukti:</span>
                      <span className="italic">{msg.evidence}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/95 border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-500">AI sedang memikirkan jawaban...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white/95 dark:bg-[#1e293b]/90 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                placeholder="Tanya tentang dataset, metodologi..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white/95 dark:bg-[#1e293b]/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-4 py-2 text-sm transition-all outline-none disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-2 rounded-full transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

