import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Lock, LogIn, FileText, X, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Message {
  content: string;
  isBot: boolean;
  sourceDocuments?: any[];
}

interface FlowiseResponse {
  text: string;
  sourceDocuments?: any[];
  usedTools?: any[];
  question?: string;
  chatId?: string;
  chatMessageId?: string;
  isStreamValid?: boolean;
  sessionId?: string;
  memoryType?: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  documentIndex: number;
}

const DocumentModal: React.FC<ModalProps> = ({ isOpen, onClose, document, documentIndex }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">Fuente de Documento {documentIndex + 1}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="prose max-w-none">
            <div className="text-gray-800 whitespace-pre-wrap">{document.pageContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SourceDocumentChip: React.FC<{
  document: any;
  index: number;
}> = ({ document, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const preview = document.pageContent.slice(0, 100) + (document.pageContent.length > 100 ? '...' : '');

  return (
    <>
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="font-medium text-gray-700">Fuente {index + 1}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-600 mb-2">{preview}</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              Ver documento completo
            </button>
          </div>
        )}
      </div>
      <DocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        document={document}
        documentIndex={index}
      />
    </>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Efren2025*") {
      setIsAuthenticated(true);
      setMessages([{
        content: "¡Hola! Soy el RAG de Efrén, puedes preguntarme algo de la base de conocimientos de Efrén",
        isBot: true
      }]);
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { content: userMessage, isBot: false }]);
    setIsLoading(true);

    try {
      const response = await axios.post<FlowiseResponse>(
        'https://ai.efrenmartinezortiz-ia.com/api/v1/prediction/4231e849-4c2d-47ec-9e71-17594dad1ece',
        { question: userMessage },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const botMessage = response.data.text || "Lo siento, no pude procesar tu mensaje.";
      
      if (response.data.sourceDocuments && response.data.sourceDocuments.length > 0) {
        try {
          await axios.post('https://api.efrenmartinezortiz-ia.com/webhook/rag/logs', {
            question: userMessage,
            answer: botMessage,
            sourceDocuments: response.data.sourceDocuments.map(doc => doc.pageContent)
          });
        } catch (error) {
          console.error('Error logging to webhook:', error);
        }
      }

      setMessages(prev => [...prev, { 
        content: botMessage, 
        isBot: true,
        sourceDocuments: response.data.sourceDocuments 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.",
        isBot: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Lock className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
            Acceso al RAG de Efrén
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa la contraseña"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-3">
          <Bot className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-800">Efren RAG 🧠</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className="max-w-[80%]">
                <div
                  className={`rounded-lg p-4 ${
                    message.isBot
                      ? 'bg-white text-gray-800 shadow-md prose prose-sm max-w-none'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {message.isBot ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
                {message.isBot && message.sourceDocuments && message.sourceDocuments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.sourceDocuments.map((doc, docIndex) => (
                      <SourceDocumentChip
                        key={docIndex}
                        document={doc}
                        index={docIndex}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-lg p-4 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse">Pensando</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <Send className="w-5 h-5" />
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
