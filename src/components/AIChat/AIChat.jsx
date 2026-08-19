import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import useAIChat from "../../hooks/useAIChat";
import { AI_CONFIG } from "../../constants";
import styles from "./AIChat.module.css";

function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, loading, clearChat, error, emptyResponse } = useAIChat();

  const submitMessage = useCallback(async (event) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message) return;
    setInput("");
    const result = await sendMessage(message);
    if (result.error) toast.error(result.error);
  }, [input, sendMessage]);

  const sendSuggestedPrompt = useCallback(async (prompt) => {
    const result = await sendMessage(prompt);
    if (result.error) toast.error(result.error);
  }, [sendMessage]);

  return (
    <aside className={styles.widget} aria-label="AI chef assistant">
      {isOpen && <section className={styles.drawer} role="dialog" aria-modal="true" aria-label="AI chef chat">
        <header className={styles.header}><div><p>RecipeFinder AI</p><h2>Ask the AI chef</h2></div><button className={styles.close} type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button></header>
        <div className={styles.messages} aria-live="polite">
          {messages.length === 0 && <div className={styles.suggestions}><p>Need an idea? Try one of these:</p>{AI_CONFIG.SUGGESTED_PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => sendSuggestedPrompt(prompt)} disabled={loading}>“{prompt}”</button>)}</div>}
          {messages.map((message, index) => <p className={message.role === "user" ? styles.userMessage : styles.assistantMessage} key={`${message.role}-${index}`}><strong>{message.role === "user" ? "You" : "Chef"}</strong>{message.content}</p>)}
          {loading && <p className={styles.thinking}>Chef is thinking…</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          {emptyResponse && <p className={styles.emptyResponse}>{emptyResponse}</p>}
        </div>
        <form className={styles.form} onSubmit={submitMessage}><label><span>Ask a cooking question</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about ingredients or recipes" disabled={loading} /></label><button type="submit" disabled={loading || !input.trim()}>Send</button></form>
        <button className={styles.clear} type="button" onClick={clearChat} disabled={messages.length === 0}>Clear chat</button>
      </section>}
      <button className={styles.launcher} type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? "Close AI chef chat" : "Open AI chef chat"}>💬 <span>Ask AI Chef</span></button>
    </aside>
  );
}

export default AIChat;
