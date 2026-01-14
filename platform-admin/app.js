// State management
const state = {
  apiBaseUrl: localStorage.getItem("apiBaseUrl") || "",
  idToken: null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  cognitoConfig: null,
  tenants: [],
  adminUsers: [],
  adminAssignments: {},
  pricingPlans: [],
  licensePlans: [],
  platformApiKeys: [],
  platformAdminLogs: [],
  adminLogsNextCursor: null
};

// DOM Elements
const apiBaseUrlInput = document.getElementById("api-base-url");
const signInButton = document.getElementById("sign-in-button");
const logoutAppButton = document.getElementById("logout-app");
const refreshButton = document.getElementById("refresh-tenants");
const createTenantButton = document.getElementById("create-tenant");
const tenantNameInput = document.getElementById("tenant-name");
const tenantIdInput = document.getElementById("tenant-id");
const tenantList = document.getElementById("tenant-list");
const connectionStatus = document.getElementById("connection-status");
const loginPanel = document.getElementById("login-panel");
const appPanel = document.getElementById("app-panel");
const userInfo = document.getElementById("user-info");
const tenantSearchInput = document.getElementById("tenant-search");
const tenantStatusFilter = document.getElementById("tenant-status-filter");
const tabTenants = document.getElementById("tab-tenants");
const tabUsers = document.getElementById("tab-users");
const tabPricing = document.getElementById("tab-pricing");
const tabLicense = document.getElementById("tab-license");
const tabApiKeys = document.getElementById("tab-api-keys");
const tabOpenaiKeys = document.getElementById("tab-openai-keys");
const tabTweaks = document.getElementById("tab-tweaks");
const tabAdminLogs = document.getElementById("tab-admin-logs");
const tenantsTab = document.getElementById("tenants-tab");
const usersTab = document.getElementById("users-tab");
const pricingTab = document.getElementById("pricing-tab");
const licenseTab = document.getElementById("license-tab");
const apiKeysTab = document.getElementById("api-keys-tab");
const openaiKeysTab = document.getElementById("openai-keys-tab");
const tweaksTab = document.getElementById("tweaks-tab");
const adminLogsTab = document.getElementById("admin-logs-tab");

// Admin Logs DOM Elements
const adminLogTableBody = document.getElementById("admin-log-table-body");
const adminLogAdminFilter = document.getElementById("admin-log-admin-filter");
const adminLogsStartDate = document.getElementById("admin-logs-start-date");
const adminLogsEndDate = document.getElementById("admin-logs-end-date");
const applyAdminLogFiltersBtn = document.getElementById("apply-admin-log-filters");
const clearAdminLogFiltersBtn = document.getElementById("clear-admin-log-filters");
const refreshAdminLogsButton = document.getElementById("refresh-admin-logs");
const exportAdminLogsButton = document.getElementById("export-admin-logs");
const adminLogsLoadMoreButton = document.getElementById("admin-logs-load-more");
const adminLogStatus = document.getElementById("admin-log-status");

// Pricing Plan DOM Elements
const planNameInput = document.getElementById("plan-name");
const planIsDefaultCheckbox = document.getElementById("plan-is-default");
const planUserCostInput = document.getElementById("plan-user-cost");
const planDispatcherCostInput = document.getElementById("plan-dispatcher-cost");
const planTranscriptionCostInput = document.getElementById("plan-transcription-cost");
const planTranslationCostInput = document.getElementById("plan-translation-cost");
const planElevationCostInput = document.getElementById("plan-elevation-cost");
const planRetentionCostInput = document.getElementById("plan-retention-cost");
const createPricingPlanButton = document.getElementById("create-pricing-plan");
const createPlanStatus = document.getElementById("create-plan-status");
const refreshPricingPlansButton = document.getElementById("refresh-pricing-plans");
const pricingPlanList = document.getElementById("pricing-plan-list");

// License Plan DOM Elements
const licensePlanNameInput = document.getElementById("license-plan-name");
const licenseIsDefaultCheckbox = document.getElementById("license-is-default");
const licenseTranscriptionCheckbox = document.getElementById("license-transcription");
const licenseTranslationCheckbox = document.getElementById("license-translation");
const licenseElevationCheckbox = document.getElementById("license-elevation");
const licenseRetentionCheckbox = document.getElementById("license-retention");
const licenseUnlimitedUsersCheckbox = document.getElementById("license-unlimited-users");
const licenseUserLimitInput = document.getElementById("license-user-limit");
const createLicensePlanButton = document.getElementById("create-license-plan");
const createLicenseStatus = document.getElementById("create-license-status");
const refreshLicensePlansButton = document.getElementById("refresh-license-plans");
const licensePlanList = document.getElementById("license-plan-list");

// Platform API Keys DOM Elements
const platformApiKeysStatus = document.getElementById("platform-api-keys-status");
const platformApiKeyNameInput = document.getElementById("platform-api-key-name");
const platformApiKeyExpirySelect = document.getElementById("platform-api-key-expiry");
const createPlatformApiKeyButton = document.getElementById("create-platform-api-key");
const createPlatformApiKeyStatus = document.getElementById("create-platform-api-key-status");
const platformApiKeyCreatedCard = document.getElementById("platform-api-key-created-card");
const platformApiKeyCreatedValue = document.getElementById("platform-api-key-created-value");
const platformApiKeyCopyButton = document.getElementById("platform-api-key-copy");
const platformApiKeyDismissButton = document.getElementById("platform-api-key-dismiss");
const platformApiKeysList = document.getElementById("platform-api-keys-list");
const refreshPlatformApiKeysButton = document.getElementById("refresh-platform-api-keys");
const platformApiKeyAvailablePerms = document.getElementById("platform-api-key-available-perms");
const platformApiKeySelectedPerms = document.getElementById("platform-api-key-selected-perms");
const platformApiKeyAddPermButton = document.getElementById("platform-api-key-add-perm");
const platformApiKeyRemovePermButton = document.getElementById("platform-api-key-remove-perm");
const platformApiKeyAddAllButton = document.getElementById("platform-api-key-add-all");
const platformApiKeyStatusFilter = document.getElementById("platform-api-key-status-filter");

// Platform API Key Permissions grouped by resource
const PLATFORM_API_KEY_PERMISSION_GROUPS = [
  { group: "Tenants", permissions: [
    { value: "tenants:read", label: "View tenants" },
    { value: "tenants:write", label: "Create, update, delete tenants" }
  ]},
  { group: "Admin Users", permissions: [
    { value: "admin-users:read", label: "View admin users" },
    { value: "admin-users:write", label: "Create, update, delete admin users" }
  ]},
  { group: "Pricing Plans", permissions: [
    { value: "pricing-plans:read", label: "View pricing plans" },
    { value: "pricing-plans:write", label: "Create, update, delete pricing plans" }
  ]},
  { group: "License Plans", permissions: [
    { value: "license-plans:read", label: "View license plans" },
    { value: "license-plans:write", label: "Create, update, delete license plans" }
  ]},
  { group: "OpenAI Keys", permissions: [
    { value: "openai-keys:read", label: "View OpenAI key status" },
    { value: "openai-keys:write", label: "Update OpenAI keys" }
  ]},
  { group: "Platform Settings", permissions: [
    { value: "platform-settings:read", label: "View platform settings" },
    { value: "platform-settings:write", label: "Update platform settings" }
  ]},
  { group: "API Keys", permissions: [
    { value: "api-keys:read", label: "View platform API keys" },
    { value: "api-keys:write", label: "Create, update, revoke API keys" }
  ]}
];

const summarizationPromptInput = document.getElementById("summarization-prompt");
const promptDefaultDisplay = document.getElementById("prompt-default-display");
const promptStatus = document.getElementById("prompt-status");
const savePromptButton = document.getElementById("save-prompt");
const resetPromptButton = document.getElementById("reset-prompt");
const promptFeedback = document.getElementById("prompt-feedback");
const openaiKeyInput = document.getElementById("openai-api-key");
const openaiKeyStatus = document.getElementById("openai-key-status");
const toggleOpenaiKeyButton = document.getElementById("toggle-openai-key");
const saveOpenaiKeyButton = document.getElementById("save-openai-key");
const clearOpenaiKeyButton = document.getElementById("clear-openai-key");
const openaiKeyFeedback = document.getElementById("openai-key-feedback");
const transcriptionKeyInput = document.getElementById("transcription-api-key");
const transcriptionKeyStatus = document.getElementById("transcription-key-status");
const toggleTranscriptionKeyButton = document.getElementById("toggle-transcription-key");
const saveTranscriptionKeyButton = document.getElementById("save-transcription-key");
const clearTranscriptionKeyButton = document.getElementById("clear-transcription-key");
const transcriptionKeyFeedback = document.getElementById("transcription-key-feedback");
const translationKeyInput = document.getElementById("translation-api-key");
const translationKeyStatus = document.getElementById("translation-key-status");
const toggleTranslationKeyButton = document.getElementById("toggle-translation-key");
const saveTranslationKeyButton = document.getElementById("save-translation-key");
const clearTranslationKeyButton = document.getElementById("clear-translation-key");
const translationKeyFeedback = document.getElementById("translation-key-feedback");
const ttsKeyInput = document.getElementById("tts-api-key");
const ttsKeyStatus = document.getElementById("tts-key-status");
const toggleTtsKeyButton = document.getElementById("toggle-tts-key");
const saveTtsKeyButton = document.getElementById("save-tts-key");
const clearTtsKeyButton = document.getElementById("clear-tts-key");
const ttsKeyFeedback = document.getElementById("tts-key-feedback");
const validateAllKeysButton = document.getElementById("validate-all-keys");
const openaiKeyValid = document.getElementById("openai-key-valid");
const transcriptionKeyValid = document.getElementById("transcription-key-valid");
const translationKeyValid = document.getElementById("translation-key-valid");
const ttsKeyValid = document.getElementById("tts-key-valid");
const adminUserNameInput = document.getElementById("admin-user-name");
const adminUserEmailInput = document.getElementById("admin-user-email");
const adminUserStatusSelect = document.getElementById("admin-user-status");
const createAdminUserButton = document.getElementById("create-admin-user");
const adminUserList = document.getElementById("admin-user-list");
const assignmentStatus = document.getElementById("assignment-status");
const adminUserSearchInput = document.getElementById("admin-user-search");
const adminUserStatusFilter = document.getElementById("admin-user-status-filter");

// Initialize inputs
apiBaseUrlInput.value = state.apiBaseUrl;

// State persistence
function saveState() {
  localStorage.setItem("apiBaseUrl", state.apiBaseUrl);
  if (state.refreshToken) {
    localStorage.setItem("refreshToken", state.refreshToken);
  } else {
    localStorage.removeItem("refreshToken");
  }
}

// API request helpers
function buildHeaders() {
  return {
    "content-type": "application/json",
    authorization: state.idToken ? `Bearer ${state.idToken}` : ""
  };
}

async function apiRequest(path, method, body) {
  const response = await fetch(`${state.apiBaseUrl}${path}`, {
    method,
    headers: buildHeaders(),
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await refreshTokens();
    if (refreshed) {
      // Retry request with new token
      const retryResponse = await fetch(`${state.apiBaseUrl}${path}`, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });
      if (!retryResponse.ok) {
        const text = await retryResponse.text();
        throw new Error(text || `Request failed: ${retryResponse.status}`);
      }
      return retryResponse.json();
    }
    // Refresh failed, redirect to login
    handleLogout();
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

// Cognito OAuth Flow
async function loadCognitoConfig() {
  try {
    const response = await fetch(`${state.apiBaseUrl}/auth/config`);
    if (!response.ok) {
      throw new Error("Failed to load auth config");
    }
    state.cognitoConfig = await response.json();
    return true;
  } catch (error) {
    console.error("Failed to load Cognito config:", error);
    return false;
  }
}

function getLoginUrl() {
  if (!state.cognitoConfig) return null;

  const { cognitoDomain, clientId } = state.cognitoConfig;
  const redirectUri = window.location.origin + window.location.pathname;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "email openid profile",
    redirect_uri: redirectUri
  });

  return `${cognitoDomain}/oauth2/authorize?${params.toString()}`;
}

function getLogoutUrl() {
  if (!state.cognitoConfig) return null;

  const { cognitoDomain, clientId } = state.cognitoConfig;
  const redirectUri = window.location.origin + window.location.pathname;

  const params = new URLSearchParams({
    client_id: clientId,
    logout_uri: redirectUri
  });

  return `${cognitoDomain}/logout?${params.toString()}`;
}

async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const error = urlParams.get("error");

  if (error) {
    connectionStatus.textContent = `Login failed: ${error}`;
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  if (!code) return;

  // Clear URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);

  connectionStatus.textContent = "Completing sign in...";

  try {
    const redirectUri = window.location.origin + window.location.pathname;
    const response = await fetch(`${state.apiBaseUrl}/auth/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Token exchange failed");
    }

    const tokens = await response.json();
    state.idToken = tokens.id_token;
    state.refreshToken = tokens.refresh_token;
    saveState();

    // Verify access by loading tenants
    await loadTenants();
  } catch (error) {
    connectionStatus.textContent = `Sign in failed: ${error.message}`;
    handleLogout();
  }
}

async function refreshTokens() {
  if (!state.refreshToken) return false;

  try {
    const response = await fetch(`${state.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: state.refreshToken })
    });

    if (!response.ok) return false;

    const tokens = await response.json();
    state.idToken = tokens.id_token;
    return true;
  } catch {
    return false;
  }
}

function parseIdToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// UI Functions
function showApp(isAuthenticated) {
  if (isAuthenticated) {
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    setActiveTab("tenants");

    // Display user info
    if (state.idToken) {
      const tokenPayload = parseIdToken(state.idToken);
      if (tokenPayload?.email) {
        userInfo.textContent = `Signed in as ${tokenPayload.email}`;
      }
    }
  } else {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    userInfo.textContent = "Tenant management console";
  }
}

function handleLogout() {
  state.idToken = null;
  state.refreshToken = null;
  saveState();
  showApp(false);

  // Redirect to Cognito logout if config is available
  if (state.cognitoConfig) {
    const logoutUrl = getLogoutUrl();
    if (logoutUrl) {
      window.location.href = logoutUrl;
      return;
    }
  }

  connectionStatus.textContent = "Signed out.";
}

function setActiveTab(tab) {
  tabTenants.classList.remove("active");
  tabUsers.classList.remove("active");
  tabPricing.classList.remove("active");
  tabLicense.classList.remove("active");
  tabApiKeys.classList.remove("active");
  tabOpenaiKeys.classList.remove("active");
  tabTweaks.classList.remove("active");
  tabAdminLogs.classList.remove("active");

  tenantsTab.classList.add("hidden");
  usersTab.classList.add("hidden");
  pricingTab.classList.add("hidden");
  licenseTab.classList.add("hidden");
  apiKeysTab.classList.add("hidden");
  openaiKeysTab.classList.add("hidden");
  tweaksTab.classList.add("hidden");
  adminLogsTab.classList.add("hidden");

  // Clear any displayed API key when navigating away
  platformApiKeyCreatedCard.classList.add("hidden");
  platformApiKeyCreatedValue.value = "";

  if (tab === "users") {
    tabUsers.classList.add("active");
    usersTab.classList.remove("hidden");
  } else if (tab === "pricing") {
    tabPricing.classList.add("active");
    pricingTab.classList.remove("hidden");
    loadPricingPlans();
  } else if (tab === "license") {
    tabLicense.classList.add("active");
    licenseTab.classList.remove("hidden");
    loadLicensePlans();
  } else if (tab === "api-keys") {
    tabApiKeys.classList.add("active");
    apiKeysTab.classList.remove("hidden");
    loadPlatformApiKeys();
  } else if (tab === "openai-keys") {
    tabOpenaiKeys.classList.add("active");
    openaiKeysTab.classList.remove("hidden");
    loadPlatformOpenAIKeys();
  } else if (tab === "tweaks") {
    tabTweaks.classList.add("active");
    tweaksTab.classList.remove("hidden");
    loadSummarizationPrompt();
  } else if (tab === "admin-logs") {
    tabAdminLogs.classList.add("active");
    adminLogsTab.classList.remove("hidden");
  } else {
    tabTenants.classList.add("active");
    tenantsTab.classList.remove("hidden");
  }
}

// Tenant management
function renderTenants(tenants) {
  tenantList.innerHTML = "";

  if (!tenants.length) {
    const empty = document.createElement("p");
    empty.textContent = "No tenants yet.";
    empty.className = "hint";
    tenantList.appendChild(empty);
    return;
  }

  // Find plan names for display
  const getPlanName = (planId) => {
    if (!planId) return "Default";
    const plan = state.pricingPlans.find(p => p.planId === planId);
    return plan ? plan.name : "Unknown";
  };

  const getLicensePlanName = (planId) => {
    if (!planId) return "Default";
    const plan = state.licensePlans.find(p => p.planId === planId);
    return plan ? plan.name : "Unknown";
  };

  tenants.forEach((tenant) => {
    const item = document.createElement("div");
    item.className = "tenant-item";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${tenant.name}</strong>
      <div class="hint">ID: ${tenant.tenantId}</div>
      <div class="hint">Created: ${tenant.createdAt ?? "n/a"}</div>
    `;

    const statusWrap = document.createElement("div");
    statusWrap.innerHTML = `
      <span class="hint">Status</span><div><strong>${tenant.status}</strong></div>
      <span class="hint">Pricing</span><div>${getPlanName(tenant.pricingPlanId)}</div>
      <span class="hint">License</span><div>${getLicensePlanName(tenant.licensePlanId)}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    actions.appendChild(editButton);

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);

    const adminPanel = document.createElement("div");
    adminPanel.className = "admin-panel hidden";

    // Build pricing plan options
    const planOptions = state.pricingPlans.map(p =>
      `<option value="${p.planId}"${tenant.pricingPlanId === p.planId ? ' selected' : ''}>${p.name}${p.isDefault ? ' (Default)' : ''}</option>`
    ).join('');

    // Build license plan options
    const licenseOptions = state.licensePlans.map(p =>
      `<option value="${p.planId}"${tenant.licensePlanId === p.planId ? ' selected' : ''}>${p.name}${p.isDefault ? ' (Default)' : ''}</option>`
    ).join('');

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Name
        <input name="tenantName" value="${tenant.name}" />
      </label>
      <label>
        Status
        <select name="tenantStatus">
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="DECOMMISSIONED">DECOMMISSIONED</option>
        </select>
      </label>
      <label>
        Pricing Plan
        <select name="tenantPricingPlan">
          <option value=""${!tenant.pricingPlanId ? ' selected' : ''}>Use Default</option>
          ${planOptions}
        </select>
      </label>
      <label>
        License Plan
        <select name="tenantLicensePlan">
          <option value=""${!tenant.licensePlanId ? ' selected' : ''}>Use Default</option>
          ${licenseOptions}
        </select>
      </label>
    `;
    const statusSelect = editForm.querySelector("select[name='tenantStatus']");
    statusSelect.value = tenant.status;

    const editActions = document.createElement("div");
    editActions.className = "row";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const editFeedback = document.createElement("div");
    editFeedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const name = editForm.querySelector("input[name='tenantName']").value.trim();
      const status = statusSelect.value;
      const pricingPlanSelect = editForm.querySelector("select[name='tenantPricingPlan']");
      const pricingPlanId = pricingPlanSelect.value || null;
      const licensePlanSelect = editForm.querySelector("select[name='tenantLicensePlan']");
      const licensePlanId = licensePlanSelect.value || null;
      editFeedback.textContent = "Saving...";
      try {
        await apiRequest(`/tenants/${tenant.tenantId}`, "PATCH", {
          name: name || undefined,
          status,
          pricingPlanId,
          licensePlanId
        });
        editFeedback.textContent = "Saved.";
        await loadTenants();
      } catch (error) {
        editFeedback.textContent = `Save failed: ${error.message}`;
      }
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(editFeedback);

    adminPanel.appendChild(editForm);
    adminPanel.appendChild(editActions);

    editButton.addEventListener("click", () => {
      adminPanel.classList.toggle("hidden");
    });

    item.appendChild(adminPanel);
    tenantList.appendChild(item);
  });
}

function getFilteredTenants(tenants) {
  const query = tenantSearchInput.value.trim().toLowerCase();
  const status = tenantStatusFilter.value;

  return tenants
    .filter((tenant) => {
      const matchesName = query.length === 0 || tenant.name.toLowerCase().includes(query);
      const matchesStatus = status === "ALL" || tenant.status === status;
      return matchesName && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

async function loadTenants() {
  try {
    connectionStatus.textContent = "Loading...";
    // Load tenants, pricing plans, and license plans in parallel
    const [tenantsData, plansData, licensesData] = await Promise.all([
      apiRequest("/tenants", "GET"),
      apiRequest("/pricing-plans", "GET").catch(() => ({ plans: [] })),
      apiRequest("/license-plans", "GET").catch(() => ({ plans: [] }))
    ]);
    state.tenants = tenantsData.tenants ?? [];
    state.pricingPlans = plansData.plans ?? [];
    state.licensePlans = licensesData.plans ?? [];
    renderTenants(getFilteredTenants(state.tenants));
    connectionStatus.textContent = "Connected.";
    showApp(true);
    await loadAdminUsers();
  } catch (error) {
    tenantList.innerHTML = "";
    const err = document.createElement("p");
    err.textContent = `Failed to load tenants: ${error.message}`;
    err.className = "hint";
    tenantList.appendChild(err);
    connectionStatus.textContent = "Connection failed.";
    showApp(false);
  }
}

// Admin user management
async function loadAdminUsers() {
  try {
    const data = await apiRequest("/admin-users", "GET");
    state.adminUsers = data.users ?? [];
    renderAdminUsers(getFilteredAdminUsers(state.adminUsers));
  } catch (error) {
    assignmentStatus.textContent = `Failed to load admin users: ${error.message}`;
  }
}

async function loadAssignmentsForUser(adminId) {
  assignmentStatus.textContent = "Loading assignments...";
  try {
    const data = await apiRequest(`/admin-assignments?adminId=${encodeURIComponent(adminId)}`, "GET");
    state.adminAssignments[adminId] = data.assignments ?? [];
    assignmentStatus.textContent = "";
  } catch (error) {
    assignmentStatus.textContent = `Failed to load assignments: ${error.message}`;
  }
}

function renderAssignmentLists(adminId, availableSelect, assignedSelect) {
  const assigned = new Set(
    (state.adminAssignments[adminId] ?? []).map((assignment) => assignment.tenantId)
  );
  const availableTenants = state.tenants.filter((tenant) => !assigned.has(tenant.tenantId));
  const assignedTenants = state.tenants.filter((tenant) => assigned.has(tenant.tenantId));

  availableSelect.innerHTML = "";
  assignedSelect.innerHTML = "";

  availableTenants.forEach((tenant) => {
    const option = document.createElement("option");
    option.value = tenant.tenantId;
    option.textContent = `${tenant.name} (${tenant.tenantId})`;
    availableSelect.appendChild(option);
  });

  assignedTenants.forEach((tenant) => {
    const option = document.createElement("option");
    option.value = tenant.tenantId;
    option.textContent = `${tenant.name} (${tenant.tenantId})`;
    assignedSelect.appendChild(option);
  });
}

async function assignAdminToTenant(adminId, tenantId) {
  await apiRequest("/admin-assignments", "POST", { adminId, tenantId });
}

async function removeAdminAssignment(adminId, tenantId) {
  await apiRequest("/admin-assignments", "DELETE", { adminId, tenantId });
}

async function updateAdminUser(adminId, updates, feedback) {
  try {
    await apiRequest(`/admin-users/${adminId}`, "PATCH", updates);
    feedback.textContent = "Saved.";
  } catch (error) {
    feedback.textContent = `Save failed: ${error.message}`;
  }
}

async function deleteAdminUser(adminId) {
  await apiRequest(`/admin-users/${adminId}`, "DELETE");
}

function getFilteredAdminUsers(users) {
  const query = adminUserSearchInput.value.trim().toLowerCase();
  const status = adminUserStatusFilter.value;

  return users
    .filter((user) => {
      const matchesQuery =
        query.length === 0 ||
        user.displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesStatus = status === "ALL" || user.status === status;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "en", { sensitivity: "base" }));
}

function renderAdminUsers(users) {
  adminUserList.innerHTML = "";

  if (!users.length) {
    const empty = document.createElement("p");
    empty.textContent = "No admin users yet.";
    empty.className = "hint";
    adminUserList.appendChild(empty);
    return;
  }

  users.forEach((user) => {
    const item = document.createElement("div");
    item.className = "user-item";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${user.displayName}</strong>
      <div class="hint">${user.email}</div>
      <div class="hint">ID: ${user.userId}</div>
    `;

    const statusWrap = document.createElement("div");
    statusWrap.innerHTML = `<span class="hint">Status</span><div><strong>${user.status}</strong></div>`;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "danger";
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);

    const panel = document.createElement("div");
    panel.className = "user-panel hidden";

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Status
        <select name="adminStatus">
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </label>
    `;
    const statusSelect = editForm.querySelector("select[name='adminStatus']");
    statusSelect.value = user.status;

    const editActions = document.createElement("div");
    editActions.className = "row";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const feedback = document.createElement("div");
    feedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const updates = { status: statusSelect.value };
      feedback.textContent = "Saving...";
      await updateAdminUser(user.userId, updates, feedback);
      await loadAdminUsers();
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(feedback);

    const assignmentGrid = document.createElement("div");
    assignmentGrid.className = "assignment-grid";
    assignmentGrid.innerHTML = `
      <div>
        <h3>Available Tenants</h3>
        <select class="available-tenants" multiple size="10"></select>
      </div>
      <div class="assignment-actions">
        <button class="assign-tenant">Assign &gt;&gt;</button>
        <button class="remove-tenant secondary">&lt;&lt; Remove</button>
      </div>
      <div>
        <h3>Assigned Tenants</h3>
        <select class="assigned-tenants" multiple size="10"></select>
      </div>
    `;
    const availableSelect = assignmentGrid.querySelector(".available-tenants");
    const assignedSelect = assignmentGrid.querySelector(".assigned-tenants");
    const assignButton = assignmentGrid.querySelector(".assign-tenant");
    const removeButton = assignmentGrid.querySelector(".remove-tenant");

    assignButton.addEventListener("click", async () => {
      const selected = Array.from(availableSelect.selectedOptions).map((opt) => opt.value);
      if (!selected.length) {
        return;
      }
      feedback.textContent = "Assigning...";
      for (const tenantId of selected) {
        await assignAdminToTenant(user.userId, tenantId);
      }
      await loadAssignmentsForUser(user.userId);
      renderAssignmentLists(user.userId, availableSelect, assignedSelect);
      feedback.textContent = "";
    });

    removeButton.addEventListener("click", async () => {
      const selected = Array.from(assignedSelect.selectedOptions).map((opt) => opt.value);
      if (!selected.length) {
        return;
      }
      feedback.textContent = "Removing...";
      for (const tenantId of selected) {
        await removeAdminAssignment(user.userId, tenantId);
      }
      await loadAssignmentsForUser(user.userId);
      renderAssignmentLists(user.userId, availableSelect, assignedSelect);
      feedback.textContent = "";
    });

    panel.appendChild(editForm);
    panel.appendChild(editActions);
    panel.appendChild(assignmentGrid);

    editButton.addEventListener("click", async () => {
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) {
        await loadAssignmentsForUser(user.userId);
        renderAssignmentLists(user.userId, availableSelect, assignedSelect);
      }
    });

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Delete ${user.displayName} (${user.email})? This removes all assignments.`
      );
      if (!confirmed) {
        return;
      }
      feedback.textContent = "Deleting...";
      try {
        await deleteAdminUser(user.userId);
        delete state.adminAssignments[user.userId];
        feedback.textContent = "Deleted.";
        await loadAdminUsers();
      } catch (error) {
        feedback.textContent = `Delete failed: ${error.message}`;
      }
    });

    item.appendChild(panel);
    adminUserList.appendChild(item);
  });
}

// Platform OpenAI Keys Functions
async function loadPlatformOpenAIKeys() {
  // Reset all feedback and set loading state
  const keyConfigs = [
    { status: openaiKeyStatus, feedback: openaiKeyFeedback, input: openaiKeyInput },
    { status: transcriptionKeyStatus, feedback: transcriptionKeyFeedback, input: transcriptionKeyInput },
    { status: translationKeyStatus, feedback: translationKeyFeedback, input: translationKeyInput },
    { status: ttsKeyStatus, feedback: ttsKeyFeedback, input: ttsKeyInput }
  ];

  keyConfigs.forEach(({ status, feedback }) => {
    feedback.textContent = "";
    status.textContent = "Loading...";
    status.className = "status-badge";
  });

  try {
    const data = await apiRequest("/platform-keys", "GET");

    // Helper to update key UI
    const updateKeyUI = (keyData, statusEl, inputEl) => {
      if (keyData?.configured) {
        statusEl.textContent = "Configured";
        statusEl.className = "status-badge configured";
        inputEl.placeholder = keyData.preview || "sk-...";
      } else {
        statusEl.textContent = "Not Configured";
        statusEl.className = "status-badge not-configured";
        inputEl.placeholder = "sk-...";
      }
      inputEl.value = "";
    };

    updateKeyUI(data.keys?.openai, openaiKeyStatus, openaiKeyInput);
    updateKeyUI(data.keys?.openaiTranscription, transcriptionKeyStatus, transcriptionKeyInput);
    updateKeyUI(data.keys?.openaiTranslation, translationKeyStatus, translationKeyInput);
    updateKeyUI(data.keys?.openaiTts, ttsKeyStatus, ttsKeyInput);

    // Automatically validate keys after loading
    validatePlatformKeys();
  } catch (error) {
    keyConfigs.forEach(({ status, feedback }) => {
      status.textContent = "Error";
      status.className = "status-badge error";
    });
    openaiKeyFeedback.textContent = `Failed to load: ${error.message}`;
  }
}

async function savePlatformKey(keyType, keyValue) {
  const body = {};
  switch (keyType) {
    case "openai":
      body.openaiApiKey = keyValue;
      break;
    case "transcription":
      body.openaiTranscriptionKey = keyValue;
      break;
    case "translation":
      body.openaiTranslationKey = keyValue;
      break;
    case "tts":
      body.openaiTtsKey = keyValue;
      break;
    default:
      throw new Error(`Unknown key type: ${keyType}`);
  }

  await apiRequest("/platform-keys", "PUT", body);
}

async function validatePlatformKeys() {
  // Set all validation badges to "Validating..."
  const validationEls = [openaiKeyValid, transcriptionKeyValid, translationKeyValid, ttsKeyValid];
  validationEls.forEach(el => {
    el.textContent = "Validating...";
    el.className = "status-badge";
  });

  try {
    const data = await apiRequest("/platform-keys/validate", "POST");

    // Helper to update validation UI
    const updateValidationUI = (keyData, validEl) => {
      if (!keyData?.configured) {
        validEl.textContent = "";
        validEl.className = "status-badge";
      } else if (keyData.valid === true) {
        validEl.textContent = "Active";
        validEl.className = "status-badge valid";
      } else if (keyData.valid === false) {
        validEl.textContent = "Invalid";
        validEl.className = "status-badge error";
        validEl.title = keyData.error || "Key validation failed";
      } else {
        validEl.textContent = "";
        validEl.className = "status-badge";
      }
    };

    updateValidationUI(data.keys?.openai, openaiKeyValid);
    updateValidationUI(data.keys?.openaiTranscription, transcriptionKeyValid);
    updateValidationUI(data.keys?.openaiTranslation, translationKeyValid);
    updateValidationUI(data.keys?.openaiTts, ttsKeyValid);
  } catch (error) {
    validationEls.forEach(el => {
      el.textContent = "Error";
      el.className = "status-badge error";
    });
    console.error("Validation failed:", error);
  }
}

// Platform Settings - Summarization Prompt
async function loadSummarizationPrompt() {
  promptFeedback.textContent = "";
  promptStatus.textContent = "Loading...";
  promptStatus.className = "status-badge";

  try {
    const data = await apiRequest("/platform-settings/summarization_prompt", "GET");

    // Show the current effective prompt (custom or default)
    const effectivePrompt = data.value ?? data.defaultValue;
    promptDefaultDisplay.textContent = effectivePrompt;

    if (data.isCustom) {
      promptStatus.textContent = "Custom";
      promptStatus.className = "status-badge configured";
      summarizationPromptInput.value = data.value;
    } else {
      promptStatus.textContent = "Default";
      promptStatus.className = "status-badge";
      summarizationPromptInput.value = "";
      summarizationPromptInput.placeholder = "Enter a custom prompt to override the default...";
    }
  } catch (error) {
    promptStatus.textContent = "Error";
    promptStatus.className = "status-badge error";
    promptFeedback.textContent = `Failed to load: ${error.message}`;
  }
}

async function saveSummarizationPrompt() {
  const value = summarizationPromptInput.value.trim();
  if (!value) {
    promptFeedback.textContent = "Prompt cannot be empty. Use Reset to restore default.";
    return;
  }

  promptFeedback.textContent = "Saving...";

  try {
    await apiRequest("/platform-settings/summarization_prompt", "PUT", { value });
    promptFeedback.textContent = "Saved successfully!";
    await loadSummarizationPrompt();
  } catch (error) {
    promptFeedback.textContent = `Save failed: ${error.message}`;
  }
}

async function resetSummarizationPrompt() {
  promptFeedback.textContent = "Resetting to default...";

  try {
    await apiRequest("/platform-settings/summarization_prompt", "PUT", { resetToDefault: true });
    promptFeedback.textContent = "Reset to default!";
    await loadSummarizationPrompt();
  } catch (error) {
    promptFeedback.textContent = `Reset failed: ${error.message}`;
  }
}

// Pricing Plans Functions
async function loadPricingPlans() {
  pricingPlanList.innerHTML = '<p class="hint">Loading...</p>';

  try {
    const data = await apiRequest("/pricing-plans", "GET");
    state.pricingPlans = data.plans ?? [];
    renderPricingPlans(state.pricingPlans);
  } catch (error) {
    pricingPlanList.innerHTML = `<p class="hint">Failed to load pricing plans: ${error.message}</p>`;
  }
}

function renderPricingPlans(plans) {
  pricingPlanList.innerHTML = "";

  if (!plans.length) {
    const empty = document.createElement("p");
    empty.textContent = "No pricing plans yet. Create one above.";
    empty.className = "hint";
    pricingPlanList.appendChild(empty);
    return;
  }

  plans.forEach((plan) => {
    const item = document.createElement("div");
    item.className = "tenant-item";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${plan.name}</strong>${plan.isDefault ? ' <span class="status-badge configured">Default</span>' : ''}
      <div class="hint">ID: ${plan.planId}</div>
      <div class="hint">Created: ${plan.createdAt ?? "n/a"}</div>
    `;

    const costs = document.createElement("div");
    costs.innerHTML = `
      <span class="hint">Costs</span>
      <div style="font-size: 0.85em;">
        User: $${plan.userCost?.toFixed(2) ?? "2.00"} | Dispatcher: $${plan.dispatcherCost?.toFixed(2) ?? "5.00"}<br>
        Transcription: $${plan.transcriptionCost?.toFixed(2) ?? "2.00"} | Translation: $${plan.translationCost?.toFixed(2) ?? "3.00"}<br>
        Elevation: $${plan.elevationRuleCost?.toFixed(2) ?? "1.00"}/rule | Retention: $${plan.retentionCostPerDay?.toFixed(3) ?? "0.010"}/day
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    actions.appendChild(editButton);

    if (!plan.isDefault) {
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "danger";
      deleteButton.addEventListener("click", async () => {
        const confirmed = window.confirm(`Delete pricing plan "${plan.name}"? This cannot be undone.`);
        if (!confirmed) return;
        try {
          await apiRequest(`/pricing-plans/${plan.planId}`, "DELETE");
          await loadPricingPlans();
        } catch (error) {
          alert(`Delete failed: ${error.message}`);
        }
      });
      actions.appendChild(deleteButton);
    }

    item.appendChild(meta);
    item.appendChild(costs);
    item.appendChild(actions);

    // Edit panel
    const editPanel = document.createElement("div");
    editPanel.className = "admin-panel hidden";

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Plan Name
        <input name="planName" value="${plan.name}" />
      </label>
      <label>
        <input name="planIsDefault" type="checkbox" ${plan.isDefault ? 'checked' : ''} />
        Set as Default Plan
      </label>
      <label>
        User Cost ($/month)
        <input name="userCost" type="number" step="0.01" min="0" value="${plan.userCost ?? 2}" />
      </label>
      <label>
        Dispatcher Cost ($/month)
        <input name="dispatcherCost" type="number" step="0.01" min="0" value="${plan.dispatcherCost ?? 5}" />
      </label>
      <label>
        Transcription Cost ($/user/month)
        <input name="transcriptionCost" type="number" step="0.01" min="0" value="${plan.transcriptionCost ?? 2}" />
      </label>
      <label>
        Translation Cost ($/user/month)
        <input name="translationCost" type="number" step="0.01" min="0" value="${plan.translationCost ?? 3}" />
      </label>
      <label>
        Elevation Rule Cost ($/rule/month)
        <input name="elevationRuleCost" type="number" step="0.01" min="0" value="${plan.elevationRuleCost ?? 1}" />
      </label>
      <label>
        Retention Cost ($/day/user)
        <input name="retentionCostPerDay" type="number" step="0.001" min="0" value="${plan.retentionCostPerDay ?? 0.01}" />
      </label>
    `;

    const editActions = document.createElement("div");
    editActions.className = "row";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const editFeedback = document.createElement("div");
    editFeedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const name = editForm.querySelector("input[name='planName']").value.trim();
      const isDefault = editForm.querySelector("input[name='planIsDefault']").checked;
      const userCost = parseFloat(editForm.querySelector("input[name='userCost']").value);
      const dispatcherCost = parseFloat(editForm.querySelector("input[name='dispatcherCost']").value);
      const transcriptionCost = parseFloat(editForm.querySelector("input[name='transcriptionCost']").value);
      const translationCost = parseFloat(editForm.querySelector("input[name='translationCost']").value);
      const elevationRuleCost = parseFloat(editForm.querySelector("input[name='elevationRuleCost']").value);
      const retentionCostPerDay = parseFloat(editForm.querySelector("input[name='retentionCostPerDay']").value);

      editFeedback.textContent = "Saving...";
      try {
        await apiRequest(`/pricing-plans/${plan.planId}`, "PUT", {
          name,
          isDefault,
          userCost,
          dispatcherCost,
          transcriptionCost,
          translationCost,
          elevationRuleCost,
          retentionCostPerDay
        });
        editFeedback.textContent = "Saved.";
        await loadPricingPlans();
      } catch (error) {
        editFeedback.textContent = `Save failed: ${error.message}`;
      }
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(editFeedback);

    editPanel.appendChild(editForm);
    editPanel.appendChild(editActions);

    editButton.addEventListener("click", () => {
      editPanel.classList.toggle("hidden");
    });

    item.appendChild(editPanel);
    pricingPlanList.appendChild(item);
  });
}

async function createPricingPlan() {
  const name = planNameInput.value.trim();
  if (!name) {
    createPlanStatus.textContent = "Plan name is required.";
    return;
  }

  const isDefault = planIsDefaultCheckbox.checked;
  const userCost = parseFloat(planUserCostInput.value);
  const dispatcherCost = parseFloat(planDispatcherCostInput.value);
  const transcriptionCost = parseFloat(planTranscriptionCostInput.value);
  const translationCost = parseFloat(planTranslationCostInput.value);
  const elevationRuleCost = parseFloat(planElevationCostInput.value);
  const retentionCostPerDay = parseFloat(planRetentionCostInput.value);

  createPlanStatus.textContent = "Creating...";

  try {
    await apiRequest("/pricing-plans", "POST", {
      name,
      isDefault,
      userCost,
      dispatcherCost,
      transcriptionCost,
      translationCost,
      elevationRuleCost,
      retentionCostPerDay
    });
    createPlanStatus.textContent = "Created!";
    planNameInput.value = "";
    planIsDefaultCheckbox.checked = false;
    await loadPricingPlans();
  } catch (error) {
    createPlanStatus.textContent = `Create failed: ${error.message}`;
  }
}

// License Plans Functions
async function loadLicensePlans() {
  licensePlanList.innerHTML = '<p class="hint">Loading...</p>';

  try {
    const data = await apiRequest("/license-plans", "GET");
    state.licensePlans = data.plans ?? [];
    renderLicensePlans(state.licensePlans);
  } catch (error) {
    licensePlanList.innerHTML = `<p class="hint">Failed to load license plans: ${error.message}</p>`;
  }
}

function renderLicensePlans(plans) {
  licensePlanList.innerHTML = "";

  if (!plans.length) {
    const empty = document.createElement("p");
    empty.textContent = "No license plans yet. Create one above.";
    empty.className = "hint";
    licensePlanList.appendChild(empty);
    return;
  }

  plans.forEach((plan) => {
    const item = document.createElement("div");
    item.className = "tenant-item";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${plan.name}</strong>${plan.isDefault ? ' <span class="status-badge configured">Default</span>' : ''}
      <div class="hint">ID: ${plan.planId}</div>
      <div class="hint">Created: ${plan.createdAt ?? "n/a"}</div>
    `;

    const features = document.createElement("div");
    const featureList = [];
    if (plan.transcriptionEnabled) featureList.push("Transcription");
    if (plan.translationEnabled) featureList.push("Translation");
    if (plan.aiElevationEnabled) featureList.push("AI Elevation");
    if (plan.dataRetentionEnabled) featureList.push("Data Retention");
    features.innerHTML = `
      <span class="hint">Features</span>
      <div style="font-size: 0.85em;">
        ${featureList.length > 0 ? featureList.join(", ") : "None"}<br>
        Users: ${plan.userLimit === null ? "Unlimited" : plan.userLimit}
      </div>
    `;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    actions.appendChild(editButton);

    if (!plan.isDefault) {
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.className = "danger";
      deleteButton.addEventListener("click", async () => {
        const confirmed = window.confirm(`Delete license plan "${plan.name}"? This cannot be undone.`);
        if (!confirmed) return;
        try {
          await apiRequest(`/license-plans/${plan.planId}`, "DELETE");
          await loadLicensePlans();
        } catch (error) {
          alert(`Delete failed: ${error.message}`);
        }
      });
      actions.appendChild(deleteButton);
    }

    item.appendChild(meta);
    item.appendChild(features);
    item.appendChild(actions);

    // Edit panel
    const editPanel = document.createElement("div");
    editPanel.className = "admin-panel hidden";

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Plan Name
        <input name="planName" value="${plan.name}" />
      </label>
      <label>
        <input name="planIsDefault" type="checkbox" ${plan.isDefault ? 'checked' : ''} />
        Set as Default Plan
      </label>
      <label>
        <input name="transcriptionEnabled" type="checkbox" ${plan.transcriptionEnabled ? 'checked' : ''} />
        Transcription
      </label>
      <label>
        <input name="translationEnabled" type="checkbox" ${plan.translationEnabled ? 'checked' : ''} />
        Translation
      </label>
      <label>
        <input name="aiElevationEnabled" type="checkbox" ${plan.aiElevationEnabled ? 'checked' : ''} />
        AI Elevation
      </label>
      <label>
        <input name="dataRetentionEnabled" type="checkbox" ${plan.dataRetentionEnabled ? 'checked' : ''} />
        Data Retention
      </label>
      <label>
        <input name="unlimitedUsers" type="checkbox" ${plan.userLimit === null ? 'checked' : ''} />
        Unlimited Users
      </label>
      <label>
        Max Users
        <input name="userLimit" type="number" min="1" value="${plan.userLimit ?? 10}" ${plan.userLimit === null ? 'disabled' : ''} />
      </label>
    `;

    // Handle transcription dependency
    const transcriptionCheckbox = editForm.querySelector("input[name='transcriptionEnabled']");
    const translationCheckbox = editForm.querySelector("input[name='translationEnabled']");
    const elevationCheckbox = editForm.querySelector("input[name='aiElevationEnabled']");
    transcriptionCheckbox.addEventListener("change", () => {
      if (!transcriptionCheckbox.checked) {
        translationCheckbox.checked = false;
        translationCheckbox.disabled = true;
        elevationCheckbox.checked = false;
        elevationCheckbox.disabled = true;
      } else {
        translationCheckbox.disabled = false;
        elevationCheckbox.disabled = false;
      }
    });
    // Initialize disabled state
    if (!transcriptionCheckbox.checked) {
      translationCheckbox.disabled = true;
      elevationCheckbox.disabled = true;
    }

    // Handle unlimited users toggle
    const unlimitedCheckbox = editForm.querySelector("input[name='unlimitedUsers']");
    const userLimitInput = editForm.querySelector("input[name='userLimit']");
    unlimitedCheckbox.addEventListener("change", () => {
      userLimitInput.disabled = unlimitedCheckbox.checked;
    });

    const editActions = document.createElement("div");
    editActions.className = "row";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const editFeedback = document.createElement("div");
    editFeedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const name = editForm.querySelector("input[name='planName']").value.trim();
      const isDefault = editForm.querySelector("input[name='planIsDefault']").checked;
      const transcriptionEnabled = editForm.querySelector("input[name='transcriptionEnabled']").checked;
      const translationEnabled = editForm.querySelector("input[name='translationEnabled']").checked;
      const aiElevationEnabled = editForm.querySelector("input[name='aiElevationEnabled']").checked;
      const dataRetentionEnabled = editForm.querySelector("input[name='dataRetentionEnabled']").checked;
      const unlimited = editForm.querySelector("input[name='unlimitedUsers']").checked;
      const userLimit = unlimited ? null : parseInt(editForm.querySelector("input[name='userLimit']").value, 10);

      editFeedback.textContent = "Saving...";
      try {
        await apiRequest(`/license-plans/${plan.planId}`, "PUT", {
          name,
          isDefault,
          transcriptionEnabled,
          translationEnabled,
          aiElevationEnabled,
          dataRetentionEnabled,
          userLimit
        });
        editFeedback.textContent = "Saved.";
        await loadLicensePlans();
      } catch (error) {
        editFeedback.textContent = `Save failed: ${error.message}`;
      }
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(editFeedback);

    editPanel.appendChild(editForm);
    editPanel.appendChild(editActions);

    editButton.addEventListener("click", () => {
      editPanel.classList.toggle("hidden");
    });

    item.appendChild(editPanel);
    licensePlanList.appendChild(item);
  });
}

async function createLicensePlan() {
  const name = licensePlanNameInput.value.trim();
  if (!name) {
    createLicenseStatus.textContent = "Plan name is required.";
    return;
  }

  const isDefault = licenseIsDefaultCheckbox.checked;
  const transcriptionEnabled = licenseTranscriptionCheckbox.checked;
  const translationEnabled = licenseTranslationCheckbox.checked;
  const aiElevationEnabled = licenseElevationCheckbox.checked;
  const dataRetentionEnabled = licenseRetentionCheckbox.checked;
  const unlimited = licenseUnlimitedUsersCheckbox.checked;
  const userLimit = unlimited ? null : parseInt(licenseUserLimitInput.value, 10);

  createLicenseStatus.textContent = "Creating...";

  try {
    await apiRequest("/license-plans", "POST", {
      name,
      isDefault,
      transcriptionEnabled,
      translationEnabled,
      aiElevationEnabled,
      dataRetentionEnabled,
      userLimit
    });
    createLicenseStatus.textContent = "Created!";
    licensePlanNameInput.value = "";
    licenseIsDefaultCheckbox.checked = false;
    licenseTranscriptionCheckbox.checked = true;
    licenseTranslationCheckbox.checked = true;
    licenseElevationCheckbox.checked = true;
    licenseRetentionCheckbox.checked = true;
    licenseUnlimitedUsersCheckbox.checked = true;
    licenseUserLimitInput.disabled = true;
    await loadLicensePlans();
  } catch (error) {
    createLicenseStatus.textContent = `Create failed: ${error.message}`;
  }
}

// Platform API Keys Functions
function populatePlatformPermissionSelect(selectEl, selectedPerms = []) {
  selectEl.innerHTML = "";
  const selectedSet = new Set(selectedPerms);
  PLATFORM_API_KEY_PERMISSION_GROUPS.forEach(group => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = group.group;
    group.permissions.forEach(perm => {
      if (!selectedSet.has(perm.value)) {
        const option = document.createElement("option");
        option.value = perm.value;
        option.textContent = perm.label;
        optgroup.appendChild(option);
      }
    });
    if (optgroup.children.length > 0) {
      selectEl.appendChild(optgroup);
    }
  });
}

function populateSelectedPlatformPermissions(selectEl, selectedPerms = []) {
  selectEl.innerHTML = "";
  const permMap = {};
  PLATFORM_API_KEY_PERMISSION_GROUPS.forEach(group => {
    group.permissions.forEach(perm => {
      permMap[perm.value] = { label: perm.label, group: group.group };
    });
  });

  // Group selected permissions
  const byGroup = {};
  selectedPerms.forEach(value => {
    const info = permMap[value];
    if (info) {
      if (!byGroup[info.group]) byGroup[info.group] = [];
      byGroup[info.group].push({ value, label: info.label });
    }
  });

  Object.keys(byGroup).sort().forEach(groupName => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;
    byGroup[groupName].forEach(perm => {
      const option = document.createElement("option");
      option.value = perm.value;
      option.textContent = perm.label;
      optgroup.appendChild(option);
    });
    selectEl.appendChild(optgroup);
  });
}

function getSelectedPlatformPermissionsFromSelect(selectEl) {
  const perms = [];
  selectEl.querySelectorAll("option").forEach(opt => perms.push(opt.value));
  return perms;
}

function initPlatformCreateKeyPermissions() {
  populatePlatformPermissionSelect(platformApiKeyAvailablePerms, []);
  platformApiKeySelectedPerms.innerHTML = "";
}

async function loadPlatformApiKeys() {
  try {
    platformApiKeysStatus.textContent = "Loading API keys...";
    const data = await apiRequest("/platform-api-keys", "GET");
    state.platformApiKeys = data.keys ?? [];
    renderPlatformApiKeys();
    platformApiKeysStatus.textContent = "";
    initPlatformCreateKeyPermissions();
  } catch (error) {
    platformApiKeysStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function getPlatformKeyStatus(key) {
  if (key.status === "revoked") return "REVOKED";
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "EXPIRED";
  return "ACTIVE";
}

function renderPlatformApiKeys() {
  platformApiKeysList.innerHTML = "";

  const filterValue = platformApiKeyStatusFilter.value;

  // Filter by status
  const filtered = state.platformApiKeys.filter(key => {
    if (filterValue === "ALL") return true;
    return getPlatformKeyStatus(key) === filterValue;
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent = filterValue === "ALL" ? "No API keys configured." : `No ${filterValue.toLowerCase()} keys.`;
    empty.className = "hint";
    platformApiKeysList.appendChild(empty);
    return;
  }

  // Sort: active first, then by created date
  const sorted = [...filtered].sort((a, b) => {
    const statusA = getPlatformKeyStatus(a);
    const statusB = getPlatformKeyStatus(b);
    if (statusA !== statusB) return statusA === "ACTIVE" ? -1 : 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  sorted.forEach(key => {
    const item = document.createElement("div");
    item.className = "tenant-item";

    const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
    const statusColor = key.status === "revoked" ? "#ef4444" : isExpired ? "#f97316" : "#22c55e";
    const statusText = key.status === "revoked" ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${key.name}</strong>
      <div class="hint">Key: ${key.keyPrefix}...</div>
      <div class="hint">Permissions: ${key.permissions?.length || 0}</div>
      <div class="hint">Created: ${key.createdAt ? new Date(key.createdAt).toLocaleDateString() : "N/A"}</div>
    `;

    const statusWrap = document.createElement("div");
    statusWrap.innerHTML = `
      <span class="hint">Status</span>
      <div><strong style="color: ${statusColor}">${statusText}</strong></div>
      <div class="hint">Expires: ${key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}</div>
      <div class="hint">Last used: ${key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    editButton.type = "button";

    const revokeButton = document.createElement("button");
    revokeButton.textContent = "Revoke";
    revokeButton.className = "danger";
    revokeButton.type = "button";

    if (key.status === "revoked") {
      editButton.disabled = true;
      revokeButton.disabled = true;
    }

    const rowFeedback = document.createElement("div");
    rowFeedback.className = "hint";

    actions.appendChild(editButton);
    actions.appendChild(revokeButton);
    actions.appendChild(rowFeedback);

    const panel = document.createElement("div");
    panel.className = "admin-panel hidden";

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Key Name
        <input name="keyName" type="text" value="${key.name}" />
      </label>
      <label>
        Expires
        <select name="expiresAt">
          <option value="">Never</option>
          <option value="30">30 days from now</option>
          <option value="90">90 days from now</option>
          <option value="180">180 days from now</option>
          <option value="365">1 year from now</option>
          ${key.expiresAt ? `<option value="keep" selected>Keep current (${new Date(key.expiresAt).toLocaleDateString()})</option>` : ""}
        </select>
      </label>
    `;

    const permissionsDiv = document.createElement("div");
    permissionsDiv.style.marginTop = "1rem";
    permissionsDiv.innerHTML = `<label>Permissions</label>`;

    const permGrid = document.createElement("div");
    permGrid.className = "assignment-grid";
    permGrid.style.marginTop = "0.5rem";

    const availableDiv = document.createElement("div");
    availableDiv.innerHTML = "<h3>Available</h3>";
    const editAvailableSelect = document.createElement("select");
    editAvailableSelect.multiple = true;
    editAvailableSelect.size = 8;
    availableDiv.appendChild(editAvailableSelect);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "assignment-actions";
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.textContent = "Add >>";
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "secondary";
    removeBtn.textContent = "<< Remove";
    actionsDiv.appendChild(addBtn);
    actionsDiv.appendChild(removeBtn);

    const selectedDiv = document.createElement("div");
    selectedDiv.innerHTML = "<h3>Selected</h3>";
    const editSelectedSelect = document.createElement("select");
    editSelectedSelect.multiple = true;
    editSelectedSelect.size = 8;
    selectedDiv.appendChild(editSelectedSelect);

    permGrid.appendChild(availableDiv);
    permGrid.appendChild(actionsDiv);
    permGrid.appendChild(selectedDiv);
    permissionsDiv.appendChild(permGrid);

    // Initialize with current permissions
    const currentPerms = key.permissions ?? [];
    populatePlatformPermissionSelect(editAvailableSelect, currentPerms);
    populateSelectedPlatformPermissions(editSelectedSelect, currentPerms);

    addBtn.addEventListener("click", () => {
      const toAdd = Array.from(editAvailableSelect.selectedOptions).map(o => o.value);
      if (!toAdd.length) return;
      const current = getSelectedPlatformPermissionsFromSelect(editSelectedSelect);
      const updated = [...current, ...toAdd];
      populatePlatformPermissionSelect(editAvailableSelect, updated);
      populateSelectedPlatformPermissions(editSelectedSelect, updated);
    });

    removeBtn.addEventListener("click", () => {
      const toRemove = new Set(Array.from(editSelectedSelect.selectedOptions).map(o => o.value));
      if (!toRemove.size) return;
      const current = getSelectedPlatformPermissionsFromSelect(editSelectedSelect);
      const updated = current.filter(p => !toRemove.has(p));
      populatePlatformPermissionSelect(editAvailableSelect, updated);
      populateSelectedPlatformPermissions(editSelectedSelect, updated);
    });

    const editActions = document.createElement("div");
    editActions.className = "row";
    editActions.style.marginTop = "1rem";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const feedback = document.createElement("div");
    feedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const name = editForm.querySelector("input[name='keyName']").value.trim();
      const expiryValue = editForm.querySelector("select[name='expiresAt']").value;
      const selectedPermissions = getSelectedPlatformPermissionsFromSelect(editSelectedSelect);

      if (!name) {
        feedback.textContent = "Name is required.";
        return;
      }
      if (selectedPermissions.length === 0) {
        feedback.textContent = "At least one permission is required.";
        return;
      }

      const updates = { name, permissions: selectedPermissions };

      if (expiryValue === "") {
        updates.expiresAt = null;
      } else if (expiryValue === "keep") {
        // Don't include expiresAt in updates
      } else {
        const days = parseInt(expiryValue, 10);
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + days);
        updates.expiresAt = newExpiry.toISOString();
      }

      feedback.textContent = "Saving...";
      try {
        await apiRequest(`/platform-api-keys/${key.keyId}`, "PATCH", updates);
        feedback.textContent = "Saved.";
        await loadPlatformApiKeys();
      } catch (error) {
        feedback.textContent = `Save failed: ${error.message}`;
      }
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(feedback);

    panel.appendChild(editForm);
    panel.appendChild(permissionsDiv);
    panel.appendChild(editActions);

    editButton.addEventListener("click", () => {
      panel.classList.toggle("hidden");
    });

    revokeButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`Revoke API key "${key.name}"? This cannot be undone.`);
      if (!confirmed) return;

      rowFeedback.textContent = "Revoking...";
      try {
        await apiRequest(`/platform-api-keys/${key.keyId}`, "DELETE");
        rowFeedback.textContent = "Revoked.";
        await loadPlatformApiKeys();
      } catch (error) {
        rowFeedback.textContent = `Revoke failed: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);
    item.appendChild(panel);
    platformApiKeysList.appendChild(item);
  });
}

// Platform Admin Logs - Format Functions
function formatPlatformAdminAction(action) {
  const actionMap = {
    "CREATE_TENANT": "Create tenant",
    "UPDATE_TENANT": "Update tenant",
    "DELETE_TENANT": "Delete tenant",
    "CREATE_ADMIN_USER": "Create admin user",
    "UPDATE_ADMIN_USER": "Update admin user",
    "DELETE_ADMIN_USER": "Delete admin user",
    "ASSIGN_ADMIN_TO_TENANT": "Assign admin to tenant",
    "REMOVE_ADMIN_ASSIGNMENT": "Remove admin assignment",
    "CREATE_PRICING_PLAN": "Create pricing plan",
    "UPDATE_PRICING_PLAN": "Update pricing plan",
    "DELETE_PRICING_PLAN": "Delete pricing plan",
    "CREATE_LICENSE_PLAN": "Create license plan",
    "UPDATE_LICENSE_PLAN": "Update license plan",
    "DELETE_LICENSE_PLAN": "Delete license plan",
    "CREATE_PLATFORM_API_KEY": "Create API key",
    "UPDATE_PLATFORM_API_KEY": "Update API key",
    "REVOKE_PLATFORM_API_KEY": "Revoke API key",
    "SET_OPENAI_KEYS": "Update OpenAI keys",
    "SET_PLATFORM_SETTING": "Update platform setting"
  };
  return actionMap[action] || action;
}

function formatPlatformAdminDetails(details) {
  if (!details) return "-";

  const parts = [];
  if (details.name !== undefined) {
    parts.push(`Name: ${details.name}`);
  }
  if (details.status !== undefined) {
    parts.push(`Status: ${details.status}`);
  }
  if (details.pricingPlanId !== undefined) {
    parts.push(`Pricing: ${details.pricingPlanId || "default"}`);
  }
  if (details.licensePlanId !== undefined) {
    parts.push(`License: ${details.licensePlanId || "default"}`);
  }
  if (details.isDefault !== undefined) {
    parts.push(`Default: ${details.isDefault}`);
  }
  if (details.permissions !== undefined) {
    parts.push(`Permissions: ${details.permissions?.length || 0}`);
  }
  if (details.settingKey !== undefined) {
    parts.push(`Setting: ${details.settingKey}`);
  }
  if (details.keyType !== undefined) {
    parts.push(`Key: ${details.keyType}`);
  }
  if (details.tenantId !== undefined) {
    parts.push(`Tenant: ${details.tenantId}`);
  }
  if (details.adminId !== undefined) {
    parts.push(`Admin: ${details.adminId}`);
  }

  return parts.length > 0 ? parts.join(", ") : "-";
}

function populateAdminLogFilters() {
  // Populate admin filter with unique actors from admin users
  adminLogAdminFilter.innerHTML = '<option value="">All Admins</option>';

  // Add admin users to the filter
  state.adminUsers.forEach(user => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = user.displayName || user.email;
    adminLogAdminFilter.appendChild(option);
  });
}

// Platform Admin Logs
async function loadPlatformAdminLogs(append = false) {
  if (!append) {
    adminLogTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Loading...</td></tr>';
    state.platformAdminLogs = [];
    state.adminLogsNextCursor = null;
  }

  try {
    const params = new URLSearchParams({ limit: "50" });
    if (adminLogAdminFilter.value) {
      params.set("actorId", adminLogAdminFilter.value);
    }
    if (adminLogsStartDate.value) {
      params.set("startDate", adminLogsStartDate.value);
    }
    if (adminLogsEndDate.value) {
      params.set("endDate", adminLogsEndDate.value);
    }
    if (append && state.adminLogsNextCursor) {
      params.set("cursor", state.adminLogsNextCursor);
    }

    const data = await apiRequest(`/platform-admin-logs?${params.toString()}`);
    if (append) {
      state.platformAdminLogs = [...state.platformAdminLogs, ...data.logs];
    } else {
      state.platformAdminLogs = data.logs;
    }
    state.adminLogsNextCursor = data.nextCursor;
    renderPlatformAdminLogs();
    adminLogStatus.textContent = `Showing ${state.platformAdminLogs.length} entries`;

    adminLogsLoadMoreButton.style.display = state.adminLogsNextCursor ? "inline-block" : "none";
  } catch (error) {
    adminLogStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function renderPlatformAdminLogs() {
  adminLogTableBody.innerHTML = "";

  if (!state.platformAdminLogs.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" style="text-align: center; color: #666;">No admin logs found</td>`;
    adminLogTableBody.appendChild(row);
    return;
  }

  state.platformAdminLogs.forEach((log) => {
    const row = document.createElement("tr");

    const time = log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A";
    const admin = log.actorName || log.actorId || "Unknown";
    const action = formatPlatformAdminAction(log.action);
    const target = log.targetName
      ? `${log.targetType}: ${log.targetName}`
      : log.targetId
        ? `${log.targetType}: ${log.targetId}`
        : log.targetType || "-";
    const details = formatPlatformAdminDetails(log.details);

    row.innerHTML = `
      <td>${time}</td>
      <td>${admin}</td>
      <td>${action}</td>
      <td>${target}</td>
      <td class="summary-cell">${details}</td>
    `;
    adminLogTableBody.appendChild(row);
  });
}

// Export admin logs to CSV
async function exportPlatformAdminLogs() {
  adminLogStatus.textContent = "Fetching all matching admin logs...";
  exportAdminLogsButton.disabled = true;

  try {
    // Build filter params from current filter state
    const params = new URLSearchParams();
    if (adminLogAdminFilter.value) params.set("actorId", adminLogAdminFilter.value);
    if (adminLogsStartDate.value) params.set("startDate", adminLogsStartDate.value);
    if (adminLogsEndDate.value) params.set("endDate", adminLogsEndDate.value);

    // Fetch all pages
    let allLogs = [];
    let cursor = null;
    let pageCount = 0;

    do {
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "100");

      const data = await apiRequest(`/platform-admin-logs?${params.toString()}`);
      allLogs = [...allLogs, ...(data.logs || [])];
      cursor = data.nextCursor;
      pageCount++;
      adminLogStatus.textContent = `Fetching logs... (${allLogs.length} entries)`;
    } while (cursor && pageCount < 100); // Safety limit

    // Build CSV
    const headers = ["Time", "Admin", "Action", "Target Type", "Target Name", "Target ID", "Details"];
    const rows = allLogs.map(log => [
      log.timestamp ? new Date(log.timestamp).toISOString() : "",
      log.actorName || log.actorId || "",
      log.action || "",
      log.targetType || "",
      log.targetName || "",
      log.targetId || "",
      JSON.stringify(log.details || {})
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `platform-admin-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    adminLogStatus.textContent = `Exported ${allLogs.length} entries`;
  } catch (error) {
    adminLogStatus.textContent = `Export failed: ${error.message}`;
  } finally {
    exportAdminLogsButton.disabled = false;
  }
}

// License form dependency handlers
licenseTranscriptionCheckbox.addEventListener("change", () => {
  if (!licenseTranscriptionCheckbox.checked) {
    licenseTranslationCheckbox.checked = false;
    licenseTranslationCheckbox.disabled = true;
    licenseElevationCheckbox.checked = false;
    licenseElevationCheckbox.disabled = true;
  } else {
    licenseTranslationCheckbox.disabled = false;
    licenseElevationCheckbox.disabled = false;
  }
});

licenseUnlimitedUsersCheckbox.addEventListener("change", () => {
  licenseUserLimitInput.disabled = licenseUnlimitedUsersCheckbox.checked;
});

// Event Listeners
signInButton.addEventListener("click", async () => {
  state.apiBaseUrl = apiBaseUrlInput.value.trim();
  if (!state.apiBaseUrl) {
    connectionStatus.textContent = "API Base URL is required";
    return;
  }

  saveState();
  connectionStatus.textContent = "Loading auth configuration...";

  const loaded = await loadCognitoConfig();
  if (!loaded) {
    connectionStatus.textContent = "Failed to load authentication configuration";
    return;
  }

  const loginUrl = getLoginUrl();
  if (loginUrl) {
    window.location.href = loginUrl;
  }
});

logoutAppButton.addEventListener("click", handleLogout);

refreshButton.addEventListener("click", () => {
  loadTenants();
});

tabTenants.addEventListener("click", () => {
  setActiveTab("tenants");
});

tabUsers.addEventListener("click", () => {
  setActiveTab("users");
});

tabPricing.addEventListener("click", () => {
  setActiveTab("pricing");
});

tabApiKeys.addEventListener("click", () => {
  setActiveTab("api-keys");
});

tabOpenaiKeys.addEventListener("click", () => {
  setActiveTab("openai-keys");
});

tabTweaks.addEventListener("click", () => {
  setActiveTab("tweaks");
});

tabAdminLogs.addEventListener("click", async () => {
  setActiveTab("admin-logs");
  // Load admin users first to populate admin filter
  if (state.adminUsers.length === 0) {
    await loadAdminUsers();
  }
  populateAdminLogFilters();
  loadPlatformAdminLogs();
});

refreshAdminLogsButton.addEventListener("click", () => {
  loadPlatformAdminLogs();
});

adminLogsLoadMoreButton.addEventListener("click", () => {
  loadPlatformAdminLogs(true);
});

applyAdminLogFiltersBtn.addEventListener("click", () => {
  loadPlatformAdminLogs();
});

clearAdminLogFiltersBtn.addEventListener("click", () => {
  adminLogAdminFilter.value = "";
  adminLogsStartDate.value = "";
  adminLogsEndDate.value = "";
  loadPlatformAdminLogs();
});

exportAdminLogsButton.addEventListener("click", () => {
  exportPlatformAdminLogs();
});

tenantSearchInput.addEventListener("input", () => {
  renderTenants(getFilteredTenants(state.tenants ?? []));
});

tenantStatusFilter.addEventListener("change", () => {
  renderTenants(getFilteredTenants(state.tenants ?? []));
});

createTenantButton.addEventListener("click", async () => {
  const name = tenantNameInput.value.trim();
  const tenantId = tenantIdInput.value.trim();
  if (!name) {
    alert("Tenant name is required.");
    return;
  }

  try {
    await apiRequest("/tenants", "POST", {
      name,
      tenantId: tenantId || undefined
    });
    tenantNameInput.value = "";
    tenantIdInput.value = "";
    await loadTenants();
  } catch (error) {
    alert(`Create failed: ${error.message}`);
  }
});

createAdminUserButton.addEventListener("click", async () => {
  const displayName = adminUserNameInput.value.trim();
  const email = adminUserEmailInput.value.trim();
  const status = adminUserStatusSelect.value;
  if (!displayName || !email) {
    assignmentStatus.textContent = "Name and email are required.";
    return;
  }

  try {
    await apiRequest("/admin-users", "POST", { displayName, email, status });
    adminUserNameInput.value = "";
    adminUserEmailInput.value = "";
    await loadAdminUsers();
    assignmentStatus.textContent = "Admin user created.";
  } catch (error) {
    assignmentStatus.textContent = `Create failed: ${error.message}`;
  }
});

adminUserSearchInput.addEventListener("input", () => {
  renderAdminUsers(getFilteredAdminUsers(state.adminUsers ?? []));
});

adminUserStatusFilter.addEventListener("change", () => {
  renderAdminUsers(getFilteredAdminUsers(state.adminUsers ?? []));
});

// Helper function for toggle buttons
function setupToggleButton(toggleButton, inputElement) {
  toggleButton.addEventListener("click", () => {
    if (inputElement.type === "password") {
      inputElement.type = "text";
      toggleButton.textContent = "Hide";
    } else {
      inputElement.type = "password";
      toggleButton.textContent = "Show";
    }
  });
}

setupToggleButton(toggleOpenaiKeyButton, openaiKeyInput);
setupToggleButton(toggleTranscriptionKeyButton, transcriptionKeyInput);
setupToggleButton(toggleTranslationKeyButton, translationKeyInput);
setupToggleButton(toggleTtsKeyButton, ttsKeyInput);

// Helper function to setup save and clear button handlers
function setupKeyHandlers(keyType, keyInput, feedbackEl, saveButton, clearButton, serviceName) {
  saveButton.addEventListener("click", async () => {
    const keyValue = keyInput.value.trim();
    if (!keyValue) {
      feedbackEl.textContent = "Please enter a key value.";
      return;
    }

    if (!keyValue.startsWith("sk-")) {
      feedbackEl.textContent = "OpenAI keys should start with 'sk-'";
      return;
    }

    feedbackEl.textContent = "Saving...";
    try {
      await savePlatformKey(keyType, keyValue);
      feedbackEl.textContent = "Saved successfully!";
      keyInput.value = "";
      await loadPlatformOpenAIKeys();
    } catch (error) {
      feedbackEl.textContent = `Save failed: ${error.message}`;
    }
  });

  clearButton.addEventListener("click", async () => {
    const confirmed = window.confirm(
      `Are you sure you want to clear the ${serviceName} API key?`
    );
    if (!confirmed) {
      return;
    }

    feedbackEl.textContent = "Clearing...";
    try {
      await savePlatformKey(keyType, "");
      feedbackEl.textContent = "Key cleared.";
      await loadPlatformOpenAIKeys();
    } catch (error) {
      feedbackEl.textContent = `Clear failed: ${error.message}`;
    }
  });
}

setupKeyHandlers("openai", openaiKeyInput, openaiKeyFeedback, saveOpenaiKeyButton, clearOpenaiKeyButton, "default OpenAI");
setupKeyHandlers("transcription", transcriptionKeyInput, transcriptionKeyFeedback, saveTranscriptionKeyButton, clearTranscriptionKeyButton, "transcription");
setupKeyHandlers("translation", translationKeyInput, translationKeyFeedback, saveTranslationKeyButton, clearTranslationKeyButton, "translation");
setupKeyHandlers("tts", ttsKeyInput, ttsKeyFeedback, saveTtsKeyButton, clearTtsKeyButton, "text-to-speech");

validateAllKeysButton.addEventListener("click", validatePlatformKeys);

savePromptButton.addEventListener("click", saveSummarizationPrompt);

resetPromptButton.addEventListener("click", async () => {
  const confirmed = window.confirm(
    "Are you sure you want to reset the summarization prompt to the default?"
  );
  if (confirmed) {
    await resetSummarizationPrompt();
  }
});

createPricingPlanButton.addEventListener("click", createPricingPlan);

refreshPricingPlansButton.addEventListener("click", loadPricingPlans);

tabLicense.addEventListener("click", () => setActiveTab("license"));

createLicensePlanButton.addEventListener("click", createLicensePlan);

refreshLicensePlansButton.addEventListener("click", loadLicensePlans);

// Platform API Keys Event Listeners
platformApiKeyAddPermButton.addEventListener("click", () => {
  const toAdd = Array.from(platformApiKeyAvailablePerms.selectedOptions).map(o => o.value);
  if (!toAdd.length) return;
  const current = getSelectedPlatformPermissionsFromSelect(platformApiKeySelectedPerms);
  const updated = [...current, ...toAdd];
  populatePlatformPermissionSelect(platformApiKeyAvailablePerms, updated);
  populateSelectedPlatformPermissions(platformApiKeySelectedPerms, updated);
});

platformApiKeyRemovePermButton.addEventListener("click", () => {
  const toRemove = new Set(Array.from(platformApiKeySelectedPerms.selectedOptions).map(o => o.value));
  if (!toRemove.size) return;
  const current = getSelectedPlatformPermissionsFromSelect(platformApiKeySelectedPerms);
  const updated = current.filter(p => !toRemove.has(p));
  populatePlatformPermissionSelect(platformApiKeyAvailablePerms, updated);
  populateSelectedPlatformPermissions(platformApiKeySelectedPerms, updated);
});

platformApiKeyAddAllButton.addEventListener("click", () => {
  const allPerms = [];
  PLATFORM_API_KEY_PERMISSION_GROUPS.forEach(group => {
    group.permissions.forEach(perm => allPerms.push(perm.value));
  });
  populatePlatformPermissionSelect(platformApiKeyAvailablePerms, allPerms);
  populateSelectedPlatformPermissions(platformApiKeySelectedPerms, allPerms);
});

createPlatformApiKeyButton.addEventListener("click", async () => {
  const name = platformApiKeyNameInput.value.trim();
  const expiryDays = platformApiKeyExpirySelect.value;
  const selectedPermissions = getSelectedPlatformPermissionsFromSelect(platformApiKeySelectedPerms);

  if (!name) {
    createPlatformApiKeyStatus.textContent = "Name is required.";
    return;
  }
  if (selectedPermissions.length === 0) {
    createPlatformApiKeyStatus.textContent = "At least one permission is required.";
    return;
  }

  const body = {
    name,
    permissions: selectedPermissions
  };

  if (expiryDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays, 10));
    body.expiresAt = expiresAt.toISOString();
  }

  createPlatformApiKeyStatus.textContent = "Creating...";

  try {
    const result = await apiRequest("/platform-api-keys", "POST", body);
    createPlatformApiKeyStatus.textContent = "";

    // Show the created key
    platformApiKeyCreatedValue.value = result.key;
    platformApiKeyCreatedCard.classList.remove("hidden");

    // Reset the form
    platformApiKeyNameInput.value = "";
    platformApiKeyExpirySelect.value = "";
    initPlatformCreateKeyPermissions();

    await loadPlatformApiKeys();
  } catch (error) {
    createPlatformApiKeyStatus.textContent = `Error: ${error.message}`;
  }
});

platformApiKeyCopyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(platformApiKeyCreatedValue.value);
    platformApiKeyCopyButton.textContent = "Copied!";
    setTimeout(() => {
      platformApiKeyCopyButton.textContent = "Copy";
      platformApiKeyCreatedCard.classList.add("hidden");
      platformApiKeyCreatedValue.value = "";
    }, 1500);
  } catch (error) {
    console.error("Failed to copy:", error);
  }
});

platformApiKeyDismissButton.addEventListener("click", () => {
  platformApiKeyCreatedCard.classList.add("hidden");
  platformApiKeyCreatedValue.value = "";
});

refreshPlatformApiKeysButton.addEventListener("click", () => {
  loadPlatformApiKeys();
});

platformApiKeyStatusFilter.addEventListener("change", () => {
  renderPlatformApiKeys();
});

// Initialize
(async function init() {
  // Check for OAuth callback
  if (window.location.search.includes("code=")) {
    if (state.apiBaseUrl) {
      await loadCognitoConfig();
      await handleOAuthCallback();
    }
    return;
  }

  // Try to restore session with refresh token
  if (state.apiBaseUrl && state.refreshToken) {
    connectionStatus.textContent = "Restoring session...";
    await loadCognitoConfig();
    const refreshed = await refreshTokens();
    if (refreshed) {
      await loadTenants();
      return;
    }
  }

  showApp(false);
})();
