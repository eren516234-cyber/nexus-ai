import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { Platform, Share } from "react-native";

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

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "open_camera",
    description: "Take a photo or video using the device camera. Use when user says 'take a photo', 'take a picture', 'capture', 'selfie', 'photograph'.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "pick_image",
    description: "Pick an existing image or video from the device photo gallery/library.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_location",
    description: "Get the user's current GPS location. Use when user asks 'where am I', 'my location', 'current location', 'what city am I in'.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "make_call",
    description: "Initiate a phone call to a phone number. Use when user says 'call', 'dial', 'ring'.",
    parameters: {
      type: "object",
      properties: {
        phone_number: { type: "string", description: "Phone number to call e.g. +919876543210" },
        name: { type: "string", description: "Name of person being called" },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "send_sms",
    description: "Open SMS/message composer to send a text message.",
    parameters: {
      type: "object",
      properties: {
        phone_number: { type: "string", description: "Phone number to message" },
        message: { type: "string", description: "Pre-filled message text" },
      },
      required: ["phone_number"],
    },
  },
  {
    name: "send_email",
    description: "Open email composer to draft and send an email.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address" },
        subject: { type: "string", description: "Email subject line" },
        body: { type: "string", description: "Email body text" },
      },
      required: ["to"],
    },
  },
  {
    name: "open_url",
    description: "Open any website URL in the browser.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Full URL starting with https://" },
        label: { type: "string", description: "Human-readable label" },
      },
      required: ["url"],
    },
  },
  {
    name: "search_web",
    description: "Search Google for any information or topic.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Search query" } },
      required: ["query"],
    },
  },
  {
    name: "open_maps",
    description: "Open maps to navigate to a location or find a place.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Location name or address" } },
      required: ["query"],
    },
  },
  {
    name: "copy_to_clipboard",
    description: "Copy text or content to the device clipboard.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to copy" },
        label: { type: "string", description: "What was copied" },
      },
      required: ["text"],
    },
  },
  {
    name: "share_content",
    description: "Share text, URL, or content using the system share sheet.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Text or URL to share" },
        title: { type: "string", description: "Share sheet title" },
      },
      required: ["message"],
    },
  },
  {
    name: "set_alarm",
    description: "Open the clock app to set an alarm or reminder.",
    parameters: {
      type: "object",
      properties: { time: { type: "string", description: "Alarm time e.g. '7:30 AM'" } },
      required: [],
    },
  },
  {
    name: "open_instagram",
    description: "Open Instagram app — to a specific user profile, DMs, or the main feed. Use when user says 'open Instagram', 'go to Instagram', 'Instagram profile of X', 'message X on Instagram'.",
    parameters: {
      type: "object",
      properties: {
        username: { type: "string", description: "Instagram username to open (without @). Leave empty to open main app." },
        action: { type: "string", description: "What to do: 'profile' to view profile, 'dm' to open direct messages, 'feed' to open main feed", enum: ["profile", "dm", "feed"] },
        dm_message: { type: "string", description: "Pre-filled message text for DMs (optional)" },
      },
      required: ["action"],
    },
  },
  {
    name: "open_whatsapp",
    description: "Open WhatsApp to send a message to a phone number or open the app.",
    parameters: {
      type: "object",
      properties: {
        phone_number: { type: "string", description: "Phone number with country code e.g. +919876543210" },
        message: { type: "string", description: "Pre-filled message to send" },
      },
      required: [],
    },
  },
  {
    name: "open_youtube",
    description: "Open YouTube app or search YouTube for videos.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query or video topic" },
        url: { type: "string", description: "Direct YouTube URL if known" },
      },
      required: [],
    },
  },
  {
    name: "open_twitter",
    description: "Open Twitter/X app or go to a profile.",
    parameters: {
      type: "object",
      properties: {
        username: { type: "string", description: "Twitter username without @" },
        tweet_text: { type: "string", description: "Pre-filled tweet text to compose" },
      },
      required: [],
    },
  },
  {
    name: "open_spotify",
    description: "Open Spotify to play music, search for songs, artists, or playlists.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Song, artist, or playlist to search" },
      },
      required: [],
    },
  },
  {
    name: "open_app",
    description: "Open any installed app by name using deep links or app store.",
    parameters: {
      type: "object",
      properties: {
        app_name: { type: "string", description: "App name e.g. 'Gmail', 'Snapchat', 'TikTok', 'Telegram', 'Zoom', 'Uber', 'Amazon'" },
        action: { type: "string", description: "Optional specific action within the app" },
      },
      required: ["app_name"],
    },
  },
  {
    name: "facetime_call",
    description: "Start a FaceTime audio or video call (iOS only).",
    parameters: {
      type: "object",
      properties: {
        contact: { type: "string", description: "Phone number or email for FaceTime" },
        video: { type: "string", description: "true for video call, false for audio only", enum: ["true", "false"] },
      },
      required: ["contact"],
    },
  },
];

// App deep link schemes
const APP_SCHEMES: Record<string, string[]> = {
  gmail: ["googlegmail://", "https://mail.google.com"],
  snapchat: ["snapchat://", "https://snapchat.com"],
  tiktok: ["snssdk1233://", "https://tiktok.com"],
  telegram: ["tg://", "https://t.me"],
  zoom: ["zoomus://", "https://zoom.us"],
  uber: ["uber://", "https://uber.com"],
  amazon: ["com.amazon.mobile.shopping://", "https://amazon.com"],
  netflix: ["nflx://", "https://netflix.com"],
  twitter: ["twitter://", "https://twitter.com"],
  x: ["twitter://", "https://x.com"],
  facebook: ["fb://", "https://facebook.com"],
  linkedin: ["linkedin://", "https://linkedin.com"],
  reddit: ["reddit://", "https://reddit.com"],
  discord: ["discord://", "https://discord.com"],
  twitch: ["twitch://", "https://twitch.tv"],
  pinterest: ["pinterest://", "https://pinterest.com"],
  airbnb: ["airbnb://", "https://airbnb.com"],
  maps: ["maps://", "https://maps.google.com"],
};

export async function executeTool(name: string, args: Record<string, string>): Promise<ToolResult> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  try {
    switch (name) {
      case "open_camera": {
        // On web, fall back to image picker
        if (Platform.OS === "web") {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.85,
          });
          if (result.canceled) return { success: false, error: "Cancelled", displayText: "No image selected" };
          return { success: true, data: { uri: result.assets[0].uri }, imageUri: result.assets[0].uri, displayText: "Image selected" };
        }
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Camera permission denied", displayText: "Camera permission was denied. Please enable it in Settings." };
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.85 });
        if (result.canceled) return { success: false, error: "Cancelled", displayText: "Camera cancelled" };
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: { uri: result.assets[0].uri }, imageUri: result.assets[0].uri, displayText: "Photo taken!" };
      }

      case "pick_image": {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted" && Platform.OS !== "web") return { success: false, error: "Permission denied", displayText: "Photo library permission denied" };
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
        if (result.canceled) return { success: false, error: "Cancelled", displayText: "No image selected" };
        return { success: true, data: { uri: result.assets[0].uri }, imageUri: result.assets[0].uri, displayText: "Image selected from gallery" };
      }

      case "get_location": {
        if (Platform.OS === "web") {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ success: true, data: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, displayText: `📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }),
              (err) => resolve({ success: false, error: err.message, displayText: "Location unavailable" })
            );
          });
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return { success: false, error: "Permission denied", displayText: "Location permission denied. Enable in Settings." };
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo) address = [geo.street, geo.city, geo.region, geo.country].filter(Boolean).join(", ");
        } catch {}
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: { latitude, longitude, address }, displayText: `📍 ${address}` };
      }

      case "make_call": {
        const url = `tel:${args.phone_number?.replace(/\s/g, "")}`;
        await Linking.openURL(url);
        return { success: true, data: { phone_number: args.phone_number }, displayText: `📞 Calling ${args.name ?? args.phone_number}...` };
      }

      case "send_sms": {
        const sep = Platform.OS === "ios" ? "&" : "?";
        const url = `sms:${args.phone_number}${args.message ? `${sep}body=${encodeURIComponent(args.message)}` : ""}`;
        await Linking.openURL(url);
        return { success: true, data: args, displayText: `💬 Opening SMS to ${args.phone_number}` };
      }

      case "send_email": {
        const params = new URLSearchParams();
        if (args.subject) params.set("subject", args.subject);
        if (args.body) params.set("body", args.body);
        const q = params.toString();
        await Linking.openURL(`mailto:${args.to}${q ? `?${q}` : ""}`);
        return { success: true, data: args, displayText: `📧 Opening email to ${args.to}` };
      }

      case "open_url": {
        await Linking.openURL(args.url);
        return { success: true, data: args, displayText: `🌐 Opened ${args.label ?? args.url}` };
      }

      case "search_web": {
        await Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(args.query)}`);
        return { success: true, data: args, displayText: `🔍 Searching: "${args.query}"` };
      }

      case "open_maps": {
        const q = encodeURIComponent(args.query);
        const url = Platform.OS === "ios" ? `maps://?q=${q}` : `geo:0,0?q=${q}`;
        const supported = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(supported ? url : `https://maps.google.com/?q=${q}`);
        return { success: true, data: args, displayText: `🗺️ Opening maps for "${args.query}"` };
      }

      case "copy_to_clipboard": {
        await Clipboard.setStringAsync(args.text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true, data: args, displayText: `📋 Copied "${args.label ?? args.text.slice(0, 40)}" to clipboard` };
      }

      case "share_content": {
        if (Platform.OS === "web") {
          await Clipboard.setStringAsync(args.message);
          return { success: true, data: args, displayText: "Copied to clipboard (share unavailable on web)" };
        }
        await Share.share({ message: args.message, title: args.title });
        return { success: true, data: args, displayText: "📤 Share sheet opened" };
      }

      case "set_alarm": {
        if (Platform.OS === "ios") await Linking.openURL("clock-alarm://").catch(() => {});
        else if (Platform.OS === "android") await Linking.openURL("intent:#Intent;action=android.intent.action.SET_ALARM;end").catch(() => {});
        return { success: true, data: args, displayText: `⏰ Opening Clock${args.time ? ` — set for ${args.time}` : ""}` };
      }

      case "open_instagram": {
        const { action, username, dm_message } = args;
        let url = "";
        let fallback = "https://instagram.com";

        if (action === "profile" && username) {
          url = `instagram://user?username=${username}`;
          fallback = `https://instagram.com/${username}`;
        } else if (action === "dm") {
          url = username ? `instagram://direct-share?screen=NewThread&recipient=${username}` : "instagram://direct/inbox";
          fallback = "https://instagram.com/direct/inbox";
        } else {
          url = "instagram://feed";
          fallback = "https://instagram.com";
        }

        const supported = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(supported ? url : fallback);

        const actionLabel = action === "profile" ? `@${username} profile` : action === "dm" ? "DMs" : "feed";
        return {
          success: true,
          data: args,
          displayText: `📸 Opened Instagram ${actionLabel}${dm_message ? `\n\nNote: Type this message: "${dm_message}"` : ""}`,
        };
      }

      case "open_whatsapp": {
        const { phone_number, message } = args;
        let url = "whatsapp://app";
        let fallback = "https://web.whatsapp.com";
        if (phone_number) {
          const cleaned = phone_number.replace(/[^0-9]/g, "");
          url = `whatsapp://send?phone=${cleaned}${message ? `&text=${encodeURIComponent(message)}` : ""}`;
          fallback = `https://wa.me/${cleaned}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
        }
        const supported = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(supported ? url : fallback);
        return { success: true, data: args, displayText: `💬 Opening WhatsApp${phone_number ? ` to ${phone_number}` : ""}${message ? `\nMessage: "${message}"` : ""}` };
      }

      case "open_youtube": {
        const { query, url } = args;
        if (url) {
          await Linking.openURL(url);
          return { success: true, data: args, displayText: `▶️ Opening YouTube video` };
        }
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query ?? "")}`;
        await Linking.openURL(searchUrl);
        return { success: true, data: args, displayText: `▶️ Searching YouTube: "${query}"` };
      }

      case "open_twitter": {
        const { username, tweet_text } = args;
        let url = "twitter://";
        let fallback = "https://x.com";
        if (tweet_text) {
          url = `twitter://post?message=${encodeURIComponent(tweet_text)}`;
          fallback = `https://x.com/intent/tweet?text=${encodeURIComponent(tweet_text)}`;
        } else if (username) {
          url = `twitter://user?screen_name=${username}`;
          fallback = `https://x.com/${username}`;
        }
        const supported = await Linking.canOpenURL(url).catch(() => false);
        await Linking.openURL(supported ? url : fallback);
        return { success: true, data: args, displayText: `🐦 Opened Twitter${username ? ` — @${username}` : ""}` };
      }

      case "open_spotify": {
        const { query } = args;
        const url = query ? `https://open.spotify.com/search/${encodeURIComponent(query)}` : "https://open.spotify.com";
        const native = query ? `spotify://search/${encodeURIComponent(query)}` : "spotify://";
        const supported = await Linking.canOpenURL(native).catch(() => false);
        await Linking.openURL(supported ? native : url);
        return { success: true, data: args, displayText: `🎵 Opening Spotify${query ? `: "${query}"` : ""}` };
      }

      case "open_app": {
        const appKey = args.app_name.toLowerCase();
        const schemes = APP_SCHEMES[appKey];
        if (schemes) {
          const native = schemes[0];
          const web = schemes[1];
          const supported = await Linking.canOpenURL(native).catch(() => false);
          await Linking.openURL(supported ? native : web);
        } else {
          // Fall back to App Store / Play Store search
          const storeUrl = Platform.OS === "ios"
            ? `https://apps.apple.com/search?term=${encodeURIComponent(args.app_name)}`
            : `https://play.google.com/store/search?q=${encodeURIComponent(args.app_name)}`;
          await Linking.openURL(storeUrl);
        }
        return { success: true, data: args, displayText: `📱 Opening ${args.app_name}` };
      }

      case "facetime_call": {
        if (Platform.OS !== "ios") return { success: false, error: "FaceTime is iOS only", displayText: "FaceTime is only available on iPhone" };
        const isVideo = args.video !== "false";
        const scheme = isVideo ? "facetime://" : "facetime-audio://";
        await Linking.openURL(`${scheme}${args.contact}`);
        return { success: true, data: args, displayText: `📹 Starting FaceTime ${isVideo ? "video" : "audio"} call with ${args.contact}` };
      }

      default:
        return { success: false, error: `Unknown tool: ${name}`, displayText: `Unknown action: ${name}` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message, displayText: `Error: ${message}` };
  }
}
