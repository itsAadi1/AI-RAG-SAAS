import { useState, useRef, useCallback } from "react";
import { askQuestion, uploadDocument } from "./api";
import "./App.css";

type Message = {
  role: "user" | "ai";
  text: string;
  timestamp?: Date;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      await uploadDocument(file);
      setUploadedFile({
        name: file.name,
        size: file.size,
      });
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload document");
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadAreaRef.current?.classList.add("dragover");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadAreaRef.current?.classList.remove("dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadAreaRef.current?.classList.remove("dragover");

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    
    const userMessage: Message = {
      role: "user",
      text: question,
      timestamp: new Date(),
    };
    
    setMessages((m) => [...m, userMessage]);
    setLoading(true);

    try {
      const res = await askQuestion(question);
      const aiMessage: Message = {
        role: "ai",
        text: res.answer,
        timestamp: new Date(),
      };
      setMessages((m) => [...m, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "ai",
        text: "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((m) => [...m, errorMessage]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Document Intelligence</h1>
        <p>Upload documents and ask questions to get AI-powered insights</p>
      </header>

      <div className="main-content">
        <aside className="upload-section">
          <h2>Upload Document</h2>
          <div
            ref={uploadAreaRef}
            className="upload-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📄</div>
            <div className="upload-text">
              {uploading ? "Uploading..." : "Click or drag to upload"}
            </div>
            <div className="upload-hint">PDF, DOC, TXT files supported</div>
            <input
              ref={fileInputRef}
              type="file"
              className="file-input"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
              Uploading document...
            </div>
          )}

          {uploadedFile && (
            <div className="uploaded-file">
              <div className="file-icon">✓</div>
              <div className="file-info">
                <div className="file-name">{uploadedFile.name}</div>
                <div className="file-size">{formatFileSize(uploadedFile.size)}</div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="error-message">
              <strong>Error:</strong> {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="success-message">
              Document uploaded successfully! You can now ask questions about it.
            </div>
          )}
        </aside>

        <main className="chat-section">
          <div className="chat-header">
            <h2>Chat Assistant</h2>
          </div>

          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">💬</div>
                <div className="empty-state-text">
                  Start a conversation by asking a question about your document
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  <div className="message-avatar">
                    {m.role === "user" ? "U" : "AI"}
                  </div>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="message-author">
                        {m.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      {m.timestamp && (
                        <span className="message-time">{formatTime(m.timestamp)}</span>
                      )}
                    </div>
                    <div className="message-text">{m.text}</div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="loading-indicator">
                <div className="loading-dots">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
                AI is thinking...
              </div>
            )}
          </div>

          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask something about the document... (Press Enter to send, Shift+Enter for new line)"
                className="message-input"
                rows={1}
                disabled={loading}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="send-button"
              >
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
