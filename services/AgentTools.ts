/**
 * NEXUS AI — Complete Device Control Layer
 * Every tool that is physically possible in a React Native / Expo app.
 */

import * as Battery from "expo-battery";
import * as Brightness from "expo-brightness";
import * as Calendar from "expo-calendar";
import * as Clipboard from "expo-clipboard";
import * as Contacts from "expo-contacts";
import * as Device from "expo-device";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as LocalAuth from "expo-local-authentication";
import * as Location from "expo-location";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { Audio } from "expo-av";
import { Platform, Share, Vibration } from "react-native";

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  displayText: string;
  imageUri?: string;
}

// ─────────────────────────────────────────────
// TOOL DEFINITIONS (sent to AI as capabilities)
// ─────────────────────────────────────────────

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ── CAMERA & MEDIA ──
  {
    name: "open_camera",
    description: "Take a photo or video using the device camera. Use when user says 'take a photo', 'selfie', 'capture', 'photograph'.",
    parameters: { type: "object", properties: { facing: { type: "string", description: "Camera facing: 'front' for selfie, 'back' for main camera", enum: ["front", "back"] } }, required: [] },
  },
  {
    name: "pick_image",
    description: "Pick an existing image or video from the device photo gallery.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "record_audio",
    description: "Record audio/voice using the microphone. Stops after specified seconds.",
    parameters: { type: "object", properties: { duration_seconds: { type: "string", description: "Max recording duration (default 10)" } }, required: [] },
  },

  // ── LOCATION & MAPS ──
  {
    name: "get_location",
    description: "Get the user's current GPS location with address. Use for 'where am I', 'my location', 'which city', 'current address'.",
    parameters: { type: "object", properties: { accuracy: { type: "string", description: "high or balanced (default balanced)", enum: ["high", "balanced"] } }, required: [] },
  },
  {
    name: "open_maps",
    description: "Open maps to navigate to a place or show directions.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Destination name or address" }, current_location: { type: "string", description: "true to get directions from current location", enum: ["true", "false"] } }, required: ["query"] },
  },

  // ── CALLS & MESSAGING ──
  {
    name: "make_call",
    description: "Make a phone call to a number or contact name.",
    parameters: { type: "object", properties: { phone_number: { type: "string", description: "Phone number with country code" }, name: { type: "string", description: "Name of person being called" } }, required: ["phone_number"] },
  },
  {
    name: "send_sms",
    description: "Open SMS composer to send a text message.",
    parameters: { type: "object", properties: { phone_number: { type: "string", description: "Phone number" }, message: { type: "string", description: "Pre-filled message text" } }, required: ["phone_number"] },
  },
  {
    name: "send_email",
    description: "Open email composer to draft and send email.",
    parameters: { type: "object", properties: { to: { type: "string", description: "Recipient email" }, subject: { type: "string", description: "Subject line" }, body: { type: "string", description: "Email body" } }, required: ["to"] },
  },
  {
    name: "facetime_call",
    description: "FaceTime audio or video call (iOS only).",
    parameters: { type: "object", properties: { contact: { type: "string", description: "Phone number or email" }, video: { type: "string", description: "true for video, false for audio", enum: ["true", "false"] } }, required: ["contact"] },
  },

  // ── CONTACTS ──
  {
    name: "search_contacts",
    description: "Search device contacts by name or number. Returns matching contacts with their phone numbers.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Name or number to search" } }, required: ["query"] },
  },
  {
    name: "create_contact",
    description: "Add a new contact to the device phonebook.",
    parameters: {
      type: "object",
      properties: {
        first_name: { type: "string", description: "First name" },
        last_name: { type: "string", description: "Last name" },
        phone: { type: "string", description: "Phone number" },
        email: { type: "string", description: "Email address" },
      },
      required: ["first_name", "phone"],
    },
  },

  // ── CALENDAR ──
  {
    name: "read_calendar",
    description: "Read upcoming calendar events for a given number of days.",
    parameters: { type: "object", properties: { days: { type: "string", description: "How many days ahead to check (default 7)" } }, required: [] },
  },
  {
    name: "create_calendar_event",
    description: "Create a calendar event / schedule a meeting.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
        time: { type: "string", description: "Time in HH:MM format (24h)" },
        duration_minutes: { type: "string", description: "Duration in minutes (default 60)" },
        notes: { type: "string", description: "Event notes/description" },
        location: { type: "string", description: "Event location" },
      },
      required: ["title", "date"],
    },
  },

  // ── NOTIFICATIONS & REMINDERS ──
  {
    name: "send_notification",
    description: "Send an immediate local push notification to the user.",
    parameters: { type: "object", properties: { title: { type: "string", description: "Notification title" }, body: { type: "string", description: "Notification message body" } }, required: ["title", "body"] },
  },
  {
    name: "schedule_reminder",
    description: "Schedule a future reminder notification at a specific time.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Reminder title" },
        body: { type: "string", description: "Reminder message" },
        minutes_from_now: { type: "string", description: "How many minutes from now to trigger reminder" },
        date: { type: "string", description: "Specific date YYYY-MM-DD (alternative to minutes_from_now)" },
        time: { type: "string", description: "Specific time HH:MM (use with date)" },
      },
      required: ["title"],
    },
  },
  {
    name: "set_alarm",
    description: "Open the Clock app to set an alarm.",
    parameters: { type: "object", properties: { time: { type: "string", description: "Alarm time e.g. '7:30 AM'" } }, required: [] },
  },

  // ── DEVICE INFO ──
  {
    name: "get_battery_info",
    description: "Get device battery level and charging status.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_network_info",
    description: "Get network connection info: WiFi name, IP address, connection type.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_device_info",
    description: "Get device information: model, OS version, screen size, memory.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_sensor_data",
    description: "Read motion sensors: accelerometer (movement/tilt) or gyroscope (rotation).",
    parameters: { type: "object", properties: { sensor: { type: "string", description: "Which sensor: accelerometer or gyroscope", enum: ["accelerometer", "gyroscope"] } }, required: ["sensor"] },
  },

  // ── DEVICE CONTROL ──
  {
    name: "set_brightness",
    description: "Set screen brightness level.",
    parameters: { type: "object", properties: { level: { type: "string", description: "Brightness from 0.0 (off) to 1.0 (max) e.g. '0.8'" } }, required: ["level"] },
  },
  {
    name: "vibrate_device",
    description: "Vibrate the device with a pattern or duration.",
    parameters: { type: "object", properties: { pattern: { type: "string", description: "Pattern: 'short', 'long', 'double', 'sos'", enum: ["short", "long", "double", "sos"] } }, required: [] },
  },
  {
    name: "authenticate_biometric",
    description: "Authenticate user with Face ID or fingerprint biometrics.",
    parameters: { type: "object", properties: { reason: { type: "string", description: "Why authentication is needed" } }, required: [] },
  },

  // ── FILES ──
  {
    name: "save_note",
    description: "Save a text note or content to a file on the device.",
    parameters: { type: "object", properties: { filename: { type: "string", description: "File name e.g. 'meeting-notes.txt'" }, content: { type: "string", description: "Text content to save" } }, required: ["content"] },
  },
  {
    name: "read_note",
    description: "Read a previously saved note file.",
    parameters: { type: "object", properties: { filename: { type: "string", description: "File name to read" } }, required: ["filename"] },
  },
  {
    name: "list_notes",
    description: "List all saved notes and files.",
    parameters: { type: "object", properties: {}, required: [] },
  },

  // ── CLIPBOARD ──
  {
    name: "copy_to_clipboard",
    description: "Copy text to the device clipboard.",
    parameters: { type: "object", properties: { text: { type: "string", description: "Text to copy" }, label: { type: "string", description: "Label for what was copied" } }, required: ["text"] },
  },
  {
    name: "read_clipboard",
    description: "Read current content of the device clipboard.",
    parameters: { type: "object", properties: {}, required: [] },
  },

  // ── WEB & SEARCH ──
  {
    name: "open_url",
    description: "Open any URL in the browser.",
    parameters: { type: "object", properties: { url: { type: "string", description: "Full URL starting with https://" }, label: { type: "string", description: "Human-readable label" } }, required: ["url"] },
  },
  {
    name: "search_web",
    description: "Search Google for any information.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] },
  },

  // ── SOCIAL MEDIA (DEEP LINKS) ──
  {
    name: "open_instagram",
    description: "Open Instagram — main feed, specific user profile, or DMs.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", description: "What to open: feed, profile, dm", enum: ["feed", "profile", "dm"] },
        username: { type: "string", description: "Instagram username (for profile/dm)" },
        dm_message: { type: "string", description: "Pre-written message for DM" },
      },
      required: ["action"],
    },
  },
  {
    name: "open_whatsapp",
    description: "Open WhatsApp — to a specific number with optional pre-filled message.",
    parameters: { type: "object", properties: { phone_number: { type: "string", description: "Phone number with country code" }, message: { type: "string", description: "Pre-filled message text" } }, required: [] },
  },
  {
    name: "open_youtube",
    description: "Open YouTube or search for videos.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Search query or video topic" }, url: { type: "string", description: "Direct YouTube URL" } }, required: [] },
  },
  {
    name: "open_twitter",
    description: "Open Twitter/X, go to profile, or compose a tweet.",
    parameters: { type: "object", properties: { username: { type: "string", description: "Twitter username without @" }, tweet_text: { type: "string", description: "Pre-filled tweet text" } }, required: [] },
  },
  {
    name: "open_spotify",
    description: "Open Spotify or search for music/artists/playlists.",
    parameters: { type: "object", properties: { query: { type: "string", description: "Song, artist, or playlist name" } }, required: [] },
  },

  // ── ANY APP ──
  {
    name: "open_app",
    description: "Open any installed app by name using deep links.",
    parameters: {
      type: "object",
      properties: {
        app_name: { type: "string", description: "App name: Gmail, Snapchat, TikTok, Telegram, Zoom, Uber, Amazon, Netflix, LinkedIn, Discord, Reddit, etc." },
      },
      required: ["app_name"],
    },
  },
  {
    name: "open_settings",
    description: "Open device Settings or a specific settings page.",
    parameters: {
      type: "object",
      properties: {
        page: { type: "string", description: "Settings page: main, wifi, bluetooth, location, notifications, battery, display, sounds, apps, privacy, storage", enum: ["main", "wifi", "bluetooth", "location", "notifications", "battery", "display", "sounds", "apps", "privacy", "storage", "accessibility"] },
      },
      required: [],
    },
  },

  // ── SHARE ──
  {
    name: "share_content",
    description: "Share text, links, or content via the system share sheet.",
    parameters: { type: "object", properties: { message: { type: "string", description: "Text or URL to share" }, title: { type: "string", description: "Share sheet title" } }, required: ["message"] },
  },
];

// ─────────────────────────────────────────────
// APP DEEP LINKS
// ─────────────────────────────────────────────

const APP_LINKS: Record<string, [string, string]> = {
  gmail: ["googlegmail://", "https://mail.google.com"],
  snapchat: ["snapchat://", "https://www.snapchat.com"],
  tiktok: ["snssdk1233://", "https://www.tiktok.com"],
  telegram: ["tg://", "https://t.me"],
  zoom: ["zoomus://", "https://zoom.us"],
  uber: ["uber://", "https://uber.com"],
  amazon: ["com.amazon.mobile.shopping://", "https://amazon.com"],
  netflix: ["nflx://", "https://netflix.com"],
  linkedin: ["linkedin://", "https://linkedin.com"],
  reddit: ["reddit://", "https://reddit.com"],
  discord: ["discord://", "https://discord.com"],
  twitch: ["twitch://", "https://twitch.tv"],
  pinterest: ["pinterest://", "https://pinterest.com"],
  facebook: ["fb://", "https://facebook.com"],
  twitter: ["twitter://", "https://twitter.com"],
  x: ["twitter://", "https://x.com"],
};

const SETTINGS_URLS: Record<string, string> = {
  main: Platform.OS === "ios" ? "app-settings:" : "android.settings.SETTINGS",
  wifi: Platform.OS === "ios" ? "App-Prefs:WIFI" : "android.settings.WIFI_SETTINGS",
  bluetooth: Platform.OS === "ios" ? "App-Prefs:Bluetooth" : "android.settings.BLUETOOTH_SETTINGS",
  location: Platform.OS === "ios" ? "App-Prefs:Privacy&path=LOCATION" : "android.settings.LOCATION_SOURCE_SETTINGS",
  notifications: Platform.OS === "ios" ? "App-Prefs:NOTIFICATIONS_ID" : "android.settings.APP_NOTIFICATION_SETTINGS",
  battery: Platform.OS === "ios" ? "App-Prefs:BATTERY_USAGE" : "android.settings.BATTERY_SAVER_SETTINGS",
  display: Platform.OS === "ios" ? "App-Prefs:DISPLAY" : "android.settings.DISPLAY_SETTINGS",
  sounds: Platform.OS === "ios" ? "App-Prefs:Sounds" : "android.settings.SOUND_SETTINGS",
  apps: Platform.OS === "ios" ? "App-Prefs:" : "android.settings.APPLICATION_SETTINGS",
  privacy: Platform.OS === "ios" ? "App-Prefs:Privacy" : "android.settings.PRIVACY_SETTINGS",
  storage: Platform.OS === "ios" ? "App-Prefs:General&path=STORAGE" : "android.settings.INTERNAL_STORAGE_SETTINGS",
  accessibility: Platform.OS === "ios" ? "App-Prefs:ACCESSIBILITY" : "android.settings.ACCESSIBILITY_SETTINGS",
};

// Recording ref (module-level, to stop from another call)
let recordingRef: Audio.Recording | null = null;

// Notes directory
const NOTES_DIR = `${FileSystem.documentDirectory}nexus-notes/`;

async function ensureNotesDir() {
  const info = await FileSystem.getInfoAsync(NOTES_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(NOTES_DIR, { intermediates: true });
}

// ─────────────────────────────────────────────
// TOOL EXECUTOR
// ─────────────────────────────────────────────

export async function executeTool(name: string, args: Record<string, string>): Promise<ToolResult> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  try {
    switch (name) {

      // ── CAMERA ──
      case "open_camera": {
        if (Platform.OS === "web") {
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
          if (r.canceled) return { success: false, error: "Cancelled", displayText: "No image selected" };
          return { success: true, data: { uri: r.assets[0].uri }, imageUri: r.assets[0].uri, displayText: "Image selected" };
        }
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Camera permission denied. Enable in Settings → Privacy → Camera." };
        const r = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          cameraType: args.facing === "front" ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        });
        if (r.canceled) return { success: false, error: "Cancelled", displayText: "Camera cancelled" };
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: { uri: r.assets[0].uri }, imageUri: r.assets[0].uri, displayText: "📸 Photo taken!" };
      }

      case "pick_image": {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted" && Platform.OS !== "web") return { success: false, error: "Permission denied", displayText: "Photo library permission denied" };
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
        if (r.canceled) return { success: false, error: "Cancelled", displayText: "No image selected" };
        return { success: true, data: { uri: r.assets[0].uri }, imageUri: r.assets[0].uri, displayText: "🖼️ Image selected from gallery" };
      }

      case "record_audio": {
        if (Platform.OS === "web") return { success: false, error: "Not supported on web", displayText: "Audio recording needs the mobile app" };
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Microphone permission denied" };
        if (recordingRef) {
          await recordingRef.stopAndUnloadAsync();
          const uri = recordingRef.getURI();
          recordingRef = null;
          return { success: true, data: { uri }, displayText: `🎙️ Recording saved: ${uri?.split("/").pop()}` };
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        recordingRef = recording;
        const secs = parseInt(args.duration_seconds ?? "10", 10);
        setTimeout(async () => {
          if (recordingRef) { await recordingRef.stopAndUnloadAsync(); recordingRef = null; }
        }, secs * 1000);
        return { success: true, data: {}, displayText: `🎙️ Recording started — will stop in ${secs}s. Say the command again to stop early.` };
      }

      // ── LOCATION ──
      case "get_location": {
        if (Platform.OS === "web") {
          return new Promise((resolve) =>
            navigator.geolocation.getCurrentPosition(
              (p) => resolve({ success: true, data: { latitude: p.coords.latitude, longitude: p.coords.longitude }, displayText: `📍 ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}` }),
              (e) => resolve({ success: false, error: e.message, displayText: "Location unavailable on web" })
            )
          );
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Location permission denied. Enable in Settings → Privacy → Location." };
        const accuracy = args.accuracy === "high" ? Location.Accuracy.High : Location.Accuracy.Balanced;
        const loc = await Location.getCurrentPositionAsync({ accuracy });
        const { latitude, longitude, altitude, speed } = loc.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo) address = [geo.name, geo.street, geo.city, geo.region, geo.country].filter(Boolean).join(", ");
        } catch {}
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return {
          success: true,
          data: { latitude, longitude, altitude, speed, address },
          displayText: `📍 ${address}\n\nCoords: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${altitude ? `\nAltitude: ${Math.round(altitude ?? 0)}m` : ""}`,
        };
      }

      case "open_maps": {
        const q = encodeURIComponent(args.query);
        const url = Platform.OS === "ios" ? `maps://?q=${q}` : `geo:0,0?q=${q}`;
        const ok = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(ok ? url : `https://maps.google.com/?q=${q}`);
        return { success: true, data: args, displayText: `🗺️ Opening Maps → "${args.query}"` };
      }

      // ── CALLS & MESSAGING ──
      case "make_call":
        await Linking.openURL(`tel:${args.phone_number.replace(/\s/g, "")}`);
        return { success: true, data: args, displayText: `📞 Calling ${args.name ?? args.phone_number}...` };

      case "send_sms": {
        const sep = Platform.OS === "ios" ? "&" : "?";
        await Linking.openURL(`sms:${args.phone_number}${args.message ? `${sep}body=${encodeURIComponent(args.message)}` : ""}`);
        return { success: true, data: args, displayText: `💬 SMS to ${args.phone_number}${args.message ? `\nMessage: "${args.message}"` : ""}` };
      }

      case "send_email": {
        const p = new URLSearchParams();
        if (args.subject) p.set("subject", args.subject);
        if (args.body) p.set("body", args.body);
        const q = p.toString();
        await Linking.openURL(`mailto:${args.to}${q ? `?${q}` : ""}`);
        return { success: true, data: args, displayText: `📧 Email to ${args.to}` };
      }

      case "facetime_call": {
        if (Platform.OS !== "ios") return { success: false, error: "iOS only", displayText: "FaceTime is only available on iPhone" };
        await Linking.openURL(`${args.video !== "false" ? "facetime://" : "facetime-audio://"}${args.contact}`);
        return { success: true, data: args, displayText: `📹 FaceTime ${args.video !== "false" ? "video" : "audio"} → ${args.contact}` };
      }

      // ── CONTACTS ──
      case "search_contacts": {
        if (Platform.OS === "web") return { success: false, error: "Not available on web", displayText: "Contacts need the mobile app" };
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Contacts permission denied. Enable in Settings → Privacy → Contacts." };
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
          name: args.query,
        });
        if (data.length === 0) return { success: true, data: [], displayText: `No contacts found for "${args.query}"` };
        const results = data.slice(0, 5).map((c) => {
          const phone = c.phoneNumbers?.[0]?.number ?? "no number";
          return `• ${c.name} — ${phone}`;
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: data.slice(0, 5), displayText: `👤 Found ${data.length} contact(s):\n${results.join("\n")}` };
      }

      case "create_contact": {
        if (Platform.OS === "web") return { success: false, error: "Not available on web", displayText: "Contacts need the mobile app" };
        const { status } = await Contacts.requestPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Contacts permission denied" };
        const contact: Contacts.Contact = {
          contactType: Contacts.ContactTypes.Person,
          firstName: args.first_name,
          lastName: args.last_name ?? "",
          phoneNumbers: args.phone ? [{ label: "mobile", number: args.phone }] : [],
          emails: args.email ? [{ label: "home", email: args.email }] : [],
        };
        await Contacts.addContactAsync(contact);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: contact, displayText: `✅ Contact saved: ${args.first_name} ${args.last_name ?? ""} (${args.phone})` };
      }

      // ── CALENDAR ──
      case "read_calendar": {
        if (Platform.OS === "web") return { success: false, error: "Not available on web", displayText: "Calendar needs the mobile app" };
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Calendar permission denied" };
        const days = parseInt(args.days ?? "7", 10);
        const now = new Date();
        const end = new Date(); end.setDate(end.getDate() + days);
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const calendarIds = calendars.map((c) => c.id);
        const events = await Calendar.getEventsAsync(calendarIds, now, end);
        if (events.length === 0) return { success: true, data: [], displayText: `📅 No events in the next ${days} days` };
        const list = events.slice(0, 10).map((e) => {
          const date = new Date(e.startDate).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return `• ${date} — ${e.title}${e.location ? ` @ ${e.location}` : ""}`;
        });
        return { success: true, data: events.slice(0, 10), displayText: `📅 Upcoming ${events.length} event(s):\n${list.join("\n")}` };
      }

      case "create_calendar_event": {
        if (Platform.OS === "web") return { success: false, error: "Not available on web", displayText: "Calendar needs the mobile app" };
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Calendar permission denied" };
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const writeable = calendars.find((c) => c.allowsModifications) ?? calendars[0];
        if (!writeable) return { success: false, error: "No calendar found", displayText: "No writable calendar found" };
        const [year, month, day] = (args.date ?? new Date().toISOString().split("T")[0]).split("-").map(Number);
        const [hour, minute] = (args.time ?? "09:00").split(":").map(Number);
        const start = new Date(year, month - 1, day, hour ?? 9, minute ?? 0);
        const end = new Date(start.getTime() + parseInt(args.duration_minutes ?? "60", 10) * 60000);
        await Calendar.createEventAsync(writeable.id, {
          title: args.title,
          startDate: start,
          endDate: end,
          notes: args.notes ?? "",
          location: args.location ?? "",
          alarms: [{ relativeOffset: -15 }],
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: args, displayText: `📅 Event created: "${args.title}"\n${start.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })} at ${start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` };
      }

      // ── NOTIFICATIONS ──
      case "send_notification": {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Notification permission denied" };
        await Notifications.scheduleNotificationAsync({
          content: { title: args.title, body: args.body, sound: true },
          trigger: null,
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: args, displayText: `🔔 Notification sent: "${args.title}"` };
      }

      case "schedule_reminder": {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Notification permission denied" };
        let triggerDate: Date;
        if (args.date && args.time) {
          const [y, m, d] = args.date.split("-").map(Number);
          const [h, min] = args.time.split(":").map(Number);
          triggerDate = new Date(y, m - 1, d, h, min);
        } else {
          const mins = parseInt(args.minutes_from_now ?? "5", 10);
          triggerDate = new Date(Date.now() + mins * 60000);
        }
        await Notifications.scheduleNotificationAsync({
          content: { title: args.title, body: args.body ?? "Reminder from Nexus AI", sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
        });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: args, displayText: `⏰ Reminder set: "${args.title}"\nTriggers at: ${triggerDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` };
      }

      case "set_alarm": {
        if (Platform.OS === "ios") await Linking.openURL("clock-alarm://").catch(() => Linking.openURL("App-Prefs:Clock"));
        else await Linking.openURL("intent:#Intent;action=android.intent.action.SET_ALARM;end").catch(() => {});
        return { success: true, data: args, displayText: `⏰ Clock app opened${args.time ? ` — set alarm for ${args.time}` : ""}` };
      }

      // ── DEVICE INFO ──
      case "get_battery_info": {
        if (Platform.OS === "web") return { success: false, error: "Not on web", displayText: "Battery info needs mobile app" };
        const [level, state, lowPower] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
          Battery.isLowPowerModeEnabledAsync(),
        ]);
        const stateLabels: Record<number, string> = { 0: "Unknown", 1: "Unplugged 🔋", 2: "Charging ⚡", 3: "Full ✅" };
        const pct = Math.round(level * 100);
        const emoji = pct > 80 ? "🟢" : pct > 40 ? "🟡" : pct > 15 ? "🟠" : "🔴";
        return { success: true, data: { level: pct, state, lowPower }, displayText: `${emoji} Battery: ${pct}%\nStatus: ${stateLabels[state] ?? "Unknown"}\nLow Power Mode: ${lowPower ? "ON ⚡" : "OFF"}` };
      }

      case "get_network_info": {
        if (Platform.OS === "web") return { success: false, error: "Not on web", displayText: "Network info needs mobile app" };
        const [state, ip] = await Promise.all([Network.getNetworkStateAsync(), Network.getIpAddressAsync()]);
        const typeMap: Record<string, string> = { WIFI: "📶 WiFi", CELLULAR: "📱 Cellular", NONE: "❌ No connection", BLUETOOTH: "🔵 Bluetooth", ETHERNET: "🔌 Ethernet" };
        return {
          success: true,
          data: { ...state, ip },
          displayText: `${typeMap[state.type ?? "NONE"] ?? state.type}\nConnected: ${state.isConnected ? "Yes ✅" : "No ❌"}\nInternet: ${state.isInternetReachable ? "Yes ✅" : "No ❌"}\nIP: ${ip}`,
        };
      }

      case "get_device_info": {
        const info = {
          brand: Device.brand,
          model: Device.modelName,
          os: `${Device.osName} ${Device.osVersion}`,
          type: Device.deviceType === 1 ? "Phone" : Device.deviceType === 2 ? "Tablet" : "Other",
          isDevice: Device.isDevice,
          year: Device.deviceYearClass,
          totalMemory: Device.totalMemory ? `${Math.round(Device.totalMemory / (1024 ** 3))} GB RAM` : "Unknown",
        };
        return {
          success: true,
          data: info,
          displayText: `📱 ${info.brand} ${info.model}\n${info.os} • ${info.type}\nRAM: ${info.totalMemory}\nYear class: ${info.year ?? "Unknown"}`,
        };
      }

      case "get_sensor_data": {
        if (Platform.OS === "web") return { success: false, error: "Not on web", displayText: "Sensors need the mobile app" };
        return new Promise((resolve) => {
          const Sensor = args.sensor === "gyroscope" ? Gyroscope : Accelerometer;
          Sensor.setUpdateInterval(100);
          const sub = Sensor.addListener((data) => {
            sub.remove();
            const { x, y, z } = data;
            const emoji = args.sensor === "gyroscope" ? "🌀" : "📐";
            resolve({
              success: true,
              data,
              displayText: `${emoji} ${args.sensor === "gyroscope" ? "Gyroscope" : "Accelerometer"}:\nX: ${x.toFixed(3)}\nY: ${y.toFixed(3)}\nZ: ${z.toFixed(3)}`,
            });
          });
          setTimeout(() => { sub.remove(); resolve({ success: false, error: "Timeout", displayText: "Sensor read timeout" }); }, 3000);
        });
      }

      // ── DEVICE CONTROL ──
      case "set_brightness": {
        if (Platform.OS === "web") return { success: false, error: "Not on web", displayText: "Brightness control needs the mobile app" };
        const { status } = await Brightness.requestPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Brightness permission denied" };
        const val = Math.max(0, Math.min(1, parseFloat(args.level)));
        await Brightness.setBrightnessAsync(val);
        const pct = Math.round(val * 100);
        return { success: true, data: { brightness: val }, displayText: `☀️ Screen brightness set to ${pct}%` };
      }

      case "vibrate_device": {
        if (Platform.OS === "web") return { success: true, data: {}, displayText: "Vibration (not available on web)" };
        const patterns: Record<string, number[]> = {
          short: [0, 100],
          long: [0, 500],
          double: [0, 200, 100, 200],
          sos: [0, 100, 50, 100, 50, 100, 200, 300, 200, 300, 200, 300, 200, 100, 50, 100, 50, 100],
        };
        const pattern = patterns[args.pattern ?? "short"];
        Vibration.vibrate(pattern);
        return { success: true, data: args, displayText: `📳 Vibrating (${args.pattern ?? "short"})` };
      }

      case "authenticate_biometric": {
        if (Platform.OS === "web") return { success: false, error: "Not on web", displayText: "Biometrics need the mobile app" };
        const hasHardware = await LocalAuth.hasHardwareAsync();
        const isEnrolled = await LocalAuth.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return { success: false, error: "Biometrics not available", displayText: "No biometric hardware or enrollment found on this device" };
        const types = await LocalAuth.supportedAuthenticationTypesAsync();
        const typeNames = types.map((t) => (t === 1 ? "Fingerprint" : t === 2 ? "Face ID" : "Iris")).join(", ");
        const result = await LocalAuth.authenticateAsync({
          promptMessage: args.reason ?? "Authenticate with Nexus AI",
          fallbackLabel: "Use passcode",
          cancelLabel: "Cancel",
        });
        await Haptics.notificationAsync(result.success ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
        return {
          success: result.success,
          data: result,
          displayText: result.success
            ? `🔓 Authenticated via ${typeNames}!`
            : `🔒 Authentication failed${result.error ? `: ${result.error}` : ""}`,
        };
      }

      // ── FILES ──
      case "save_note": {
        await ensureNotesDir();
        const filename = args.filename ?? `note-${Date.now()}.txt`;
        const sanitized = filename.replace(/[/\\?%*:|"<>]/g, "-");
        await FileSystem.writeAsStringAsync(`${NOTES_DIR}${sanitized}`, args.content, { encoding: FileSystem.EncodingType.UTF8 });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: { filename: sanitized }, displayText: `📝 Saved "${sanitized}"\n${args.content.length} characters` };
      }

      case "read_note": {
        await ensureNotesDir();
        const path = `${NOTES_DIR}${args.filename}`;
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return { success: false, error: "File not found", displayText: `File "${args.filename}" not found. Use list_notes to see saved files.` };
        const content = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
        return { success: true, data: { filename: args.filename, content }, displayText: `📄 "${args.filename}":\n\n${content}` };
      }

      case "list_notes": {
        await ensureNotesDir();
        const files = await FileSystem.readDirectoryAsync(NOTES_DIR);
        if (files.length === 0) return { success: true, data: [], displayText: "📁 No saved notes yet. Use save_note to create one." };
        return { success: true, data: files, displayText: `📁 Saved notes (${files.length}):\n${files.map((f) => `• ${f}`).join("\n")}` };
      }

      // ── CLIPBOARD ──
      case "copy_to_clipboard":
        await Clipboard.setStringAsync(args.text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: args, displayText: `📋 Copied: "${args.label ?? args.text.slice(0, 60)}${args.text.length > 60 ? "..." : ""}"` };

      case "read_clipboard": {
        const text = await Clipboard.getStringAsync();
        return { success: true, data: { text }, displayText: `📋 Clipboard content:\n"${text || "(empty)"}"` };
      }

      // ── WEB ──
      case "open_url":
        await Linking.openURL(args.url);
        return { success: true, data: args, displayText: `🌐 Opened: ${args.label ?? args.url}` };

      case "search_web":
        await Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(args.query)}`);
        return { success: true, data: args, displayText: `🔍 Searching Google: "${args.query}"` };

      // ── SOCIAL MEDIA ──
      case "open_instagram": {
        const { action, username, dm_message } = args;
        let url = "instagram://feed";
        let fallback = "https://instagram.com";
        if (action === "profile" && username) { url = `instagram://user?username=${username}`; fallback = `https://instagram.com/${username}`; }
        else if (action === "dm") { url = username ? `instagram://direct-share?screen=NewThread&recipient=${username}` : "instagram://direct/inbox"; fallback = "https://instagram.com/direct/inbox"; }
        const ok = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(ok ? url : fallback);
        return { success: true, data: args, displayText: `📸 Instagram ${action === "profile" ? `@${username}` : action}${dm_message ? `\nMessage ready: "${dm_message}"` : ""}` };
      }

      case "open_whatsapp": {
        const { phone_number, message } = args;
        const cleaned = (phone_number ?? "").replace(/[^0-9]/g, "");
        const url = cleaned ? `whatsapp://send?phone=${cleaned}${message ? `&text=${encodeURIComponent(message)}` : ""}` : "whatsapp://app";
        const fallback = cleaned ? `https://wa.me/${cleaned}${message ? `?text=${encodeURIComponent(message)}` : ""}` : "https://web.whatsapp.com";
        const ok = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(ok ? url : fallback);
        return { success: true, data: args, displayText: `💬 WhatsApp${phone_number ? ` → ${phone_number}` : ""}${message ? `\nMessage: "${message}"` : ""}` };
      }

      case "open_youtube": {
        const url = args.url ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query ?? "")}`;
        await Linking.openURL(url);
        return { success: true, data: args, displayText: `▶️ YouTube${args.query ? `: "${args.query}"` : ""}` };
      }

      case "open_twitter": {
        let url = "twitter://";
        let fallback = "https://x.com";
        if (args.tweet_text) { url = `twitter://post?message=${encodeURIComponent(args.tweet_text)}`; fallback = `https://x.com/intent/tweet?text=${encodeURIComponent(args.tweet_text)}`; }
        else if (args.username) { url = `twitter://user?screen_name=${args.username}`; fallback = `https://x.com/${args.username}`; }
        const ok = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(ok ? url : fallback);
        return { success: true, data: args, displayText: `🐦 Twitter${args.username ? ` @${args.username}` : ""}` };
      }

      case "open_spotify": {
        const native = args.query ? `spotify://search/${encodeURIComponent(args.query)}` : "spotify://";
        const web = args.query ? `https://open.spotify.com/search/${encodeURIComponent(args.query)}` : "https://open.spotify.com";
        const ok = await Linking.canOpenURL(native).catch(() => false);
        await Linking.openURL(ok ? native : web);
        return { success: true, data: args, displayText: `🎵 Spotify${args.query ? `: "${args.query}"` : ""}` };
      }

      // ── APPS & SETTINGS ──
      case "open_app": {
        const key = args.app_name.toLowerCase();
        const links = APP_LINKS[key];
        if (links) {
          const ok = await Linking.canOpenURL(links[0]).catch(() => false);
          await Linking.openURL(ok ? links[0] : links[1]);
        } else {
          const store = Platform.OS === "ios"
            ? `https://apps.apple.com/search?term=${encodeURIComponent(args.app_name)}`
            : `https://play.google.com/store/search?q=${encodeURIComponent(args.app_name)}`;
          await Linking.openURL(store);
        }
        return { success: true, data: args, displayText: `📱 Opening ${args.app_name}` };
      }

      case "open_settings": {
        const page = args.page ?? "main";
        const target = SETTINGS_URLS[page] ?? (Platform.OS === "ios" ? "app-settings:" : "android.settings.SETTINGS");
        try {
          await Linking.openURL(target);
        } catch {
          await Linking.openURL(Platform.OS === "ios" ? "app-settings:" : "android.settings.SETTINGS");
        }
        return { success: true, data: args, displayText: `⚙️ Opening Settings${page !== "main" ? ` → ${page}` : ""}` };
      }

      case "share_content": {
        if (Platform.OS === "web") { await Clipboard.setStringAsync(args.message); return { success: true, data: args, displayText: "Copied to clipboard (share unavailable on web)" }; }
        await Share.share({ message: args.message, title: args.title });
        return { success: true, data: args, displayText: `📤 Share sheet opened` };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}`, displayText: `Unknown action: ${name}` };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg, displayText: `⚠️ Error: ${msg}` };
  }
}
