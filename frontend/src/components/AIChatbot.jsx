import React, { useState, useRef, useEffect } from "react";
import styles from "./AIChatbot.module.css";

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hi there! I'm the SSGI Digital Library AI Assistant. Need help finding a document?",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, isBot: false }]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + "/api/chatbot/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: userMessage }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { text: data.response, isBot: true }]);
      }
      setIsTyping(false);
    } catch (error) {
      console.error("Chat error", error);
      setMessages((prev) => [
        ...prev,
        { text: "Error connecting to AI service.", isBot: true },
      ]);
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        className={styles.chatbotMinimized}
        onClick={() => setIsOpen(true)}
      >
        💬 Need Help?
      </button>
    );
  }

  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatbotHeader}>
        <span>AI Assistant</span>
        <button className={styles.toggleBtn} onClick={() => setIsOpen(false)}>
          ×
        </button>
      </div>

      <div className={styles.chatMessages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${msg.isBot ? styles.botMessage : styles.userMessage}`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.message} ${styles.botMessage}`}>
            typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.chatInputArea}>
        <input
          type="text"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>➤</button>
      </div>
    </div>
  );
};

export default AIChatbot;
