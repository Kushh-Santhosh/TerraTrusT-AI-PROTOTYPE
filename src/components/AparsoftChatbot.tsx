import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

const WIDGET_SCRIPT_URL = "https://www.aparsoft.com/static/chatbot-widget/widget.loader.js";

declare global {
  interface Window {
    AparsoftChatbot?: {
      destroy?: () => void;
      [key: string]: unknown;
    } | null;
  }
}

interface LoaderConfig {
  apiKey: string;
  position?: string;
  showBranding?: boolean;
  autoOpenDelayMs?: number;
  configEndpoint?: string;
  websocketUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  widgetTitle?: string;
  title?: string;
  widgetSubtitle?: string;
  welcomeMessage?: string;
}

export default function AparsoftChatbot() {
  const { user } = useAuth();

  useEffect(() => {
    // Only mount on authenticated screens
    if (!user) return;

    const loaderConfig: LoaderConfig = {
      apiKey: "sha256$979682ca8ffb0a33f5840bd839f7ea513c652ff0f814d3e3b5b76f22e868e422",
      position: "bottom-right",
      showBranding: true,
      autoOpenDelayMs: 0,
      configEndpoint: "https://www.aparsoft.com/api/v1/chatbot/public/widget/{apiKey}/config/",
      websocketUrl: "wss://www.aparsoft.com/ws/client-chatbot/",
      primaryColor: "#1d4ed8",
      secondaryColor: "#0f766e",
      widgetTitle: "TerraTrust AI Assistant",
      title: "TerraTrust AI Assistant",
      widgetSubtitle: "Powered by Aparsoft AI",
      welcomeMessage: "Hello! How can I assist you with TerraTrust properties today?",
    };

    const applyLoaderDataset = (script: HTMLScriptElement, runtimeConfig: LoaderConfig) => {
      script.dataset.aparsoftChatbot = "true";
      script.dataset.apiKey = runtimeConfig.apiKey;
      if (runtimeConfig.position) script.dataset.position = runtimeConfig.position;
      if (typeof runtimeConfig.showBranding === "boolean")
        script.dataset.showBranding = String(runtimeConfig.showBranding);
      if (runtimeConfig.autoOpenDelayMs && runtimeConfig.autoOpenDelayMs > 0)
        script.dataset.autoOpenDelayMs = String(runtimeConfig.autoOpenDelayMs);
      if (runtimeConfig.configEndpoint) script.dataset.configEndpoint = runtimeConfig.configEndpoint;
      if (runtimeConfig.websocketUrl) script.dataset.websocketUrl = runtimeConfig.websocketUrl;
      if (runtimeConfig.primaryColor) script.dataset.primaryColor = runtimeConfig.primaryColor;
      if (runtimeConfig.secondaryColor) script.dataset.secondaryColor = runtimeConfig.secondaryColor;
      if (runtimeConfig.widgetTitle) script.dataset.widgetTitle = runtimeConfig.widgetTitle;
      if (runtimeConfig.widgetSubtitle) script.dataset.widgetSubtitle = runtimeConfig.widgetSubtitle;
      if (runtimeConfig.welcomeMessage) script.dataset.welcomeMessage = runtimeConfig.welcomeMessage;
      if (runtimeConfig.title) script.dataset.title = runtimeConfig.title;
    };

    // Ensure only one script element exists
    const existingScript = document.querySelector(
      'script[src="' + WIDGET_SCRIPT_URL + '"][data-aparsoft-chatbot]'
    );
    if (existingScript) {
      return; // Already loaded, do not duplicate
    }

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    applyLoaderDataset(script, loaderConfig);
    document.body.appendChild(script);

    return () => {
      // Cleanup on full unmount if needed
    };
  }, [user]);

  return null;
}
