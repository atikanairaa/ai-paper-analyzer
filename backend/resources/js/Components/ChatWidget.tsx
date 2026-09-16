import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  evidence?: string;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: 'Halo! Saya AI asisten Anda. Ada yang ingin ditanyakan tentang paper ini?',
    }
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Paper ini menggunakan dataset CIFAR-10.',
        evidence: 'Halaman 5, Bagian Dataset',
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
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
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white/95 dark:bg-[#1e293b]/90 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Tanya tentang dataset, metodologi..."
                className="flex-1 bg-gray-100 border-transparent focus:bg-white/95 dark:bg-[#1e293b]/90 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-4 py-2 text-sm transition-all outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
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

