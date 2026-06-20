import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export const MODELS = [
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI", badge: "Smart" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", provider: "OpenAI", badge: "Fast" },
  { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic", badge: "Best" },
  { id: "claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic", badge: "Fast" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", provider: "Google", badge: "Long" },
];

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function ModelPicker({ visible, selected, onSelect, onClose }: Props) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
            Select model
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {MODELS.map((model) => {
              const isSelected = selected === model.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  onPress={() => { onSelect(model.id); onClose(); }}
                  activeOpacity={0.7}
                  style={[
                    styles.modelRow,
                    {
                      backgroundColor: isSelected ? colors.primary + "15" : "transparent",
                      borderColor: isSelected ? colors.primary + "40" : colors.border,
                    },
                  ]}
                >
                  <View style={styles.modelInfo}>
                    <Text style={[styles.modelLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                      {model.label}
                    </Text>
                    <Text style={[styles.modelProvider, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {model.provider}
                    </Text>
                  </View>
                  <View style={styles.modelRight}>
                    <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
                      <Text style={[styles.badgeText, { color: colors.primary as string, fontFamily: "Inter_500Medium" }]}>
                        {model.badge}
                      </Text>
                    </View>
                    {isSelected && (
                      <Feather name="check" size={16} color={colors.primary as string} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === "web" ? 34 : 40,
    maxHeight: "70%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#888",
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.4,
  },
  sheetTitle: {
    fontSize: 18,
    marginBottom: 14,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modelInfo: {
    gap: 2,
  },
  modelLabel: {
    fontSize: 15,
  },
  modelProvider: {
    fontSize: 12,
  },
  modelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
  },
});
