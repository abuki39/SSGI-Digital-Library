import React, { useState, useRef, useEffect } from "react";
import styles from "./AiAssistant.module.css";

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content:
        "Hello! I am your SSGI Research Assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        import.meta.env.VITE_API_URL + "/api/ask-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",

          },
          body: JSON.stringify({ question: userMessage }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to get a response");
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>SSGI AI Assistant</div>
            <button className={styles.closeButton} onClick={toggleChat}>
              &times;
            </button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`${styles.messageWrapper} ${msg.role === "user" ? styles.userWrapper : styles.aiWrapper}`}
              >
                <div
                  className={`${styles.message} ${msg.role === "user" ? styles.userMessage : styles.aiMessage}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.messageWrapper} ${styles.aiWrapper}`}>
                <div
                  className={`${styles.message} ${styles.aiMessage} ${styles.loading}`}
                >
                  AI is digging through the archives... â³
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className={styles.inputArea}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your authorized documents..."
              className={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button className={styles.fab} onClick={toggleChat}>
        {isOpen ? (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>
    </div>
  );
};

export default AiAssistant;
