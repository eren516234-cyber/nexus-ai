import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PROJECT_COLORS, useApp, type Project } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const FILE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  note: "document-text-outline",
  doc: "document-outline",
  code: "code-slash-outline",
  image: "image-outline",
};

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded((e) => !e)}
      onLongPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Delete project?", `"${project.name}"`, [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => onDelete(project.id) },
        ]);
      }}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Top accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: project.color }]} />

      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: project.color + "20" }]}>
            <Feather name="folder" size={18} color={project.color} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={[styles.cardName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {project.name}
            </Text>
            <Text style={[styles.cardDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
              {project.description}
            </Text>
          </View>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.mutedForeground as string}
          />
        </View>

        <View style={styles.cardStats}>
          <View style={styles.stat}>
            <Feather name="file" size={12} color={colors.mutedForeground as string} />
            <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {project.files.length} files
            </Text>
          </View>
          <Text style={[styles.statText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {timeAgo(project.updatedAt)}
          </Text>
        </View>

        {expanded && project.files.length > 0 && (
          <View style={[styles.fileList, { borderTopColor: colors.border }]}>
            {project.files.map((file) => (
              <View key={file.id} style={styles.fileRow}>
                <Ionicons
                  name={FILE_ICONS[file.type] ?? "document-outline"}
                  size={14}
                  color={colors.mutedForeground as string}
                />
                <Text style={[styles.fileName, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}>
                  {file.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface NewProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, color: string) => void;
}

function NewProjectModal({ visible, onClose, onCreate }: NewProjectModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCreate(name.trim(), desc.trim(), selectedColor);
    setName("");
    setDesc("");
    setSelectedColor(PROJECT_COLORS[0]);
    onClose();
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: bottomPad + 16 }]}
        >
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            New project
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Project name"
            placeholderTextColor={colors.mutedForeground as string}
            style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
          />

          <TextInput
            value={desc}
            onChangeText={setDesc}
            placeholder="Description (optional)"
            placeholderTextColor={colors.mutedForeground as string}
            style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
          />

          <Text style={[styles.colorLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Color
          </Text>
          <View style={styles.colorRow}>
            {PROJECT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorDotSelected,
                ]}
              >
                {selectedColor === c && (
                  <Feather name="check" size={12} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={!name.trim()}
            style={[styles.createBtn, { backgroundColor: name.trim() ? colors.primary : colors.border }]}
          >
            <Text style={[styles.createBtnText, { fontFamily: "Inter_600SemiBold" }]}>
              Create project
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProjectsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects, addProject, deleteProject } = useApp();
  const [newModalVisible, setNewModalVisible] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleCreate = useCallback(
    (name: string, description: string, color: string) => {
      addProject({ name, description, color, conversationIds: [], files: [] });
    },
    [addProject]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Projects
        </Text>
        <TouchableOpacity
          onPress={async () => {
            await Haptics.selectionAsync();
            setNewModalVisible(true);
          }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProjectCard project={item} onDelete={deleteProject} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="folder" size={32} color={colors.primary as string} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              No projects yet
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Organize your AI conversations into project spaces
            </Text>
            <TouchableOpacity
              onPress={() => setNewModalVisible(true)}
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.startBtnText, { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>
                Create project
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponentStyle={styles.emptyContainer}
      />

      <NewProjectModal
        visible={newModalVisible}
        onClose={() => setNewModalVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 30 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardAccent: { height: 3 },
  cardInner: { padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardMeta: { flex: 1 },
  cardName: { fontSize: 15 },
  cardDesc: { fontSize: 12 },
  cardStats: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12 },
  fileList: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 8 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fileName: { fontSize: 13 },
  empty: { alignItems: "center", gap: 10, paddingHorizontal: 32 },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 20 },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  startBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  startBtnText: { fontSize: 15 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    gap: 12,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#888", alignSelf: "center", opacity: 0.4, marginBottom: 4 },
  modalTitle: { fontSize: 22 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  colorLabel: { fontSize: 13 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  colorDotSelected: { borderWidth: 2.5, borderColor: "white" },
  createBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
  createBtnText: { fontSize: 16, color: "#FFF" },
});
