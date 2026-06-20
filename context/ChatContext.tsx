import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  projectId?: string;
  agentId?: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  createConversation: (model?: string, agentId?: string) => Conversation;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "createdAt">) => Message;
  updateLastMessage: (conversationId: string, content: string) => void;
  finalizeStreaming: (conversationId: string) => void;
  renameConversation: (id: string, title: string) => void;
  clearAllConversations: () => void;
}

const ChatContext = createContext<ChatState | null>(null);

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    title: "Building a REST API",
    model: "gpt-4o",
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 1800000,
    messages: [
      {
        id: "m1",
        role: "user",
        content: "How do I build a REST API with Node.js and Express?",
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "I'll walk you through building a production-ready REST API with Node.js and Express.\n\n**Setup**\n\nStart by initializing your project:\n\n```bash\nmkdir my-api && cd my-api\nnpm init -y\nnpm install express cors helmet morgan\n```\n\n**Basic server structure:**\n\n```javascript\nconst express = require('express');\nconst app = express();\n\napp.use(express.json());\napp.use(cors());\n\napp.get('/health', (req, res) => {\n  res.json({ status: 'ok' });\n});\n\napp.listen(3000);\n```",
        createdAt: Date.now() - 3600000 * 2 + 5000,
      },
    ],
  },
  {
    id: "conv-2",
    title: "React performance tips",
    model: "claude-3-5-sonnet",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000 + 600000,
    messages: [
      {
        id: "m3",
        role: "user",
        content: "What are the best practices for React performance optimization?",
        createdAt: Date.now() - 86400000,
      },
      {
        id: "m4",
        role: "assistant",
        content:
          "Here are the key React performance optimization techniques:\n\n1. **Memoization** — Use `React.memo`, `useMemo`, and `useCallback` to prevent unnecessary re-renders.\n\n2. **Code splitting** — Use `React.lazy` and `Suspense` to load components on demand.\n\n3. **Virtualization** — For long lists, use `react-window` or `FlatList` to only render visible items.",
        createdAt: Date.now() - 86400000 + 3000,
      },
    ],
  },
  {
    id: "conv-3",
    title: "Machine learning basics",
    model: "gpt-4o",
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2 + 900000,
    messages: [
      {
        id: "m5",
        role: "user",
        content: "Explain neural networks in simple terms",
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: "m6",
        role: "assistant",
        content:
          "A neural network is inspired by the human brain. It consists of layers of interconnected nodes (neurons) that process information.\n\nThink of it like a factory assembly line where each station transforms the product slightly until you get the final output.",
        createdAt: Date.now() - 86400000 * 2 + 4000,
      },
    ],
  },
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(DEFAULT_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("@conversations");
        if (stored) {
          const parsed: Conversation[] = JSON.parse(stored);
          if (parsed.length > 0) setConversations(parsed);
        }
      } catch {}
    })();
  }, []);

  const persist = useCallback((convs: Conversation[]) => {
    AsyncStorage.setItem("@conversations", JSON.stringify(convs)).catch(() => {});
  }, []);

  const createConversation = useCallback((model = "gpt-4o", agentId?: string): Conversation => {
    const conv: Conversation = {
      id: `conv-${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
      title: "New conversation",
      model,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      agentId,
    };
    setConversations((prev) => {
      const updated = [conv, ...prev];
      persist(updated);
      return updated;
    });
    return conv;
  }, [persist]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persist(updated);
      return updated;
    });
    setActiveConversationId((curr) => (curr === id ? null : curr));
  }, [persist]);

  const addMessage = useCallback(
    (conversationId: string, msg: Omit<Message, "id" | "createdAt">): Message => {
      const message: Message = {
        ...msg,
        id: `msg-${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
      };
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== conversationId) return c;
          const newMessages = [...c.messages, message];
          const title =
            c.messages.length === 0 && msg.role === "user"
              ? msg.content.slice(0, 48).trim()
              : c.title;
          return { ...c, messages: newMessages, updatedAt: Date.now(), title };
        });
        persist(updated);
        return updated;
      });
      return message;
    },
    [persist]
  );

  const updateLastMessage = useCallback(
    (conversationId: string, content: string) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const messages = [...c.messages];
          if (messages.length === 0) return c;
          messages[messages.length - 1] = {
            ...messages[messages.length - 1],
            content,
            isStreaming: true,
          };
          return { ...c, messages, updatedAt: Date.now() };
        })
      );
    },
    []
  );

  const finalizeStreaming = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== conversationId) return c;
        const messages = c.messages.map((m) => ({ ...m, isStreaming: false }));
        return { ...c, messages };
      });
      persist(updated);
      return updated;
    });
  }, [persist]);

  const renameConversation = useCallback((id: string, title: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title, updatedAt: Date.now() } : c
      );
      persist(updated);
      return updated;
    });
  }, [persist]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveConversationId(null);
    AsyncStorage.removeItem("@conversations").catch(() => {});
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        createConversation,
        deleteConversation,
        addMessage,
        updateLastMessage,
        finalizeStreaming,
        renameConversation,
        clearAllConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
