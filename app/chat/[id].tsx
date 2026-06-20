import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetch } from "expo/fetch";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { ModelPicker, MODELS } from "@/components/ModelPicker";
import { ToolCallCard, type ToolCallDisplay } from "@/components/ToolCallCard";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useApp } from "@/context/AppContext";
import { useChat, type Message } from "@/context/ChatContext";
import { TOOL_DEFINITIONS, executeTool } from "@/services/AgentTools";
import { useColors } from "@/hooks/useColors";

const API_BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

interface ToolDefinitionParam {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

type ChatRole = "user" | "assistant" | "tool";

interface ApiMessage {
  role: ChatRole;
  content: string;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
}

async function streamChat(
  messages: ApiMessage[],
  tools: ToolDefinitionParam[],
  onDelta: (text: string) => void,
  onToolCall: (id: string, name: string, args: Record<string, string>) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, tools }),
  });

  if (!res.ok || !res.body) {
    onError(`Server error: ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as {
          type: string;
          content?: string;
          id?: string;
          name?: string;
          arguments?: Record<string, string>;
          message?: string;
        };
        if (event.type === "delta" && event.content) onDelta(event.content);
        if (event.type === "tool_call" && event.id && event.name && event.arguments) {
          onToolCall(event.id, event.name, event.arguments);
        }
        if (event.type === "done") onDone();
        if (event.type === "error") onError(event.message ?? "Unknown error");
      } catch {}
    }
  }
}

async function streamToolResult(
  messages: ApiMessage[],
  toolCallId: string,
  toolName: string,
  toolResult: string,
  onDelta: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
) {
  const res = await fetch(`${API_BASE}/chat/tool-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      tool_call_id: toolCallId,
      tool_name: toolName,
      tool_result: toolResult,
    }),
  });

  if (!res.ok || !res.body) {
    onError(`Server error: ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6)) as { type: string; content?: string; message?: string };
        if (event.type === "delta" && event.content) onDelta(event.content);
        if (event.type === "done") onDone();
        if (event.type === "error") onError(event.message ?? "Unknown error");
      } catch {}
    }
  }
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedModel, setSelectedModel } = useApp();
  const { conversations, addMessage, updateLastMessage, finalizeStreaming } = useChat();
  const [isTyping, setIsTyping] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCallDisplay[]>([]);
  const abortRef = useRef(false);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === id),
    [conversations, id]
  );

  const messages = conversation?.messages ?? [];
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const buildApiMessages = useCallback((msgs: Message[]): ApiMessage[] => {
    return msgs.map((m) => ({
      role: m.role as ChatRole,
      content: m.content,
    }));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!conversation || isTyping) return;
      abortRef.current = false;

      // Add user message
      addMessage(conversation.id, { role: "user", content: text });
      setIsTyping(true);
      setToolCalls([]);

      // Snapshot messages for API (before streaming assistant response)
      const historyMsgs = buildApiMessages([
        ...conversation.messages,
        { id: "new", role: "user", content: text, createdAt: Date.now() },
      ]);

      // Add empty assistant message for streaming
      addMessage(conversation.id, { role: "assistant", content: "", isStreaming: true });
      setIsTyping(false);

      let accumulated = "";
      let pendingToolCall: { id: string; name: string; args: Record<string, string> } | null = null;

      await streamChat(
        historyMsgs,
        TOOL_DEFINITIONS as ToolDefinitionParam[],
        (delta) => {
          if (abortRef.current) return;
          accumulated += delta;
          updateLastMessage(conversation.id, accumulated);
        },
        (tcId, tcName, tcArgs) => {
          if (abortRef.current) return;
          pendingToolCall = { id: tcId, name: tcName, args: tcArgs };
          // Show running tool card
          setToolCalls((prev) => [
            ...prev,
            { id: tcId, name: tcName, args: tcArgs, status: "running" },
          ]);
        },
        async () => {
          if (abortRef.current) return;

          // Finalize text stream
          finalizeStreaming(conversation.id);

          if (!pendingToolCall) return;

          const { id: tcId, name: tcName, args: tcArgs } = pendingToolCall;

          // Execute the device tool
          const result = await executeTool(tcName, tcArgs);

          // Update tool card status
          setToolCalls((prev) =>
            prev.map((tc) =>
              tc.id === tcId
                ? {
                    ...tc,
                    status: result.success ? "done" : "error",
                    displayText: result.displayText,
                    imageUri: result.imageUri,
                  }
                : tc
            )
          );

          if (abortRef.current) return;

          // Build the full message history including the assistant's tool_call message
          const updatedHistory: ApiMessage[] = [
            ...historyMsgs,
            {
              role: "assistant",
              content: accumulated,
              tool_calls: [
                {
                  id: tcId,
                  type: "function",
                  function: { name: tcName, arguments: JSON.stringify(tcArgs) },
                },
              ],
            },
          ];

          // Add a new streaming assistant message for the follow-up
          addMessage(conversation.id, { role: "assistant", content: "", isStreaming: true });
          let followUp = "";

          await streamToolResult(
            updatedHistory,
            tcId,
            tcName,
            result.success
              ? JSON.stringify(result.data ?? { result: result.displayText })
              : JSON.stringify({ error: result.error }),
            (delta) => {
              if (abortRef.current) return;
              followUp += delta;
              updateLastMessage(conversation.id, followUp);
            },
            () => {
              finalizeStreaming(conversation.id);
              pendingToolCall = null;
            },
            (errMsg) => {
              updateLastMessage(conversation.id, `Error: ${errMsg}`);
              finalizeStreaming(conversation.id);
            }
          );
        },
        (errMsg) => {
          updateLastMessage(conversation.id, `Sorry, something went wrong: ${errMsg}`);
          finalizeStreaming(conversation.id);
        }
      );
    },
    [conversation, isTyping, addMessage, updateLastMessage, finalizeStreaming, buildApiMessages]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const currentModelLabel = MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel;

  if (!conversation) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Conversation not found</Text>
      </View>
    );
  }

  // Interleave tool call cards into the reversed message list
  const reversedToolCalls = [...toolCalls].reverse();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: topPad + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground as string} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.titleArea} onPress={() => setModelPickerVisible(true)}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            {conversation.title}
          </Text>
          <View style={styles.modelRow}>
            <Ionicons name="sparkles" size={11} color={colors.primary as string} />
            <Text style={[styles.modelLabel, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              {currentModelLabel}
            </Text>
            <Feather name="chevron-down" size={12} color={colors.primary as string} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="more-horizontal" size={22} color={colors.foreground as string} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={reversedMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => (
          <ChatBubble message={item} isLast={index === 0} />
        )}
        inverted
        contentContainerStyle={styles.messageList}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {isTyping && <TypingIndicator />}
            {reversedToolCalls.map((tc) => (
              <ToolCallCard key={tc.id} tool={tc} />
            ))}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="sparkles" size={28} color={colors.primary as string} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              Nexus AI
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Ask me anything or say{"\n"}"take a photo", "call someone", "where am I"
            </Text>
            <View style={styles.suggestions}>
              {[
                { icon: "camera-outline" as const, text: "Take a photo" },
                { icon: "location-outline" as const, text: "Where am I?" },
                { icon: "search-outline" as const, text: "Search the web" },
                { icon: "call-outline" as const, text: "Make a call" },
              ].map((s) => (
                <TouchableOpacity
                  key={s.text}
                  onPress={() => handleSend(s.text)}
                  style={[styles.suggestionPill, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name={s.icon} size={14} color={colors.primary as string} />
                  <Text style={[styles.suggestionText, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                    {s.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      <ChatInput onSend={handleSend} disabled={isTyping} />

      <ModelPicker
        visible={modelPickerVisible}
        selected={selectedModel}
        onSelect={setSelectedModel}
        onClose={() => setModelPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  titleArea: { flex: 1, alignItems: "center", gap: 2 },
  headerTitle: { fontSize: 16 },
  modelRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  modelLabel: { fontSize: 12 },
  moreBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  messageList: { paddingVertical: 12, flexGrow: 1 },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 24, textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  suggestions: { gap: 8, width: "100%", marginTop: 4 },
  suggestionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggestionText: { fontSize: 14 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16 },
});
