import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AGENTS, AgentCard, type Agent } from "@/components/AgentCard";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["All", "Development", "Research", "Creative", "Data", "Productivity", "Design", "Security", "General"];

const TOOLS = [
  { id: "web-search", name: "Web Search", icon: "globe-outline" as const, desc: "Search the internet in real time", color: "#06B6D4" },
  { id: "code-run", name: "Code Runner", icon: "play-circle-outline" as const, desc: "Execute code in a secure sandbox", color: "#10B981" },
  { id: "doc-analysis", name: "Doc Analyzer", icon: "document-text-outline" as const, desc: "Upload and analyze documents", color: "#F59E0B" },
  { id: "image-gen", name: "Image Gen", icon: "image-outline" as const, desc: "Generate images from text", color: "#EC4899" },
  { id: "data-viz", name: "Data Viz", icon: "bar-chart-outline" as const, desc: "Create charts from your data", color: "#8B5CF6" },
  { id: "git", name: "Git Helper", icon: "git-branch-outline" as const, desc: "Git commands and workflows", color: "#EF4444" },
];

export default function ExploreTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createConversation } = useChat();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const filteredAgents = useMemo(() =>
    selectedCategory === "All"
      ? AGENTS
      : AGENTS.filter((a) => a.category === selectedCategory),
    [selectedCategory]
  );

  const onSelectAgent = useCallback(
    async (agent: Agent) => {
      await Haptics.selectionAsync();
      const conv = createConversation(agent.model, agent.id);
      router.push(`/chat/${conv.id}`);
    },
    [createConversation, router]
  );

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Explore
        </Text>
      </View>

      <FlatList
        data={filteredAgents}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <AgentCard agent={item} onSelect={onSelectAgent} />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Tools section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Tools
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolsScroll}>
                {TOOLS.map((tool) => (
                  <TouchableOpacity
                    key={tool.id}
                    activeOpacity={0.75}
                    onPress={() => Haptics.selectionAsync()}
                    style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: tool.color + "20" }]}>
                      <Ionicons name={tool.icon} size={22} color={tool.color} />
                    </View>
                    <Text style={[styles.toolName, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                      {tool.name}
                    </Text>
                    <Text style={[styles.toolDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
                      {tool.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Category filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                Agents
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((cat) => {
                  const active = cat === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.catText,
                          {
                            color: active ? colors.primaryForeground : colors.mutedForeground,
                            fontFamily: "Inter_500Medium",
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 30 },
  list: { paddingHorizontal: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, marginBottom: 12 },
  toolsScroll: { marginHorizontal: -16, paddingLeft: 16 },
  toolCard: {
    width: 130,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    gap: 8,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  toolName: { fontSize: 13 },
  toolDesc: { fontSize: 11, lineHeight: 15 },
  catScroll: { marginHorizontal: -16, paddingLeft: 16 },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catText: { fontSize: 13 },
});
