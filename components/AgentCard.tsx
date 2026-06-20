import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  model: string;
  capabilities: string[];
  category: string;
}

export const AGENTS: Agent[] = [
  {
    id: "coder",
    name: "Code Assistant",
    description: "Writes, debugs, and reviews code in any language",
    icon: "code-slash",
    color: "#6366F1",
    model: "gpt-4o",
    capabilities: ["Code generation", "Debugging", "Code review", "Refactoring"],
    category: "Development",
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Deep analysis, fact-checking, and structured reports",
    icon: "search",
    color: "#06B6D4",
    model: "claude-3-5-sonnet",
    capabilities: ["Web research", "Summarization", "Fact checking", "Reports"],
    category: "Research",
  },
  {
    id: "writer",
    name: "Writer",
    description: "Crafts compelling content, copy, and creative writing",
    icon: "create",
    color: "#EC4899",
    model: "gpt-4o",
    capabilities: ["Blog posts", "Copywriting", "Creative writing", "Editing"],
    category: "Creative",
  },
  {
    id: "analyst",
    name: "Data Analyst",
    description: "Interprets data, builds insights, and creates visualizations",
    icon: "bar-chart",
    color: "#10B981",
    model: "gpt-4o",
    capabilities: ["Data analysis", "SQL queries", "Charts", "Statistics"],
    category: "Data",
  },
  {
    id: "planner",
    name: "Project Planner",
    description: "Structures projects, roadmaps, and sprint planning",
    icon: "git-branch",
    color: "#F59E0B",
    model: "claude-3-5-sonnet",
    capabilities: ["Planning", "Task breakdown", "Roadmaps", "Timelines"],
    category: "Productivity",
  },
  {
    id: "designer",
    name: "Design Advisor",
    description: "UX feedback, design systems, and visual strategy",
    icon: "color-palette",
    color: "#8B5CF6",
    model: "gpt-4o",
    capabilities: ["UX review", "Design systems", "Color theory", "Typography"],
    category: "Design",
  },
  {
    id: "security",
    name: "Security Expert",
    description: "Security audits, vulnerability assessment, best practices",
    icon: "shield-checkmark",
    color: "#EF4444",
    model: "gpt-4o",
    capabilities: ["Security audit", "Pen testing", "OWASP", "Encryption"],
    category: "Security",
  },
  {
    id: "general",
    name: "General Assistant",
    description: "Versatile AI for any task or question",
    icon: "sparkles",
    color: "#6366F1",
    model: "gpt-4o",
    capabilities: ["Reasoning", "Q&A", "Brainstorming", "Analysis"],
    category: "General",
  },
];

interface Props {
  agent: Agent;
  onSelect?: (agent: Agent) => void;
  compact?: boolean;
}

export function AgentCard({ agent, onSelect, compact }: Props) {
  const colors = useColors();
  const { setSelectedModel } = useApp();

  const handlePress = useCallback(async () => {
    await Haptics.selectionAsync();
    setSelectedModel(agent.model);
    onSelect?.(agent);
  }, [agent, setSelectedModel, onSelect]);

  if (compact) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.iconCircle, { backgroundColor: agent.color + "20" }]}>
          <Ionicons name={agent.icon} size={20} color={agent.color} />
        </View>
        <Text style={[styles.compactName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {agent.name}
        </Text>
        <Text style={[styles.compactDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
          {agent.description}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: agent.color + "20" }]}>
        <Ionicons name={agent.icon} size={24} color={agent.color} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
          {agent.name}
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={2}>
          {agent.description}
        </Text>
        <View style={styles.tags}>
          {agent.capabilities.slice(0, 3).map((cap) => (
            <View key={cap} style={[styles.tag, { backgroundColor: agent.color + "15" }]}>
              <Text style={[styles.tagText, { color: agent.color, fontFamily: "Inter_500Medium" }]}>
                {cap}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 10,
  },
  compact: {
    width: 140,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginRight: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
  },
  desc: {
    fontSize: 13,
    lineHeight: 18,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
  },
  compactName: {
    fontSize: 13,
  },
  compactDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});
