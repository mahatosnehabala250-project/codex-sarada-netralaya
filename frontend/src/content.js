export const platformCopy = {
  name: "Awaaz AI",
  title: "Voice agents that answer, qualify, book, and hand off calls for growing businesses.",
  subtitle:
    "A clinic-first voice AI platform for India that captures missed calls, books appointments, and triggers n8n automations after every conversation.",
  webhookPath: "/api/webhooks/voice-calls"
};

export const launchSteps = [
  "Create outbound calls through Vobiz with lowercase from, to, and answer_url fields",
  "Return Stream XML from /xml/answer for bidirectional inbound audio",
  "Handle WebSocket audio at /ws/audio for Gemini STT/TTS integration",
  "Send outcomes to n8n for CRM, WhatsApp, calendar, and staff workflows"
];

export const vobizChecklist = [
  { label: "Outbound endpoint", value: "POST /api/vobiz/outbound-call" },
  { label: "Answer XML", value: "POST /xml/answer" },
  { label: "Audio stream", value: "ws(s)://your-domain/ws/audio" },
  { label: "Hangup callback", value: "POST /xml/hangup" }
];

export const demoPayload = {
  businessName: "Aarogya Family Clinic",
  callerName: "New Patient",
  callerPhone: "+919999000111",
  intent: "appointment_booking",
  outcome: "booked",
  language: "Hindi",
  summary: "Caller wanted a fever consultation and booked a slot for today at 6 PM.",
  nextAction: "Send confirmation on WhatsApp and notify reception.",
  revenueSignal: "new_appointment",
  durationSeconds: 142,
  source: "website-demo"
};
