import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme } from "react-native";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  conversationIds: string[];
  createdAt: number;
  updatedAt: number;
  files: ProjectFile[];
}

export interface ProjectFile {
  id: string;
  name: string;
  type: "note" | "doc" | "code" | "image";
  content: string;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  avatar?: string;
  apiKey?: string;
}

type ThemeMode = "system" | "light" | "dark";

interface AppState {
  themeMode: ThemeMode;
  resolvedTheme: "light" | "dark";
  projects: Project[];
  profile: UserProfile;
  selectedModel: string;
  setThemeMode: (mode: ThemeMode) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setSelectedModel: (model: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const PROJECT_COLORS = [
  "#6366F1", "#8B5CF6", "#06B6D4", "#10B981",
  "#F59E0B", "#EF4444", "#EC4899", "#3B82F6",
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Product Research",
    description: "Competitive analysis and market research",
    color: "#6366F1",
    conversationIds: [],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000,
    files: [
      { id: "f1", name: "Market Overview", type: "doc", content: "", createdAt: Date.now() - 86400000 },
      { id: "f2", name: "analysis.py", type: "code", content: "", createdAt: Date.now() - 7200000 },
    ],
  },
  {
    id: "proj-2",
    name: "Code Review",
    description: "AI-assisted code review and debugging",
    color: "#06B6D4",
    conversationIds: [],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000,
    files: [
      { id: "f3", name: "Notes", type: "note", content: "", createdAt: Date.now() - 86400000 * 2 },
    ],
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [profile, setProfile] = useState<UserProfile>({ name: "User" });
  const [selectedModel, setSelectedModelState] = useState("gpt-4o");

  const resolvedTheme: "light" | "dark" =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  useEffect(() => {
    (async () => {
      try {
        const [storedTheme, storedProjects, storedProfile, storedModel] =
          await Promise.all([
            AsyncStorage.getItem("@theme_mode"),
            AsyncStorage.getItem("@projects"),
            AsyncStorage.getItem("@profile"),
            AsyncStorage.getItem("@selected_model"),
          ]);
        if (storedTheme) setThemeModeState(storedTheme as ThemeMode);
        if (storedProjects) setProjects(JSON.parse(storedProjects));
        if (storedProfile) setProfile(JSON.parse(storedProfile));
        if (storedModel) setSelectedModelState(storedModel);
      } catch {}
    })();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem("@theme_mode", mode);
  }, []);

  const addProject = useCallback(
    async (proj: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
      const newProject: Project = {
        ...proj,
        id: `proj-${Date.now()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProjects((prev) => {
        const updated = [newProject, ...prev];
        AsyncStorage.setItem("@projects", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      setProjects((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
        );
        AsyncStorage.setItem("@projects", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem("@projects", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...updates };
      AsyncStorage.setItem("@profile", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setSelectedModel = useCallback(async (model: string) => {
    setSelectedModelState(model);
    await AsyncStorage.setItem("@selected_model", model);
  }, []);

  return (
    <AppContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        projects,
        profile,
        selectedModel,
        setThemeMode,
        addProject,
        updateProject,
        deleteProject,
        updateProfile,
        setSelectedModel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export { PROJECT_COLORS };
