"use client";

const GROUP_URL = "https://chat.whatsapp.com/B8elcmVfb2J0F9gQktYUaF";

export default function WhatsAppFloat() {
  return (
    <a
      href={GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join BuyWater WhatsApp group"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe57] focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
      title="Join our WhatsApp group"
    >
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.002 3C9.373 3 4 8.373 4 15.002c0 2.652.87 5.104 2.34 7.1L4.7 28.3a1 1 0 0 0 1.25 1.25l6.2-1.64A11.94 11.94 0 0 0 16.002 27C22.63 27 28 21.627 28 15.002 28 8.373 22.63 3 16.002 3zm0 2c5.523 0 10 4.477 10 10.002 0 5.524-4.477 9.998-10 9.998a9.94 9.94 0 0 1-3.36-.58 1 1 0 0 0-.74.05l-4.54 1.2 1.2-4.54a1 1 0 0 0 .05-.74A9.94 9.94 0 0 1 6.002 15C6.002 9.477 10.479 5 16.002 5zm-3.35 4.7c-.24 0-.62.09-.95.45-.33.36-1.25 1.22-1.25 2.97 0 1.75 1.28 3.44 1.46 3.68.18.24 2.47 3.95 6.1 5.38 3.02 1.18 3.63 1 4.28.94.65-.06 2.1-.86 2.4-1.69.3-.83.3-1.54.21-1.69-.09-.15-.33-.24-.69-.42-.36-.18-2.1-1.04-2.43-1.16-.33-.12-.57-.18-.81.18-.24.36-.93 1.16-1.14 1.4-.21.24-.42.27-.78.09-.36-.18-1.52-.56-2.9-1.79-1.07-.95-1.79-2.13-2-2.49-.21-.36-.02-.55.16-.73.16-.16.36-.42.54-.63.18-.21.24-.36.36-.6.12-.24.06-.45-.03-.63-.09-.18-.81-1.95-1.11-2.67-.29-.7-.58-.6-.81-.61z" />
      </svg>
    </a>
  );
}
