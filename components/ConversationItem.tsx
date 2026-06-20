import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useChat, type Conversation } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

const MODEL_LABELS: Record<string, string> = {
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o mini",
  "claude-3-5-sonnet": "Claude 3.5",
  "claude-3-haiku": "Claude Haiku",
  "gemini-1.5-pro": "Gemini 1.5",
};

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

interface Props {
  conversation: Conversation;
}

export function ConversationItem({ conversation }: Props) {
  const colors = useColors();
  const router = useRouter();
  const { deleteConversation } = useChat();

  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const preview = lastMsg?.content.replace(/```[\s\S]*?```/g, "[code]").slice(0, 80) ?? "No messages yet";

  const onPress = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push(`/chat/${conversation.id}`);
  }, [conversation.id, router]);

  const onLongPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete conversation?", `"${conversation.title}"`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteConversation(conversation.id),
      },
    ]);
  }, [conversation, deleteConversation]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[styles.item, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.primary + "20" }]}>
        <Feather name="message-square" size={18} color={colors.primary as string} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            style={[styles.title, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
          >
            {conversation.title}
          </Text>
          <Text style={[styles.time, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {timeAgo(conversation.updatedAt)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            numberOfLines={1}
            style={[styles.preview, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}
          >
            {preview}
          </Text>
          <View style={[styles.modelTag, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modelText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {MODEL_LABELS[conversation.model] ?? conversation.model}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  preview: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  modelTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modelText: {
    fontSize: 10,
  },
});
