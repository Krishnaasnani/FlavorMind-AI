import { useCallback, useState } from "react";
import { askChef } from "../services/claudeAI";

/** Manages the AI-chef conversation and its request lifecycle. */
export default function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyResponse, setEmptyResponse] = useState("");

  const sendMessage = useCallback(async (userMessage) => {
    const cleanMessage = userMessage?.trim();
    if (!cleanMessage || loading) return { data: null, error: null };

    const userEntry = { role: "user", content: cleanMessage };
    const history = [...messages, userEntry];
    setMessages(history);
    setLoading(true);
    setError("");
    setEmptyResponse("");

    const result = await askChef(cleanMessage, messages);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return result;
    }

    const assistantText = result.data?.text?.trim();
    if (assistantText) {
      setMessages((currentMessages) => [...currentMessages, { role: "assistant", content: assistantText }]);
    } else {
      setEmptyResponse("Chef did not return an answer. Please try asking again.");
    }

    return result;
  }, [loading, messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError("");
    setEmptyResponse("");
  }, []);

  return { messages, sendMessage, loading, clearChat, error, emptyResponse };
}
