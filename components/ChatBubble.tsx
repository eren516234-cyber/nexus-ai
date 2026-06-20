import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  Clipboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { Message } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  message: Message;
  isLast?: boolean;
}

function renderContent(content: string, textColor: string, codeBg: string, codeText: string) {
  const segments = content.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)/g);
  const elements: React.ReactNode[] = [];

  segments.forEach((seg, i) => {
    if (seg.startsWith("```") && seg.endsWith("```")) {
      const inner = seg.slice(3, -3);
      const newline = inner.indexOf("\n");
      const lang = newline > 0 ? inner.slice(0, newline).trim() : "";
      const code = newline > 0 ? inner.slice(newline + 1) : inner;
      elements.push(
        <View key={i} style={[styles.codeBlock, { backgroundColor: codeBg }]}>
          {lang ? (
            <Text style={[styles.codeLang, { color: codeText, opacity: 0.6 }]}>{lang}</Text>
          ) : null}
          <Text style={[styles.codeText, { color: codeText }]} selectable>
            {code.trim()}
          </Text>
        </View>
      );
    } else if (seg.startsWith("`") && seg.endsWith("`")) {
      const inner = seg.slice(1, -1);
      elements.push(
        <Text key={i} style={[styles.inlineCode, { backgroundColor: codeBg, color: codeText }]}>
          {inner}
        </Text>
      );
    } else if ((seg.startsWith("**") && seg.endsWith("**")) || (seg.startsWith("__") && seg.endsWith("__"))) {
      const inner = seg.slice(2, -2);
      elements.push(
        <Text key={i} style={[styles.bold, { color: textColor }]}>
          {inner}
        </Text>
      );
    } else if (seg) {
      const lines = seg.split("\n");
      lines.forEach((line, li) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith("# ")) {
          elements.push(
            <Text key={`${i}-${li}`} style={[styles.h1, { color: textColor }]}>
              {trimmed.slice(2)}
            </Text>
          );
        } else if (trimmed.startsWith("## ")) {
          elements.push(
            <Text key={`${i}-${li}`} style={[styles.h2, { color: textColor }]}>
              {trimmed.slice(3)}
            </Text>
          );
        } else if (trimmed.match(/^(\d+\.|[-*•])\s/)) {
          const marker = trimmed.match(/^(\d+\.)/)?.[1] || "•";
          const text = trimmed.replace(/^(\d+\.|[-*•])\s/, "");
          elements.push(
            <View key={`${i}-${li}`} style={styles.listRow}>
              <Text style={[styles.listMarker, { color: textColor, opacity: 0.6 }]}>{marker}</Text>
              <Text style={[styles.body, { color: textColor }]}>{text}</Text>
            </View>
          );
        } else if (trimmed.length > 0) {
          elements.push(
            <Text key={`${i}-${li}`} style={[styles.body, { color: textColor }]}>
              {trimmed}
            </Text>
          );
        } else if (li < lines.length - 1) {
          elements.push(<View key={`${i}-${li}`} style={styles.spacer} />);
        }
      });
    }
  });
  return elements;
}

export function ChatBubble({ message, isLast }: Props) {
  const colors = useColors();
  const isUser = message.role === "user";

  const codeBg = isUser ? "rgba(0,0,0,0.2)" : colors.surface as string;
  const codeText = isUser ? "#F0F0FF" : colors.foreground as string;
  const bubbleBg = isUser ? colors.userBubble as string : colors.aiBubble as string;
  const textColor = isUser ? colors.userBubbleText as string : colors.aiBubbleText as string;

  const onCopy = useCallback(async () => {
    Clipboard.setString(message.content);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [message.content]);

  return (
    <Animated.View
      entering={Platform.OS !== "web" ? FadeInUp.duration(220) : undefined}
      style={[
        styles.wrapper,
        isUser ? styles.wrapperUser : styles.wrapperAI,
      ]}
    >
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary as string }]}>
          <Ionicons name="sparkles" size={13} color="#FFF" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
          {
            backgroundColor: bubbleBg,
            borderColor: isUser ? "transparent" : colors.border as string,
          },
        ]}
      >
        {renderContent(message.content, textColor, codeBg, codeText)}
        {message.isStreaming && (
          <View style={styles.streamingDot}>
            <Text style={[styles.cursor, { color: textColor }]}>▋</Text>
          </View>
        )}
      </View>
      {!isUser && isLast && !message.isStreaming && (
        <TouchableOpacity
          onPress={onCopy}
          style={[styles.copyBtn, { backgroundColor: colors.surface as string }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="copy-outline" size={14} color={colors.mutedForeground as string} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    maxWidth: "100%",
  },
  wrapperUser: {
    alignItems: "flex-end",
  },
  wrapperAI: {
    alignItems: "flex-start",
    flexDirection: "column",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "85%",
  },
  bubbleUser: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    maxWidth: "92%",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  bold: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_600SemiBold",
  },
  h1: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
    marginBottom: 2,
  },
  h2: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
    marginBottom: 2,
  },
  codeBlock: {
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    width: "100%",
  },
  codeLang: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inlineCode: {
    fontSize: 13,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  listRow: {
    flexDirection: "row",
    gap: 6,
    marginVertical: 1,
    paddingRight: 4,
  },
  listMarker: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
    minWidth: 16,
  },
  spacer: {
    height: 6,
  },
  streamingDot: {
    marginTop: 2,
  },
  cursor: {
    fontSize: 16,
    lineHeight: 20,
  },
  copyBtn: {
    marginTop: 4,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
