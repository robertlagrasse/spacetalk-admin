const state = {
  apiBaseUrl:
    localStorage.getItem("dispatchConsoleApiBaseUrl") ||
    "https://ld1t1g7smd.execute-api.us-east-1.amazonaws.com",
  dispatcherId: "",
  dispatcherEmail: localStorage.getItem("dispatchConsoleEmail") || "",
  displayName: "",
  tenantId: "",
  language: localStorage.getItem("dispatchConsoleLanguage") || "en",
  alertTone: localStorage.getItem("dispatchConsoleAlertTone") || "none",
  channels: [],
  users: [],
  transmissions: [],
  transmissionsCursor: null,
  playedMessageIds: new Set(),
  audioQueue: [],
  isPlayingQueue: false,
  isInitialLoad: true,
  // Send mode: "channel" or "user"
  sendMode: "channel",
  // Filters
  showOwnMessages: true,
  showOtherDMs: true,
  showTextMessages: true,
  // View mode: "summary" or "transcript"
  viewMode: "summary",
  // Map filter: "all", "channel", or "user"
  mapFilterMode: "all",
  mapFilterChannelId: "",
  mapFilterUserId: ""
};

// DOM Elements
const apiBaseUrlInput = document.getElementById("api-base-url");
const dispatcherEmailInput = document.getElementById("dispatcher-email");
const dispatcherPasswordInput = document.getElementById("dispatcher-password");
const loginButton = document.getElementById("login");
const loginStatus = document.getElementById("login-status");
const loginPanel = document.getElementById("login-panel");
const appPanel = document.getElementById("app-panel");
const headerControls = document.getElementById("header-controls");
const dispatcherNameEl = document.getElementById("dispatcher-name");
const tenantInfoEl = document.getElementById("tenant-info");
const languageSelect = document.getElementById("language-select");
const alertToneSelect = document.getElementById("alert-tone-select");
const logoutButton = document.getElementById("logout");

const locateStatus = document.getElementById("locate-status");
const locateMapContainer = document.getElementById("locate-map");
const refreshLocationsButton = document.getElementById("refresh-locations");
const mapFilterAllBtn = document.getElementById("map-filter-all");
const mapFilterChannelBtn = document.getElementById("map-filter-channel");
const mapFilterUserBtn = document.getElementById("map-filter-user");
const mapChannelLabel = document.getElementById("map-channel-label");
const mapChannelSelect = document.getElementById("map-channel-select");
const mapUserLabel = document.getElementById("map-user-label");
const mapUserSelect = document.getElementById("map-user-select");

const channelSelect = document.getElementById("channel-select");
const userSelect = document.getElementById("user-select");
const channelLabel = document.getElementById("channel-label");
const userLabel = document.getElementById("user-label");
const sendModeChannelBtn = document.getElementById("send-mode-channel");
const sendModeUserBtn = document.getElementById("send-mode-user");
const sendModeBroadcastBtn = document.getElementById("send-mode-broadcast");
const textMessageInput = document.getElementById("text-message");
const sendAsVoiceCheckbox = document.getElementById("send-as-voice");
const sendTextButton = document.getElementById("send-text");
const pttButton = document.getElementById("ptt-button");
const pttStatus = document.getElementById("ptt-status");
const filterOwnCheckbox = document.getElementById("filter-own");
const filterOtherDMsCheckbox = document.getElementById("filter-other-dms");
const filterTextCheckbox = document.getElementById("filter-text");
const viewSummaryBtn = document.getElementById("view-summary");
const viewTranscriptBtn = document.getElementById("view-transcript");
const transmissionStatus = document.getElementById("transmission-status");
const transmissionList = document.getElementById("transmission-list");
const loadMoreButton = document.getElementById("load-more");
const refreshTransmissionsButton = document.getElementById("refresh-transmissions");

// Initialize
apiBaseUrlInput.value = state.apiBaseUrl;
dispatcherEmailInput.value = state.dispatcherEmail;
languageSelect.value = state.language;
alertToneSelect.value = state.alertTone;

// Map state
let locateMap = null;
let locationMarkers = [];

// Audio recording state
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordingStartTime = null;

function saveState() {
  localStorage.setItem("dispatchConsoleApiBaseUrl", state.apiBaseUrl);
  localStorage.setItem("dispatchConsoleEmail", state.dispatcherEmail);
  localStorage.setItem("dispatchConsoleLanguage", state.language);
  localStorage.setItem("dispatchConsoleAlertTone", state.alertTone);
}

function buildHeaders() {
  return {
    "content-type": "application/json",
    "x-tenant-id": state.tenantId,
    "x-user-id": state.dispatcherId,
    "x-role": "DISPATCHER",
    "x-language": state.language
  };
}

async function apiRequest(path, method, body) {
  const response = await fetch(`${state.apiBaseUrl}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

async function dispatcherLogin(email, password) {
  const response = await fetch(`${state.apiBaseUrl}/auth/dispatcher-login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "login failed");
  }

  return response.json();
}

function showApp(isAuthenticated) {
  if (isAuthenticated) {
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    headerControls.classList.remove("hidden");
    dispatcherNameEl.textContent = state.displayName;
    tenantInfoEl.textContent = `Tenant: ${state.tenantId}`;
  } else {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    headerControls.classList.add("hidden");
  }
}

// ==================== Authentication ====================

loginButton.addEventListener("click", async () => {
  const email = dispatcherEmailInput.value.trim();
  const password = dispatcherPasswordInput.value.trim();
  state.apiBaseUrl = apiBaseUrlInput.value.trim();
  state.dispatcherEmail = email;

  if (!state.apiBaseUrl || !email || !password) {
    loginStatus.textContent = "API base URL, email, and password are required.";
    return;
  }

  loginStatus.textContent = "Signing in...";
  saveState();

  try {
    const result = await dispatcherLogin(email, password);
    state.dispatcherId = result.dispatcherId;
    state.displayName = result.displayName;
    state.tenantId = result.tenantId;

    showApp(true);
    loginStatus.textContent = "";
    dispatcherPasswordInput.value = "";

    // Initialize map and load data
    initLocateMap();
    setTimeout(() => {
      if (locateMap) {
        locateMap.invalidateSize();
        loadUserLocations();
      }
    }, 100);

    await Promise.all([loadChannels(), loadUsers(), loadTransmissions()]);
  } catch (error) {
    loginStatus.textContent = `Sign in failed: ${error.message}`;
    showApp(false);
  }
});

logoutButton.addEventListener("click", () => {
  state.dispatcherId = "";
  state.tenantId = "";
  state.displayName = "";
  state.channels = [];
  state.users = [];
  state.transmissions = [];
  state.transmissionsCursor = null;
  showApp(false);
  loginStatus.textContent = "Signed out.";
});

languageSelect.addEventListener("change", () => {
  state.language = languageSelect.value;
  saveState();
  // Reload transmissions with new language
  if (state.tenantId) {
    state.isInitialLoad = true; // Reset to avoid auto-play on language change
    loadTransmissions();
  }
});

alertToneSelect.addEventListener("change", () => {
  state.alertTone = alertToneSelect.value;
  saveState();
  // Play a preview of the selected tone
  if (state.alertTone !== "none") {
    playAlertTone(state.alertTone);
  }
});

// ==================== Alert Tones ====================

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playAlertTone(toneType) {
  return new Promise((resolve) => {
    if (toneType === "none") {
      resolve();
      return;
    }

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (toneType === "chime") {
      // Pleasant two-note chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.value = 880; // A5
      osc2.frequency.value = 1108.73; // C#6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialDecayTo?.(0.01, now + 0.5) || gain.gain.setValueAtTime(0.01, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.4);

      setTimeout(resolve, 500);

    } else if (toneType === "alert") {
      // Two-tone alert (like a notification)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.setValueAtTime(0.4, now + 0.15);
      gain.gain.setValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);

      setTimeout(resolve, 400);

    } else if (toneType === "urgent") {
      // Urgent triple beep
      const playBeep = (startTime, freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.setValueAtTime(0.01, startTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      };

      playBeep(now, 1000);
      playBeep(now + 0.15, 1000);
      playBeep(now + 0.30, 1200);

      setTimeout(resolve, 500);
    } else {
      resolve();
    }
  });
}

// ==================== Send Mode Toggle ====================

sendModeChannelBtn.addEventListener("click", () => {
  state.sendMode = "channel";
  sendModeChannelBtn.classList.add("active");
  sendModeUserBtn.classList.remove("active");
  sendModeBroadcastBtn.classList.remove("active");
  channelLabel.classList.remove("hidden");
  userLabel.classList.add("hidden");
});

sendModeUserBtn.addEventListener("click", () => {
  state.sendMode = "user";
  sendModeUserBtn.classList.add("active");
  sendModeChannelBtn.classList.remove("active");
  sendModeBroadcastBtn.classList.remove("active");
  userLabel.classList.remove("hidden");
  channelLabel.classList.add("hidden");
});

sendModeBroadcastBtn.addEventListener("click", () => {
  state.sendMode = "broadcast";
  sendModeBroadcastBtn.classList.add("active");
  sendModeChannelBtn.classList.remove("active");
  sendModeUserBtn.classList.remove("active");
  channelLabel.classList.add("hidden");
  userLabel.classList.add("hidden");
});

// ==================== Filter Controls ====================

filterOwnCheckbox.addEventListener("change", () => {
  state.showOwnMessages = filterOwnCheckbox.checked;
  renderTransmissions();
});

filterOtherDMsCheckbox.addEventListener("change", () => {
  state.showOtherDMs = filterOtherDMsCheckbox.checked;
  renderTransmissions();
});

filterTextCheckbox.addEventListener("change", () => {
  state.showTextMessages = filterTextCheckbox.checked;
  renderTransmissions();
});

viewSummaryBtn.addEventListener("click", () => {
  state.viewMode = "summary";
  viewSummaryBtn.classList.add("active");
  viewTranscriptBtn.classList.remove("active");
  renderTransmissions();
});

viewTranscriptBtn.addEventListener("click", () => {
  state.viewMode = "transcript";
  viewTranscriptBtn.classList.add("active");
  viewSummaryBtn.classList.remove("active");
  renderTransmissions();
});

// ==================== Map Filter Controls ====================

mapFilterAllBtn.addEventListener("click", () => {
  state.mapFilterMode = "all";
  mapFilterAllBtn.classList.add("active");
  mapFilterChannelBtn.classList.remove("active");
  mapFilterUserBtn.classList.remove("active");
  mapChannelLabel.classList.add("hidden");
  mapUserLabel.classList.add("hidden");
  loadUserLocations();
});

mapFilterChannelBtn.addEventListener("click", () => {
  state.mapFilterMode = "channel";
  mapFilterChannelBtn.classList.add("active");
  mapFilterAllBtn.classList.remove("active");
  mapFilterUserBtn.classList.remove("active");
  mapChannelLabel.classList.remove("hidden");
  mapUserLabel.classList.add("hidden");
  loadUserLocations();
});

mapFilterUserBtn.addEventListener("click", () => {
  state.mapFilterMode = "user";
  mapFilterUserBtn.classList.add("active");
  mapFilterAllBtn.classList.remove("active");
  mapFilterChannelBtn.classList.remove("active");
  mapUserLabel.classList.remove("hidden");
  mapChannelLabel.classList.add("hidden");
  loadUserLocations();
});

mapChannelSelect.addEventListener("change", () => {
  state.mapFilterChannelId = mapChannelSelect.value;
  loadUserLocations();
});

mapUserSelect.addEventListener("change", () => {
  state.mapFilterUserId = mapUserSelect.value;
  loadUserLocations();
});

function populateMapChannelSelect() {
  mapChannelSelect.innerHTML = '<option value="">Select channel...</option>';
  const sortedChannels = [...state.channels].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );
  sortedChannels.forEach((channel) => {
    const option = document.createElement("option");
    option.value = channel.channelId;
    option.textContent = channel.name || channel.channelId;
    if (channel.isShared) {
      option.textContent += ` (shared from ${channel.tenantId})`;
    }
    mapChannelSelect.appendChild(option);
  });
}

function populateMapUserSelect() {
  mapUserSelect.innerHTML = '<option value="">Select user...</option>';
  const sortedUsers = [...state.users]
    .filter(u => u.userId !== state.dispatcherId)
    .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  sortedUsers.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = user.displayName || user.email || user.userId;
    mapUserSelect.appendChild(option);
  });
}

// ==================== Map ====================

function initLocateMap() {
  if (locateMap) return;

  locateMap = L.map(locateMapContainer).setView([39.8283, -98.5795], 4);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(locateMap);
}

function getMarkerColor(presence) {
  switch (presence) {
    case "AVAILABLE":
      return "#22c55e"; // Green
    case "BUSY":
      return "#f97316"; // Orange
    case "DND":
      return "#ef4444"; // Red
    case "OFFLINE":
    default:
      return "#6b7280"; // Gray
  }
}

function getConnectionIcon(pollMode) {
  switch (pollMode) {
    case "WIFI":
      // WiFi icon (three arcs)
      return `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 16.4 10.6 16 12 16s2.6.4 3.5 1.1l1.4-1.4c-1.3-1.1-3-1.7-4.9-1.7s-3.6.6-4.9 1.7zm-2.8-2.8l1.4 1.4C7.3 12.9 9.5 12 12 12s4.7.9 6.3 2.3l1.4-1.4C17.6 11.1 14.9 10 12 10s-5.6 1.1-7.7 2.9zM1.5 10l1.4 1.4C5.1 9.3 8.4 8 12 8s6.9 1.3 9.1 3.4L22.5 10C19.8 7.3 16.1 6 12 6s-7.8 1.3-10.5 4z"/>
      </svg>`;
    case "SAT":
      // Satellite icon
      return `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        <path d="M4.93 4.93l1.41 1.41C4.23 8.45 3 10.6 3 13c0 2.4 1.23 4.55 3.34 6.66l-1.41 1.41C2.45 18.59 1 15.96 1 13s1.45-5.59 3.93-8.07z"/>
        <path d="M19.07 4.93C21.55 7.41 23 10.04 23 13s-1.45 5.59-3.93 8.07l-1.41-1.41C19.77 17.55 21 15.4 21 13c0-2.4-1.23-4.55-3.34-6.66l1.41-1.41z"/>
      </svg>`;
    case "CELL":
    default:
      // Cell signal icon (bars)
      return `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M2 22h4V12H2v10zm6 0h4V8H8v14zm6 0h4V2h-4v20z"/>
      </svg>`;
  }
}

function createMarkerIcon(color, pollMode) {
  const icon = getConnectionIcon(pollMode);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px;
      height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">${icon}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

async function loadUserLocations() {
  try {
    locateStatus.textContent = "Loading user locations...";

    const data = await apiRequest("/user-locations", "GET");

    // Clear existing markers
    locationMarkers.forEach((marker) => locateMap.removeLayer(marker));
    locationMarkers = [];

    let usersWithLocation = (data.userLocations ?? []).filter(
      (u) => u.latitude && u.longitude
    );
    const usersWithoutLocation = (data.userLocations ?? []).filter(
      (u) => !u.latitude || !u.longitude
    );

    // Apply map filter
    if (state.mapFilterMode === "channel" && state.mapFilterChannelId) {
      usersWithLocation = usersWithLocation.filter(
        (u) => (u.pollingChannelIds || []).includes(state.mapFilterChannelId)
      );
    } else if (state.mapFilterMode === "user" && state.mapFilterUserId) {
      usersWithLocation = usersWithLocation.filter(
        (u) => u.userId === state.mapFilterUserId
      );
    }

    if (usersWithLocation.length === 0) {
      let msg = "No users to display";
      if (state.mapFilterMode === "channel" && state.mapFilterChannelId) {
        const ch = state.channels.find(c => c.channelId === state.mapFilterChannelId);
        msg = `No users currently on #${ch?.name || state.mapFilterChannelId}`;
      } else if (state.mapFilterMode === "user" && state.mapFilterUserId) {
        const u = state.users.find(u => u.userId === state.mapFilterUserId);
        msg = `${u?.displayName || "User"} has no location data`;
      } else {
        msg = `No location data. ${usersWithoutLocation.length} users have no recorded transmissions.`;
      }
      locateStatus.textContent = msg;
      return;
    }

    const bounds = [];
    usersWithLocation.forEach((user) => {
      const presence = user.presence || "OFFLINE";
      const color = getMarkerColor(presence);
      const pollMode = user.pollMode || null;
      const marker = L.marker([user.latitude, user.longitude], {
        icon: createMarkerIcon(color, pollMode)
      });

      const lastSeenStr = user.lastSeen
        ? new Date(user.lastSeen).toLocaleString()
        : "Never";

      const presenceLabel = {
        AVAILABLE: "Available",
        BUSY: "Busy",
        DND: "Do Not Disturb",
        OFFLINE: "Offline"
      }[presence] || presence;

      const connectionLabel = {
        WIFI: "WiFi",
        CELL: "Cellular",
        SAT: "Satellite"
      }[pollMode] || "Unknown";

      // Look up channel names from pollingChannelIds array
      const channelNames = (user.pollingChannelIds || []).map(channelId => {
        const channel = state.channels.find(c => c.channelId === channelId);
        return channel ? (channel.name || channelId) : channelId;
      });
      const channelsStr = channelNames.length > 0 ? channelNames.map(n => `#${n}`).join(", ") : null;

      // Format battery level
      const batteryStr = user.batteryLevel !== null && user.batteryLevel !== undefined
        ? `${user.batteryLevel}%`
        : "Unknown";

      marker.bindPopup(`
        <div style="color: #333; min-width: 180px;">
          <strong>${user.displayName}</strong><br>
          <small>${user.email || ""}</small><br>
          <hr style="margin: 8px 0; border-color: #ddd;">
          <strong>Presence:</strong> <span style="color: ${color}; font-weight: bold;">${presenceLabel}</span><br>
          <strong>Connection:</strong> ${connectionLabel}<br>
          <strong>Battery:</strong> ${batteryStr}<br>
          ${channelsStr ? `<strong>Channels:</strong> ${channelsStr}<br>` : ""}
          <strong>Last seen:</strong> ${lastSeenStr}
        </div>
      `);

      marker.addTo(locateMap);
      locationMarkers.push(marker);
      bounds.push([user.latitude, user.longitude]);
    });

    if (bounds.length > 0) {
      locateMap.fitBounds(bounds, { padding: [50, 50] });
    }

    let statusMsg = `Showing ${usersWithLocation.length} user${usersWithLocation.length !== 1 ? 's' : ''}`;
    if (state.mapFilterMode === "channel" && state.mapFilterChannelId) {
      const ch = state.channels.find(c => c.channelId === state.mapFilterChannelId);
      statusMsg += ` on #${ch?.name || state.mapFilterChannelId}`;
    } else if (state.mapFilterMode === "user" && state.mapFilterUserId) {
      // Single user mode, no additional text needed
    } else {
      statusMsg += `. ${usersWithoutLocation.length} without location`;
    }
    locateStatus.textContent = statusMsg;
  } catch (error) {
    locateStatus.textContent = `Failed to load: ${error.message}`;
  }
}

refreshLocationsButton.addEventListener("click", () => {
  loadUserLocations();
});

// ==================== Channels ====================

async function loadChannels() {
  try {
    const data = await apiRequest("/channels?limit=200", "GET");
    state.channels = data.channels ?? [];
    populateChannelSelect();
    populateMapChannelSelect();
  } catch (error) {
    console.error("Failed to load channels:", error);
  }
}

function populateChannelSelect() {
  channelSelect.innerHTML = '<option value="">Select channel...</option>';

  const sortedChannels = [...state.channels].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  sortedChannels.forEach((channel) => {
    const option = document.createElement("option");
    option.value = channel.channelId;
    option.textContent = channel.name || channel.channelId;
    if (channel.isShared) {
      option.textContent += ` (shared from ${channel.tenantId})`;
    }
    channelSelect.appendChild(option);
  });
}

// ==================== Users ====================

async function loadUsers() {
  try {
    const data = await apiRequest("/users?limit=200", "GET");
    state.users = data.users ?? [];
    populateUserSelect();
    populateMapUserSelect();
  } catch (error) {
    console.error("Failed to load users:", error);
  }
}

function populateUserSelect() {
  userSelect.innerHTML = '<option value="">Select user...</option>';

  const sortedUsers = [...state.users]
    .filter(u => u.userId !== state.dispatcherId) // Exclude self
    .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));

  sortedUsers.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = user.displayName || user.email || user.userId;
    userSelect.appendChild(option);
  });
}

// ==================== Transmissions ====================

// Helper to check if a transmission should be visible based on filters
function isTransmissionVisible(tx) {
  // Check if it's a text message
  const isTextMessage = tx.mimeType === "text/plain";
  if (isTextMessage && !state.showTextMessages) {
    return false;
  }

  // Check if it's the dispatcher's own message
  if (tx.senderId === state.dispatcherId) {
    return state.showOwnMessages;
  }

  // Check if it's a DM between other users (not involving dispatcher)
  // DMs have channelName starting with "DM:" and channel is a user ID
  const isDM = tx.channelName?.startsWith("DM:") ||
               state.users.some(u => u.userId === tx.channelId);

  if (isDM) {
    // Check if dispatcher is involved (either as sender or recipient)
    const dispatcherInvolved = tx.senderId === state.dispatcherId ||
                                tx.channelId === state.dispatcherId;
    if (!dispatcherInvolved) {
      return state.showOtherDMs;
    }
  }

  return true;
}

// Auto-play queue management
async function playNextInQueue() {
  if (state.isPlayingQueue || state.audioQueue.length === 0) {
    return;
  }

  state.isPlayingQueue = true;
  const tx = state.audioQueue.shift();

  if (!tx) {
    state.isPlayingQueue = false;
    playNextInQueue();
    return;
  }

  // If sender language differs from user language, fetch translated audio via getDownloadUrl
  let audioUrl = tx.audioUrl;
  if (tx.senderLanguage && tx.senderLanguage !== state.language) {
    try {
      const params = new URLSearchParams({
        messageId: tx.messageId,
        channelId: tx.channelId
      });
      const response = await fetch(`${state.apiBaseUrl}/download-url?${params.toString()}`, {
        headers: buildHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          audioUrl = data.downloadUrl;
          console.log(`[AutoPlay] Got translated audio for ${tx.messageId}`);
        }
      }
    } catch (e) {
      console.error("Failed to get translated audio URL:", e);
    }
  }

  if (!audioUrl) {
    state.isPlayingQueue = false;
    playNextInQueue();
    return;
  }

  // Mark as played immediately to prevent duplicate queueing
  state.playedMessageIds.add(tx.messageId);

  // Play alert tone for elevated messages
  const isElevated = tx.elevationMatched || tx.isElevationCopy;
  if (isElevated && state.alertTone !== "none") {
    await playAlertTone(state.alertTone);
  }

  // Highlight the transmission being played
  const txElement = document.querySelector(`[data-message-id="${tx.messageId}"]`);
  if (txElement) {
    txElement.classList.add("playing");
    txElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  transmissionStatus.textContent = `Playing: ${tx.senderName} on #${tx.channelName}`;

  const audio = new Audio(audioUrl);

  audio.onended = () => {
    if (txElement) {
      txElement.classList.remove("playing");
    }
    state.isPlayingQueue = false;

    if (state.audioQueue.length > 0) {
      transmissionStatus.textContent = `${state.audioQueue.length} transmission(s) queued`;
    } else {
      transmissionStatus.textContent = `${state.transmissions.length} transmissions`;
    }

    playNextInQueue();
  };

  audio.onerror = () => {
    console.error("Failed to play audio:", tx.messageId);
    if (txElement) {
      txElement.classList.remove("playing");
    }
    state.isPlayingQueue = false;
    playNextInQueue();
  };

  try {
    await audio.play();
  } catch (error) {
    console.error("Auto-play blocked:", error);
    // Browser blocked auto-play
    if (txElement) {
      txElement.classList.remove("playing");
    }
    state.isPlayingQueue = false;
    transmissionStatus.textContent = "Auto-play blocked by browser. Click to enable.";
  }
}

async function loadTransmissions(append = false) {
  try {
    transmissionStatus.textContent = "Loading transmissions...";

    const params = new URLSearchParams();
    params.set("limit", "50");
    params.set("includeText", "true");
    if (append && state.transmissionsCursor) {
      params.set("cursor", state.transmissionsCursor);
    }

    const data = await apiRequest(`/transmissions?${params.toString()}`, "GET");
    const newTransmissions = data.transmissions ?? [];

    // Find new audio transmissions to auto-play (skip filtered messages)
    if (!state.isInitialLoad && !append) {
      const newAudioToPlay = newTransmissions.filter(tx =>
        tx.audioUrl &&
        !state.playedMessageIds.has(tx.messageId) &&
        tx.senderId !== state.dispatcherId &&
        isTransmissionVisible(tx)
      );

      // Sort by creation time (oldest first for queue)
      newAudioToPlay.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));

      // Add to queue
      newAudioToPlay.forEach(tx => {
        if (!state.audioQueue.find(q => q.messageId === tx.messageId)) {
          state.audioQueue.push(tx);
        }
      });

      // Start playing if not already
      if (state.audioQueue.length > 0) {
        playNextInQueue();
      }
    }

    // Mark all current transmissions as "seen" on initial load
    if (state.isInitialLoad) {
      newTransmissions.forEach(tx => {
        state.playedMessageIds.add(tx.messageId);
      });
      state.isInitialLoad = false;
    }

    if (append) {
      state.transmissions = [...state.transmissions, ...newTransmissions];
    } else {
      state.transmissions = newTransmissions;
    }
    state.transmissionsCursor = data.nextCursor;

    renderTransmissions();

    if (state.audioQueue.length > 0) {
      transmissionStatus.textContent = `${state.audioQueue.length} transmission(s) queued`;
    } else {
      transmissionStatus.textContent = `${state.transmissions.length} transmissions`;
    }

    loadMoreButton.style.display = state.transmissionsCursor ? "inline-block" : "none";
  } catch (error) {
    transmissionStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function renderTransmissions() {
  transmissionList.innerHTML = "";

  if (!state.transmissions.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "No transmissions yet.";
    transmissionList.appendChild(empty);
    return;
  }

  state.transmissions.forEach((tx) => {
    const item = document.createElement("div");
    const visible = isTransmissionVisible(tx);
    const isElevatedItem = tx.elevationMatched || tx.isElevationCopy;
    item.className = visible
      ? (isElevatedItem ? "transmission-item elevated" : "transmission-item")
      : "transmission-item filtered";
    item.setAttribute("data-message-id", tx.messageId);

    const time = tx.createdAt
      ? new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "N/A";
    const date = tx.createdAt
      ? new Date(tx.createdAt).toLocaleDateString()
      : "";
    const sender = tx.senderName || tx.senderId || "Unknown";
    const channel = tx.channelName || tx.channelId || "Unknown";
    const isTextMessage = tx.mimeType === "text/plain";

    // Determine which text to show based on view mode and message type
    let displayText;
    let fullText;
    if (isTextMessage) {
      displayText = tx.textContent || "(No content)";
      fullText = displayText;
    } else {
      // Audio message - use summary or transcript based on viewMode
      const summaryText = tx.summaryText || "";
      const transcriptText = tx.transcriptText || "";
      displayText = state.viewMode === "summary"
        ? (summaryText || transcriptText || "(No transcript)")
        : (transcriptText || summaryText || "(No transcript)");
      fullText = transcriptText || summaryText || "(No transcript)";
    }
    const summary = displayText;
    const location =
      tx.latitude && tx.longitude
        ? `${tx.latitude.toFixed(4)}, ${tx.longitude.toFixed(4)}`
        : "";

    // Show "NEW" indicator for unplayed audio messages
    const isNew = tx.audioUrl && !state.playedMessageIds.has(tx.messageId);
    const newBadge = isNew ? '<span class="new-badge">NEW</span>' : '';

    // Show elevation badge for matched transmissions
    const isElevated = tx.elevationMatched || tx.isElevationCopy;
    const elevationBadge = isElevated ? '<span class="elevation-badge">ELEVATED</span>' : '';

    // Show message type indicator
    const typeIndicator = isTextMessage
      ? '<span class="type-badge text">TEXT</span>'
      : '<span class="type-badge audio">AUDIO</span>';

    let audioHtml = "";
    if (tx.audioUrl) {
      audioHtml = `<audio controls preload="none" src="${tx.audioUrl}"></audio>`;
    }

    // Reply PTT button (only show if sender is not self)
    const replyBtn = tx.senderId !== state.dispatcherId
      ? `<button class="reply-ptt" data-user-id="${tx.senderId}" data-user-name="${sender}" title="Reply to ${sender}">
           <span class="reply-ptt-icon"></span>
         </button>`
      : '';

    // Escape HTML for data attribute
    const escapedFullText = fullText.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const needsExpand = fullText.length > 80;

    item.innerHTML = `
      <div class="time">
        <div>${time}</div>
        <div class="hint">${date}</div>
      </div>
      <div class="content">
        <div class="sender">${sender} ${typeIndicator} ${newBadge} ${elevationBadge}</div>
        <div class="channel">#${channel}</div>
        <div class="summary" data-full-text="${escapedFullText}" data-short-text="${summary.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}">${summary}${needsExpand ? ' <span class="expand-icon">▼</span>' : ''}</div>
        ${location ? `<div class="location">${location}</div>` : ""}
      </div>
      <div class="actions">
        ${replyBtn}
        ${audioHtml}
      </div>
    `;

    transmissionList.appendChild(item);
  });

  // Add click handlers for expanding summaries
  transmissionList.querySelectorAll('.summary').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = el.classList.contains('expanded');
      const fullText = el.dataset.fullText;
      const shortText = el.dataset.shortText;
      const needsExpand = fullText && fullText.length > 80;

      if (isExpanded) {
        el.classList.remove('expanded');
        el.innerHTML = shortText + (needsExpand ? ' <span class="expand-icon">▼</span>' : '');
      } else {
        el.classList.add('expanded');
        el.innerHTML = fullText + (needsExpand ? ' <span class="expand-icon">▲</span>' : '');
      }
    });
  });

}

// Reply PTT state - using event delegation for reliability
let replyRecorder = null;
let replyStream = null;
let replyChunks = [];
let replyStartTime = null;
let replyTargetUserId = null;
let replyTargetUserName = null;
let replyActiveButton = null;

async function sendReplyAudio(audioBlob, durationMs, targetUserId, targetUserName) {
  console.log(`Sending DM to user: ${targetUserId} (${targetUserName})`);
  transmissionStatus.textContent = `Sending reply to ${targetUserName}...`;

  try {
    const formData = new FormData();
    formData.append("channelId", targetUserId);
    formData.append("durationMs", Math.round(durationMs).toString());
    formData.append("file", audioBlob, "reply.webm");

    const response = await fetch(`${state.apiBaseUrl}/upload-message`, {
      method: "POST",
      headers: {
        "x-tenant-id": state.tenantId,
        "x-user-id": state.dispatcherId,
        "x-role": "DISPATCHER",
        "x-language": state.language
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to send reply");
    }

    console.log(`DM sent successfully to ${targetUserName}`);
    transmissionStatus.textContent = `Reply sent to ${targetUserName}!`;
    setTimeout(() => loadTransmissions(), 500);
  } catch (error) {
    console.error("Failed to send reply:", error);
    transmissionStatus.textContent = `Failed to send reply: ${error.message}`;
  }
}

async function startReplyRecording(btn) {
  if (replyRecorder && replyRecorder.state === "recording") {
    console.log("Already recording reply, ignoring");
    return;
  }

  const userId = btn.dataset.userId;
  const userName = btn.dataset.userName;

  if (!userId) {
    console.error("No user ID on reply button");
    return;
  }

  console.log(`Starting reply recording to ${userName} (${userId})`);
  replyTargetUserId = userId;
  replyTargetUserName = userName;
  replyActiveButton = btn;

  try {
    replyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    replyRecorder = new MediaRecorder(replyStream, { mimeType: "audio/webm" });
    replyChunks = [];
    replyStartTime = Date.now();

    replyRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        replyChunks.push(event.data);
      }
    };

    replyRecorder.onstop = async () => {
      // Release microphone
      if (replyStream) {
        replyStream.getTracks().forEach(track => track.stop());
        replyStream = null;
      }

      const duration = Date.now() - replyStartTime;
      const audioBlob = new Blob(replyChunks, { type: "audio/webm" });
      replyChunks = [];

      console.log(`Reply recording stopped. Duration: ${duration}ms, Size: ${audioBlob.size}`);

      // Clear button state
      if (replyActiveButton) {
        replyActiveButton.classList.remove("recording");
      }

      if (audioBlob.size > 0 && duration > 200) {
        await sendReplyAudio(audioBlob, duration, replyTargetUserId, replyTargetUserName);
      } else {
        console.log("Recording too short, not sending");
        transmissionStatus.textContent = "Recording too short";
      }

      replyRecorder = null;
      replyActiveButton = null;
    };

    replyRecorder.onerror = (e) => {
      console.error("Reply recorder error:", e);
      if (replyStream) {
        replyStream.getTracks().forEach(track => track.stop());
        replyStream = null;
      }
      if (replyActiveButton) {
        replyActiveButton.classList.remove("recording");
      }
      replyRecorder = null;
      replyActiveButton = null;
    };

    replyRecorder.start();
    btn.classList.add("recording");
    transmissionStatus.textContent = `Recording reply to ${userName}...`;

  } catch (error) {
    console.error("Failed to start reply recording:", error);
    transmissionStatus.textContent = "Microphone access denied";
    replyRecorder = null;
    replyActiveButton = null;
  }
}

function stopReplyRecording() {
  if (replyRecorder && replyRecorder.state === "recording") {
    console.log("Stopping reply recording");
    replyRecorder.stop();
  }
}

// Event delegation for reply PTT buttons - attached once, works for all renders
transmissionList.addEventListener("mousedown", (e) => {
  const btn = e.target.closest(".reply-ptt");
  if (btn) {
    e.preventDefault();
    startReplyRecording(btn);
  }
});

transmissionList.addEventListener("mouseup", (e) => {
  if (replyActiveButton) {
    stopReplyRecording();
  }
});

transmissionList.addEventListener("mouseleave", (e) => {
  if (replyActiveButton) {
    stopReplyRecording();
  }
});

// Touch support
transmissionList.addEventListener("touchstart", (e) => {
  const btn = e.target.closest(".reply-ptt");
  if (btn) {
    e.preventDefault();
    startReplyRecording(btn);
  }
});

transmissionList.addEventListener("touchend", (e) => {
  if (replyActiveButton) {
    e.preventDefault();
    stopReplyRecording();
  }
});

refreshTransmissionsButton.addEventListener("click", () => {
  loadTransmissions();
});

loadMoreButton.addEventListener("click", () => {
  loadTransmissions(true);
});

// Auto-refresh transmissions every 10 seconds
setInterval(() => {
  if (state.tenantId) {
    loadTransmissions();
    loadUserLocations();
  }
}, 10000);

// ==================== Send Text Message ====================

sendTextButton.addEventListener("click", async () => {
  const textContent = textMessageInput.value.trim();

  // Determine target based on send mode
  let targetId = null;
  if (state.sendMode === "channel") {
    targetId = channelSelect.value;
    if (!targetId) {
      transmissionStatus.textContent = "Please select a channel.";
      return;
    }
  } else if (state.sendMode === "user") {
    targetId = userSelect.value;
    if (!targetId) {
      transmissionStatus.textContent = "Please select a user.";
      return;
    }
  }
  // For broadcast mode, targetId stays null

  if (!textContent) {
    transmissionStatus.textContent = "Please enter a message.";
    return;
  }

  sendTextButton.disabled = true;
  transmissionStatus.textContent = state.sendMode === "broadcast"
    ? "Broadcasting to all users..."
    : "Sending...";

  try {
    const formData = new FormData();
    if (targetId) {
      formData.append("channelId", targetId);
    }
    formData.append("textContent", textContent);
    formData.append("mimeType", "text/plain");

    // If "Send as voice" is checked, request TTS generation
    if (sendAsVoiceCheckbox.checked) {
      formData.append("generateTts", "true");
    }

    // If broadcast mode, add broadcast flag
    if (state.sendMode === "broadcast") {
      formData.append("broadcast", "true");
    }

    const response = await fetch(`${state.apiBaseUrl}/upload-message`, {
      method: "POST",
      headers: {
        "x-tenant-id": state.tenantId,
        "x-user-id": state.dispatcherId,
        "x-role": "DISPATCHER",
        "x-language": state.language
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to send message");
    }

    textMessageInput.value = "";
    const result = await response.json();
    transmissionStatus.textContent = state.sendMode === "broadcast"
      ? `Broadcast sent to ${result.recipientCount || 'all'} users!`
      : "Message sent!";

    // Reload transmissions to see the new message
    setTimeout(() => loadTransmissions(), 500);
  } catch (error) {
    transmissionStatus.textContent = `Failed to send: ${error.message}`;
  } finally {
    sendTextButton.disabled = false;
  }
});

// ==================== Push to Talk ====================

async function initAudioRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const duration = Date.now() - recordingStartTime;
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];

      await sendAudioMessage(audioBlob, duration);
    };

    return true;
  } catch (error) {
    console.error("Failed to get microphone access:", error);
    pttStatus.textContent = "Microphone access denied";
    return false;
  }
}

async function sendAudioMessage(audioBlob, durationMs) {
  // Determine target based on send mode
  let targetId = null;
  if (state.sendMode === "channel") {
    targetId = channelSelect.value;
    if (!targetId) {
      transmissionStatus.textContent = "Please select a channel.";
      return;
    }
  } else if (state.sendMode === "user") {
    targetId = userSelect.value;
    if (!targetId) {
      transmissionStatus.textContent = "Please select a user.";
      return;
    }
  }
  // For broadcast mode, targetId stays null

  transmissionStatus.textContent = state.sendMode === "broadcast"
    ? "Broadcasting audio to all users..."
    : "Sending audio...";

  try {
    const formData = new FormData();
    if (targetId) {
      formData.append("channelId", targetId);
    }
    formData.append("durationMs", Math.round(durationMs).toString());
    formData.append("file", audioBlob, "recording.webm");

    // If broadcast mode, add broadcast flag
    if (state.sendMode === "broadcast") {
      formData.append("broadcast", "true");
    }

    const response = await fetch(`${state.apiBaseUrl}/upload-message`, {
      method: "POST",
      headers: {
        "x-tenant-id": state.tenantId,
        "x-user-id": state.dispatcherId,
        "x-role": "DISPATCHER",
        "x-language": state.language
      },
      body: formData
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to send audio");
    }

    const result = await response.json();
    transmissionStatus.textContent = state.sendMode === "broadcast"
      ? `Broadcast sent to ${result.recipientCount || 'all'} users!`
      : "Audio sent!";
    setTimeout(() => loadTransmissions(), 500);
  } catch (error) {
    transmissionStatus.textContent = `Failed to send: ${error.message}`;
  }
}

pttButton.addEventListener("mousedown", async () => {
  // For broadcast mode, no target needed
  if (state.sendMode !== "broadcast") {
    const targetId = state.sendMode === "channel" ? channelSelect.value : userSelect.value;
    if (!targetId) {
      pttStatus.textContent = state.sendMode === "channel"
        ? "Select a channel first"
        : "Select a user first";
      return;
    }
  }

  if (!mediaRecorder) {
    const initialized = await initAudioRecording();
    if (!initialized) return;
  }

  if (mediaRecorder.state === "inactive") {
    audioChunks = [];
    recordingStartTime = Date.now();
    mediaRecorder.start();
    isRecording = true;
    pttButton.classList.add("recording");
    pttButton.querySelector(".ptt-label").textContent = "Recording...";
    pttStatus.textContent = "";
  }
});

pttButton.addEventListener("mouseup", () => {
  if (isRecording && mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    isRecording = false;
    pttButton.classList.remove("recording");
    pttButton.querySelector(".ptt-label").textContent = "Push to Talk";
  }
});

pttButton.addEventListener("mouseleave", () => {
  if (isRecording && mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    isRecording = false;
    pttButton.classList.remove("recording");
    pttButton.querySelector(".ptt-label").textContent = "Push to Talk";
  }
});

// Touch support for mobile
pttButton.addEventListener("touchstart", async (e) => {
  e.preventDefault();
  // For broadcast mode, no target needed
  if (state.sendMode !== "broadcast") {
    const targetId = state.sendMode === "channel" ? channelSelect.value : userSelect.value;
    if (!targetId) {
      pttStatus.textContent = state.sendMode === "channel"
        ? "Select a channel first"
        : "Select a user first";
      return;
    }
  }

  if (!mediaRecorder) {
    const initialized = await initAudioRecording();
    if (!initialized) return;
  }

  if (mediaRecorder.state === "inactive") {
    audioChunks = [];
    recordingStartTime = Date.now();
    mediaRecorder.start();
    isRecording = true;
    pttButton.classList.add("recording");
    pttButton.querySelector(".ptt-label").textContent = "Recording...";
    pttStatus.textContent = "";
  }
});

pttButton.addEventListener("touchend", () => {
  if (isRecording && mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    isRecording = false;
    pttButton.classList.remove("recording");
    pttButton.querySelector(".ptt-label").textContent = "Push to Talk";
  }
});

// ==================== BOLO ====================

// BOLO DOM Elements
const boloBtn = document.getElementById("bolo-btn");
const boloModal = document.getElementById("bolo-modal");
const boloClose = document.getElementById("bolo-close");
const boloCurrent = document.getElementById("bolo-current");
const boloCurrentDetails = document.getElementById("bolo-current-details");
const boloClear = document.getElementById("bolo-clear");
const boloForm = document.getElementById("bolo-form");
const boloGroups = document.getElementById("bolo-groups");
const boloCondition = document.getElementById("bolo-condition");
const boloSave = document.getElementById("bolo-save");
const boloStatus = document.getElementById("bolo-status");

// BOLO State
let currentBolo = null;

function populateBoloGroups() {
  boloGroups.innerHTML = "";

  const sortedChannels = [...state.channels].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  sortedChannels.forEach((channel) => {
    const option = document.createElement("option");
    option.value = channel.channelId;
    option.textContent = channel.name || channel.channelId;
    if (channel.isShared) {
      option.textContent += ` (shared)`;
    }
    boloGroups.appendChild(option);
  });
}

function updateBoloButtonState() {
  if (currentBolo && currentBolo.enabled) {
    boloBtn.classList.add("active");
    boloBtn.title = "BOLO Active - Click to manage";
  } else {
    boloBtn.classList.remove("active");
    boloBtn.title = "BOLO - Set up monitoring alert";
  }
}

function renderBoloModal() {
  populateBoloGroups();

  if (currentBolo) {
    // Show current BOLO
    boloCurrent.classList.remove("hidden");

    // Find group names
    const groupNames = (currentBolo.sourceIds || []).map(id => {
      const channel = state.channels.find(c => c.channelId === id);
      return channel ? channel.name : id;
    });

    boloCurrentDetails.innerHTML = `
      <div><strong>Monitoring:</strong> ${groupNames.join(", ") || "None"}</div>
      <div><strong>Condition:</strong> ${currentBolo.conditionText || "(Not set)"}</div>
      <div class="hint">Matching transmissions will be routed to you.</div>
    `;

    // Pre-select groups in the form for editing
    Array.from(boloGroups.options).forEach(opt => {
      opt.selected = (currentBolo.sourceIds || []).includes(opt.value);
    });
    boloCondition.value = currentBolo.conditionText || "";
    boloSave.textContent = "Update BOLO";
  } else {
    // No current BOLO
    boloCurrent.classList.add("hidden");
    boloCondition.value = "";
    Array.from(boloGroups.options).forEach(opt => opt.selected = false);
    boloSave.textContent = "Set BOLO";
  }

  boloStatus.textContent = "";
}

async function loadBolo() {
  try {
    const data = await apiRequest("/bolo", "GET");
    currentBolo = data.bolo || null;
    updateBoloButtonState();
    return currentBolo;
  } catch (error) {
    console.error("Failed to load BOLO:", error);
    currentBolo = null;
    updateBoloButtonState();
    return null;
  }
}

async function saveBolo() {
  const selectedGroups = Array.from(boloGroups.selectedOptions).map(opt => opt.value);
  const condition = boloCondition.value.trim();

  if (selectedGroups.length === 0) {
    boloStatus.textContent = "Select at least one group to monitor.";
    return;
  }

  if (!condition) {
    boloStatus.textContent = "Enter a condition to look for.";
    return;
  }

  boloStatus.textContent = "Saving...";
  boloSave.disabled = true;

  try {
    await apiRequest("/bolo", "PUT", {
      sourceIds: selectedGroups,
      conditionText: condition,
      enabled: true
    });

    await loadBolo();
    boloStatus.textContent = "BOLO saved!";
    renderBoloModal();

    setTimeout(() => {
      boloStatus.textContent = "";
    }, 2000);
  } catch (error) {
    boloStatus.textContent = `Failed: ${error.message}`;
  } finally {
    boloSave.disabled = false;
  }
}

async function clearBolo() {
  if (!confirm("Clear your BOLO alert? You will stop receiving routed transmissions.")) {
    return;
  }

  boloStatus.textContent = "Clearing...";
  boloClear.disabled = true;

  try {
    await apiRequest("/bolo", "DELETE");
    currentBolo = null;
    updateBoloButtonState();
    renderBoloModal();
    boloStatus.textContent = "BOLO cleared.";

    setTimeout(() => {
      boloStatus.textContent = "";
    }, 2000);
  } catch (error) {
    boloStatus.textContent = `Failed: ${error.message}`;
  } finally {
    boloClear.disabled = false;
  }
}

// BOLO Event Listeners
boloBtn.addEventListener("click", async () => {
  boloModal.classList.remove("hidden");
  boloStatus.textContent = "Loading...";

  await loadBolo();
  renderBoloModal();
});

boloClose.addEventListener("click", () => {
  boloModal.classList.add("hidden");
});

boloModal.addEventListener("click", (e) => {
  // Close when clicking outside modal content
  if (e.target === boloModal) {
    boloModal.classList.add("hidden");
  }
});

boloSave.addEventListener("click", saveBolo);
boloClear.addEventListener("click", clearBolo);

// Load BOLO status on login
const originalShowApp = showApp;
showApp = function(isAuthenticated) {
  originalShowApp(isAuthenticated);
  if (isAuthenticated) {
    loadBolo();
  }
};

// Initialize
showApp(false);
