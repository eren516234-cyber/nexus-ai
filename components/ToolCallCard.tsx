import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

export type ToolStatus = "running" | "done" | "error";

export interface ToolCallDisplay {
  id: string;
  name: string;
  args: Record<string, string>;
  status: ToolStatus;
  displayText?: string;
  imageUri?: string;
}

const TOOL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  open_camera: "camera-outline",
  pick_image: "images-outline",
  get_location: "location-outline",
  make_call: "call-outline",
  send_sms: "chatbubble-ellipses-outline",
  send_email: "mail-outline",
  open_url: "globe-outline",
  search_web: "search-outline",
  open_maps: "map-outline",
  copy_to_clipboard: "copy-outline",
  share_content: "share-outline",
  set_alarm: "alarm-outline",
};

const TOOL_LABELS: Record<string, string> = {
  open_camera: "Camera",
  pick_image: "Photo Library",
  get_location: "Location",
  make_call: "Phone Call",
  send_sms: "Send Message",
  send_email: "Email",
  open_url: "Open URL",
  search_web: "Web Search",
  open_maps: "Maps",
  copy_to_clipboard: "Clipboard",
  share_content: "Share",
  set_alarm: "Alarm",
};

interface Props {
  tool: ToolCallDisplay;
}

export function ToolCallCard({ tool }: Props) {
  const colors = useColors();
  const icon = TOOL_ICONS[tool.name] ?? "flash-outline";
  const label = TOOL_LABELS[tool.name] ?? tool.name;
  const isRunning = tool.status === "running";
  const isError = tool.status === "error";

  const accentColor = isError
    ? (colors.destructive as string)
    : isRunning
    ? (colors.accent as string)
    : (colors.primary as string);

  return (
    <Animated.View
      entering={Platform.OS !== "web" ? FadeInDown.duration(200) : undefined}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: accentColor + "40",
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={[styles.iconBox, { backgroundColor: accentColor + "20" }]}>
              <Ionicons name={icon} size={16} color={accentColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={[styles.toolLabel, { color: colors.foreground as string, fontFamily: "Inter_500Medium" }]}>
                {label}
              </Text>
              {isRunning && (
                <Text style={[styles.runningText, { color: colors.mutedForeground as string, fontFamily: "Inter_400Regular" }]}>
                  Running...
                </Text>
              )}
            </View>
            {isRunning ? (
              <View style={[styles.statusDot, { backgroundColor: accentColor }]} />
            ) : isError ? (
              <Feather name="x-circle" size={16} color={colors.destructive as string} />
            ) : (
              <Feather name="check-circle" size={16} color={colors.primary as string} />
            )}
          </View>

          {tool.displayText && !isRunning && (
            <Text
              style={[
                styles.resultText,
                {
                  color: isError ? (colors.destructive as string) : (colors.foreground as string),
                  fontFamily: "Inter_400Regular",
                },
              ]}
            >
              {tool.displayText}
            </Text>
          )}

          {tool.imageUri && (
            <Image
              source={{ uri: tool.imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  accentBar: {
    width: 3,
  },
  inner: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  toolLabel: {
    fontSize: 13,
  },
  runningText: {
    fontSize: 11,
    marginTop: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  resultText: {
    fontSize: 13,
    lineHeight: 18,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
});
