"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("[pwa] service worker registered", reg.scope);
      } catch (err) {
        console.warn("[pwa] SW register failed", err);
      }
    };

    // After load so it doesn't block first paint
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}

/** Call after successful order to show a local notification (if permitted). */
export async function notifyOrderPlaced(orderNumber) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return;

  const title = "BuyWater – Order placed";
  const body = orderNumber
    ? `Order ${orderNumber} received. We will process it shortly.`
    : "Your water order was placed successfully.";

  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "NOTIFY",
      title,
      body,
      url: "/dashboard?tab=tracking",
    });
  } else {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
    });
  }
}
