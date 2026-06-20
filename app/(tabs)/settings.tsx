import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useChat } from "@/context/ChatContext";
import { useColors } from "@/hooks/useColors";

type ThemeOption = { label: string; value: "system" | "light" | "dark"; icon: keyof typeof Ionicons.glyphMap };

const THEME_OPTIONS: ThemeOption[] = [
  { label: "System", value: "system", icon: "phone-portrait-outline" },
  { label: "Light", value: "light", icon: "sunny-outline" },
  { label: "Dark", value: "dark", icon: "moon-outline" },
];

interface RowProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, iconColor, label, value, onPress, rightElement, danger }: RowProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (iconColor ?? colors.primary) + "18" }]}>
        <Feather name={icon} size={16} color={(iconColor ?? colors.primary) as string} />
      </View>
      <Text
        style={[
          styles.rowLabel,
          {
            color: danger ? colors.destructive : colors.foreground,
            fontFamily: "Inter_400Regular",
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {value}
          </Text>
        )}
        {rightElement}
        {onPress && !rightElement && (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground as string} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
      {title}
    </Text>
  );
}

export default function SettingsTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, profile, updateProfile } = useApp();
  const { clearAllConversations } = useChat();
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [editApiKey, setEditApiKey] = useState(profile.apiKey ?? "");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleClearChats = () => {
    Alert.alert(
      "Clear all conversations?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearAllConversations();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { fontFamily: "Inter_700Bold" }]}>
              {profile.name.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {profile.name}
            </Text>
            <Text style={[styles.profileSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Personal account
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setEditName(profile.name); setNameModalVisible(true); }}
            style={[styles.editBtn, { backgroundColor: colors.surface }]}
          >
            <Feather name="edit-2" size={14} color={colors.mutedForeground as string} />
          </TouchableOpacity>
        </View>

        <SectionHeader title="APPEARANCE" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setThemeMode(opt.value);
                  }}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={16}
                    color={active ? "#FFF" : colors.mutedForeground as string}
                  />
                  <Text
                    style={[
                      styles.themeBtnLabel,
                      {
                        color: active ? "#FFF" : colors.mutedForeground,
                        fontFamily: "Inter_500Medium",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <SectionHeader title="AI & API" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="key"
            label="API Key"
            value={profile.apiKey ? `sk-...${profile.apiKey.slice(-4)}` : "Not set"}
            onPress={() => { setEditApiKey(profile.apiKey ?? ""); setApiKeyModalVisible(true); }}
          />
        </View>

        <SectionHeader title="NOTIFICATIONS" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="bell"
            label="Notifications"
            rightElement={
              <Switch
                value={notifEnabled}
                onValueChange={setNotifEnabled}
                trackColor={{ true: colors.primary as string, false: colors.border as string }}
                thumbColor="#FFF"
              />
            }
          />
        </View>

        <SectionHeader title="DATA" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow
            icon="trash-2"
            label="Clear all conversations"
            onPress={handleClearChats}
            danger
            iconColor={colors.destructive as string}
          />
        </View>

        <SectionHeader title="ABOUT" />
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="info" label="Version" value="1.0.0" />
          <SettingRow icon="shield" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="file-text" label="Terms of Service" onPress={() => {}} />
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={nameModalVisible} transparent animationType="fade" onRequestClose={() => setNameModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setNameModalVisible(false)}>
          <Pressable onPress={() => {}} style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>Edit name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setNameModalVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { updateProfile({ name: editName.trim() || "User" }); setNameModalVisible(false); }}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* API Key Modal */}
      <Modal visible={apiKeyModalVisible} transparent animationType="fade" onRequestClose={() => setApiKeyModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setApiKeyModalVisible(false)}>
          <Pressable onPress={() => {}} style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>API Key</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Enter your OpenAI or Anthropic API key
            </Text>
            <TextInput
              value={editApiKey}
              onChangeText={setEditApiKey}
              placeholder="sk-..."
              placeholderTextColor={colors.mutedForeground as string}
              secureTextEntry
              style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setApiKeyModalVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { updateProfile({ apiKey: editApiKey.trim() }); setApiKeyModalVisible(false); }}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: "#FFF", fontFamily: "Inter_600SemiBold" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 30 },
  scroll: { paddingHorizontal: 16, gap: 8 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 22, color: "#FFF" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16 },
  profileSub: { fontSize: 13 },
  editBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionHeader: { fontSize: 11, letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  section: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 13 },
  themeRow: { flexDirection: "row", padding: 12, gap: 8 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  themeBtnLabel: { fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18 },
  modalSub: { fontSize: 13 },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 15 },
});
