"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const GROUP_URL = "https://chat.whatsapp.com/B8elcmVfb2J0F9gQktYUaF";
const STORAGE_KEY = "buywater_wa_float_pos";

export default function WhatsAppFloat() {
  const path = usePathname();
  const [pos, setPos] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ active: false, ox: 0, oy: 0, moved: false });
  const btnRef = useRef(null);

  // Hide on all admin routes
  const hide =
    path?.startsWith("/admin") ||
    path?.startsWith("/admin-login");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.x === "number" && typeof p.y === "number") {
          setPos(p);
          return;
        }
      }
    } catch (_) {}
    // default bottom-right
    setPos({
      x: typeof window !== "undefined" ? window.innerWidth - 80 : 20,
      y: typeof window !== "undefined" ? window.innerHeight - 80 : 20,
    });
  }, []);

  useEffect(() => {
    function onMove(e) {
      if (!dragRef.current.active) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const size = 56;
      const x = Math.min(
        Math.max(8, clientX - dragRef.current.ox),
        window.innerWidth - size - 8
      );
      const y = Math.min(
        Math.max(8, clientY - dragRef.current.oy),
        window.innerHeight - size - 8
      );
      dragRef.current.moved = true;
      setPos({ x, y });
    }
    function onUp() {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      setDragging(false);
      setPos((p) => {
        if (p.x != null) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
          } catch (_) {}
        }
        return p;
      });
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  if (hide || pos.x == null) return null;

  function startDrag(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = {
      active: true,
      ox: clientX - pos.x,
      oy: clientY - pos.y,
      moved: false,
    };
    setDragging(true);
  }

  function onClick(e) {
    // If user dragged, don't open the link
    if (dragRef.current.moved) {
      e.preventDefault();
    }
  }

  return (
    <a
      ref={btnRef}
      href={GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join BuyWater WhatsApp group"
      title="Drag to move · Click to open WhatsApp"
      onClick={onClick}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 50,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
      }}
      className="block h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
    >
      {/* Custom WhatsApp icon (provided image) */}
      <img
        src="/whatsapp-icon.jpg"
        alt="WhatsApp"
        draggable={false}
        className="h-14 w-14 rounded-full object-cover pointer-events-none"
        onError={(e) => {
          // Fallback green circle if image missing
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement.classList.add("bg-[#25D366]");
        }}
      />
    </a>
  );
}
