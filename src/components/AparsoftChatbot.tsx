import { useEffect } from "react";

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

function getAparsoftConfig(): LoaderConfig | null {
  const apiKey = (import.meta.env.VITE_APARSOFT_WIDGET_KEY as string | undefined)?.trim();
  const configuredWidgetUrl = (
    import.meta.env.VITE_APARSOFT_WIDGET_SCRIPT_URL as string | undefined
  )?.trim();

  if (!apiKey) return null;

  const resolvedScriptUrl = configuredWidgetUrl || WIDGET_SCRIPT_URL;

  return {
    apiKey,
    position: "bottom-right",
    showBranding: true,
    autoOpenDelayMs: 0,
    configEndpoint: `https://www.aparsoft.com/api/v1/chatbot/public/widget/${encodeURIComponent(apiKey)}/config/`,
    websocketUrl: "wss://www.aparsoft.com/ws/client-chatbot/",
    primaryColor: "#1d4ed8",
    secondaryColor: "#0f766e",
    widgetTitle: "TerraTrust Support",
    title: "TerraTrust Support",
    widgetSubtitle: "Powered by Aparsoft",
    welcomeMessage: "Hello! How can we help with your TerraTrust property workflows today?",
  };
}

export default function AparsoftChatbot() {
  useEffect(() => {
    const runtimeConfig = getAparsoftConfig();
    if (!runtimeConfig) {
      return undefined;
    }

    const applyLoaderDataset = (script: HTMLScriptElement, runtimeConfig: LoaderConfig) => {
      script.dataset.aparsoftChatbot = "true";
      script.dataset.apiKey = runtimeConfig.apiKey;
      if (runtimeConfig.position) script.dataset.position = runtimeConfig.position;
      if (typeof runtimeConfig.showBranding === "boolean")
        script.dataset.showBranding = String(runtimeConfig.showBranding);
      if (runtimeConfig.autoOpenDelayMs && runtimeConfig.autoOpenDelayMs > 0)
        script.dataset.autoOpenDelayMs = String(runtimeConfig.autoOpenDelayMs);
      if (runtimeConfig.configEndpoint)
        script.dataset.configEndpoint = runtimeConfig.configEndpoint;
      if (runtimeConfig.websocketUrl) script.dataset.websocketUrl = runtimeConfig.websocketUrl;
      if (runtimeConfig.primaryColor) script.dataset.primaryColor = runtimeConfig.primaryColor;
      if (runtimeConfig.secondaryColor)
        script.dataset.secondaryColor = runtimeConfig.secondaryColor;
      if (runtimeConfig.widgetTitle) script.dataset.widgetTitle = runtimeConfig.widgetTitle;
      if (runtimeConfig.widgetSubtitle)
        script.dataset.widgetSubtitle = runtimeConfig.widgetSubtitle;
      if (runtimeConfig.welcomeMessage)
        script.dataset.welcomeMessage = runtimeConfig.welcomeMessage;
      if (runtimeConfig.title) script.dataset.title = runtimeConfig.title;
    };

    const existingScript = document.querySelector(
      'script[src="' + WIDGET_SCRIPT_URL + '"][data-aparsoft-chatbot]',
    );
    if (existingScript) {
      existingScript.remove();
    }

    try {
      window.AparsoftChatbot?.destroy?.();
    } catch {
      // Widget cleanup is best effort.
    }
    window.AparsoftChatbot = null;

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_URL;
    script.async = true;
    script.dataset.aparsoftChatbot = "true";
    script.dataset.apiKey = runtimeConfig.apiKey;
    script.dataset.position = runtimeConfig.position || "bottom-right";
    script.dataset.showBranding = String(runtimeConfig.showBranding ?? true);
    script.dataset.configEndpoint = runtimeConfig.configEndpoint || "";
    if (runtimeConfig.websocketUrl) script.dataset.websocketUrl = runtimeConfig.websocketUrl;
    document.body.appendChild(script);

    return () => {
      script.remove();
      try {
        window.AparsoftChatbot?.destroy?.();
      } catch {
        // Widget cleanup is best effort.
      }
      window.AparsoftChatbot = null;
    };
  }, []);

  return null;
}
