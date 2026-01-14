const state = {
  apiBaseUrl:
    localStorage.getItem("tenantAdminApiBaseUrl") ||
    "https://ld1t1g7smd.execute-api.us-east-1.amazonaws.com",
  adminId: "",
  adminEmail: localStorage.getItem("tenantAdminEmail") || "",
  tenantId: "",
  tenants: [],
  users: [],
  groups: [],
  userAssignments: {},
  federations: [],
  sentInvites: [],
  receivedInvites: [],
  federationEntries: [],
  transmissions: [],
  transmissionsCursor: null,
  adminLogs: [],
  adminLogsCursor: null,
  elevationRules: [],
  apiKeys: [],
  pricing: {
    planId: null,
    planName: "Default",
    userCost: 2.00,
    dispatcherCost: 5.00,
    transcriptionCost: 2.00,
    translationCost: 3.00,
    elevationRuleCost: 1.00,
    retentionCostPerDay: 0.01
  },
  license: {
    planId: null,
    planName: "Default",
    transcriptionEnabled: true,
    translationEnabled: true,
    aiElevationEnabled: true,
    dataRetentionEnabled: true,
    userLimit: null,
    userCount: 0,
    isOverLimit: false
  }
};

const apiBaseUrlInput = document.getElementById("api-base-url");
const adminEmailInput = document.getElementById("admin-email");
const adminPasswordInput = document.getElementById("admin-password");
const loginButton = document.getElementById("login");
const loginStatus = document.getElementById("login-status");
const loginPanel = document.getElementById("login-panel");
const appPanel = document.getElementById("app-panel");
const tenantSwitcher = document.getElementById("tenant-switcher");
const tenantSelector = document.getElementById("tenant-selector");
const tenantStatus = document.getElementById("tenant-status");
const logoutButton = document.getElementById("logout");
const tabUsers = document.getElementById("tab-users");
const tabGroups = document.getElementById("tab-groups");
const tabFederations = document.getElementById("tab-federations");
const tabLogs = document.getElementById("tab-logs");
const tabAdminLogs = document.getElementById("tab-admin-logs");
const tabPolicies = document.getElementById("tab-policies");
const tabTranscription = document.getElementById("tab-transcription");
const tabTranslation = document.getElementById("tab-translation");
const tabElevation = document.getElementById("tab-elevation");
const tabApiKeys = document.getElementById("tab-api-keys");
const tabBilling = document.getElementById("tab-billing");
const tabLocationHistory = document.getElementById("tab-location-history");
const usersTab = document.getElementById("users-tab");
const groupsTab = document.getElementById("groups-tab");
const federationsTab = document.getElementById("federations-tab");
const logsTab = document.getElementById("logs-tab");
const adminLogsTab = document.getElementById("admin-logs-tab");
const locationHistoryTab = document.getElementById("location-history-tab");
const policiesTab = document.getElementById("policies-tab");
const transcriptionTab = document.getElementById("transcription-tab");
const translationTab = document.getElementById("translation-tab");
const elevationTab = document.getElementById("elevation-tab");
const apiKeysTab = document.getElementById("api-keys-tab");
const billingTab = document.getElementById("billing-tab");

const userNameInput = document.getElementById("user-name");
const userEmailInput = document.getElementById("user-email");
const userRoleSelect = document.getElementById("user-role");
const userStatusSelect = document.getElementById("user-status");
const userTempPasswordInput = document.getElementById("user-temp-password");
const createUserButton = document.getElementById("create-user");
const createUserStatus = document.getElementById("create-user-status");
const userList = document.getElementById("user-list");
const userStatusMessage = document.getElementById("user-status-message");
const userSearchInput = document.getElementById("user-search");
const userStatusFilter = document.getElementById("user-status-filter");
const refreshUsersButton = document.getElementById("refresh-users");
const userCostBreakdown = document.getElementById("user-cost-breakdown");
const userCostMonthly = document.getElementById("user-cost-monthly");
const userCostHint = document.getElementById("user-cost-hint");
const userCostLegendUser = document.getElementById("user-cost-legend-user");
const userCostLegendDispatcher = document.getElementById("user-cost-legend-dispatcher");
const retentionCostHint = document.getElementById("retention-cost-hint");

// Cost constants are now fetched from the API and stored in state.pricing

const groupNameInput = document.getElementById("group-name");
const createGroupButton = document.getElementById("create-group");
const createGroupStatus = document.getElementById("create-group-status");
const groupList = document.getElementById("group-list");
const groupStatus = document.getElementById("group-status");
const groupSearchInput = document.getElementById("group-search");
const refreshGroupsButton = document.getElementById("refresh-groups");
const federationTargetInput = document.getElementById("federation-target");
const createFederationButton = document.getElementById("create-federation");
const federationCreateStatus = document.getElementById("federation-create-status");
const federationCode = document.getElementById("federation-code");
const federationSelf = document.getElementById("federation-self");
const federationInviteIdInput = document.getElementById("federation-invite-id");
const federationCodeInput = document.getElementById("federation-code-input");
const acceptFederationButton = document.getElementById("accept-federation");
const federationAcceptStatus = document.getElementById("federation-accept-status");
const federationList = document.getElementById("federation-list");
const federationStatus = document.getElementById("federation-status");
const refreshFederationsButton = document.getElementById("refresh-federations");

apiBaseUrlInput.value = state.apiBaseUrl;
adminEmailInput.value = state.adminEmail;

function saveState() {
  localStorage.setItem("tenantAdminApiBaseUrl", state.apiBaseUrl);
  localStorage.setItem("tenantAdminEmail", state.adminEmail);
}

function buildHeaders() {
  return {
    "content-type": "application/json",
    "x-tenant-id": state.tenantId,
    "x-user-id": state.adminId,
    "x-role": "TENANT_ADMIN"
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

async function loadAssignmentsForUser(userId) {
  const data = await apiRequest(`/channel-members?userId=${encodeURIComponent(userId)}`, "GET");
  state.userAssignments[userId] = data.members ?? [];
}

function renderAssignmentLists(userId, availableSelect, assignedSelect) {
  const assigned = new Set(
    (state.userAssignments[userId] ?? []).map((assignment) => {
      const tenantId = assignment.channelTenantId ?? state.tenantId;
      return `${tenantId}:${assignment.channelId}`;
    })
  );
  const byName = (a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  const availableGroups = state.groups
    .filter((group) => {
      const tenantId = group.tenantId ?? state.tenantId;
      return !assigned.has(`${tenantId}:${group.channelId}`);
    })
    .sort(byName);
  const assignedGroups = state.groups
    .filter((group) => {
      const tenantId = group.tenantId ?? state.tenantId;
      return assigned.has(`${tenantId}:${group.channelId}`);
    })
    .sort(byName);

  availableSelect.innerHTML = "";
  assignedSelect.innerHTML = "";

  availableGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.channelId;
    option.dataset.tenantId = group.tenantId ?? state.tenantId;
    option.textContent = group.isShared
      ? `${group.name} (shared)`
      : group.name;
    availableSelect.appendChild(option);
  });

  assignedGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.channelId;
    option.dataset.tenantId = group.tenantId ?? state.tenantId;
    option.textContent = group.isShared
      ? `${group.name} (shared)`
      : group.name;
    assignedSelect.appendChild(option);
  });
}

function sortSelectOptions(select) {
  const options = Array.from(select.options).sort((a, b) =>
    a.textContent.localeCompare(b.textContent, "en", { sensitivity: "base" })
  );
  select.innerHTML = "";
  options.forEach((option) => select.appendChild(option));
}

function moveSelectedOptions(source, target) {
  Array.from(source.selectedOptions).forEach((option) => target.appendChild(option));
  sortSelectOptions(source);
  sortSelectOptions(target);
}

async function assignUserToGroup(userId, channelId, channelTenantId) {
  await apiRequest("/channel-members", "POST", { userId, channelId, channelTenantId });
}

async function removeUserFromGroup(userId, channelId, channelTenantId) {
  await apiRequest("/channel-members", "DELETE", { userId, channelId, channelTenantId });
}

async function tenantLogin(email, password) {
  const response = await fetch(`${state.apiBaseUrl}/auth/tenant-login`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "login failed");
  }

  return response.json();
}

function setActiveTab(tab) {
  // Reset all sidebar items
  document.querySelectorAll(".sidebar-item").forEach(item => item.classList.remove("active"));

  // Hide all tab content
  usersTab.classList.add("hidden");
  groupsTab.classList.add("hidden");
  federationsTab.classList.add("hidden");
  logsTab.classList.add("hidden");
  adminLogsTab.classList.add("hidden");
  locationHistoryTab.classList.add("hidden");
  policiesTab.classList.add("hidden");
  transcriptionTab.classList.add("hidden");
  translationTab.classList.add("hidden");
  elevationTab.classList.add("hidden");
  apiKeysTab.classList.add("hidden");
  billingTab.classList.add("hidden");

  // Clear API key created card when leaving the tab
  const apiKeyCreatedCard = document.getElementById("api-key-created-card");
  const apiKeyCreatedValue = document.getElementById("api-key-created-value");
  if (apiKeyCreatedCard && tab !== "api-keys") {
    apiKeyCreatedCard.classList.add("hidden");
    if (apiKeyCreatedValue) apiKeyCreatedValue.value = "";
  }

  if (tab === "groups") {
    tabGroups.classList.add("active");
    groupsTab.classList.remove("hidden");
  } else if (tab === "federations") {
    tabFederations.classList.add("active");
    federationsTab.classList.remove("hidden");
  } else if (tab === "logs") {
    tabLogs.classList.add("active");
    logsTab.classList.remove("hidden");
  } else if (tab === "admin-logs") {
    tabAdminLogs.classList.add("active");
    adminLogsTab.classList.remove("hidden");
  } else if (tab === "location-history") {
    tabLocationHistory.classList.add("active");
    locationHistoryTab.classList.remove("hidden");
  } else if (tab === "policies") {
    tabPolicies.classList.add("active");
    policiesTab.classList.remove("hidden");
  } else if (tab === "transcription") {
    tabTranscription.classList.add("active");
    transcriptionTab.classList.remove("hidden");
  } else if (tab === "translation") {
    tabTranslation.classList.add("active");
    translationTab.classList.remove("hidden");
  } else if (tab === "elevation") {
    tabElevation.classList.add("active");
    elevationTab.classList.remove("hidden");
  } else if (tab === "api-keys") {
    tabApiKeys.classList.add("active");
    apiKeysTab.classList.remove("hidden");
  } else if (tab === "billing") {
    tabBilling.classList.add("active");
    billingTab.classList.remove("hidden");
  } else {
    tabUsers.classList.add("active");
    usersTab.classList.remove("hidden");
  }
}

function setTenantOptions() {
  tenantSelector.innerHTML = "";
  state.tenants.forEach((tenant) => {
    const option = document.createElement("option");
    option.value = tenant.tenantId;
    option.textContent = tenant.name
      ? `${tenant.name} (${tenant.tenantId})`
      : tenant.tenantId;
    tenantSelector.appendChild(option);
  });
  tenantSelector.value = state.tenantId;
  updateTenantStatus();
}

function updateTenantStatus() {
  const tenant = state.tenants.find((item) => item.tenantId === state.tenantId);
  if (!tenant) {
    tenantStatus.textContent = "";
    federationSelf.textContent = "";
    return;
  }
  const status = tenant.status ? `Status: ${tenant.status}` : "";
  tenantStatus.textContent = status;
  federationSelf.textContent = `Your tenant ID: ${tenant.tenantId}`;
}

function showApp(isAuthenticated) {
  if (isAuthenticated) {
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    tenantSwitcher.classList.remove("hidden");
    setActiveTab("users");
  } else {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    tenantSwitcher.classList.add("hidden");
  }
}

function getFilteredUsers(users) {
  const query = userSearchInput.value.trim().toLowerCase();
  const status = userStatusFilter.value;

  return users
    .filter((user) => {
      const matchesQuery =
        query.length === 0 ||
        user.displayName.toLowerCase().includes(query) ||
        (user.email ?? "").toLowerCase().includes(query);
      const matchesStatus = status === "ALL" || user.status === status;
      return matchesQuery && matchesStatus;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "en", { sensitivity: "base" }));
}

function renderUsers(users) {
  userList.innerHTML = "";
  if (!users.length) {
    const empty = document.createElement("p");
    empty.textContent = "No users found.";
    empty.className = "hint";
    userList.appendChild(empty);
    return;
  }

  users.forEach((user) => {
    const item = document.createElement("div");
    item.className = "tenant-item";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${user.displayName}</strong>
      <div class="hint">${user.email ?? "No email"}</div>
      <div class="hint">ID: ${user.userId}</div>
    `;

    const statusWrap = document.createElement("div");
    statusWrap.innerHTML = `
      <span class="hint">Status</span>
      <div><strong>${user.status}</strong></div>
      <div class="hint">Role: ${user.role}</div>
    `;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    editButton.type = "button";
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "danger";
    deleteButton.type = "button";
    const rowFeedback = document.createElement("div");
    rowFeedback.className = "hint";

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    actions.appendChild(rowFeedback);

    const panel = document.createElement("div");
    panel.className = "admin-panel hidden";

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Display Name
        <input name="displayName" type="text" value="${user.displayName}" />
      </label>
      <label>
        Email
        <input name="email" type="email" value="${user.email ?? ""}" />
      </label>
      <label>
        Role
        <select name="role">
          <option value="USER">USER</option>
          <option value="DISPATCHER">DISPATCHER</option>
          <option value="TENANT_ADMIN">TENANT_ADMIN</option>
        </select>
      </label>
      <label>
        Status
        <select name="status">
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
        </select>
      </label>
      <label>
        Temp Password
        <input name="tempPassword" type="password" placeholder="Set new temp password" />
      </label>
    `;

    editForm.querySelector("select[name='role']").value = user.role;
    editForm.querySelector("select[name='status']").value = user.status;

    const editActions = document.createElement("div");
    editActions.className = "row";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const feedback = document.createElement("div");
    feedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const displayName = editForm.querySelector("input[name='displayName']").value.trim();
      const email = editForm.querySelector("input[name='email']").value.trim();
      const role = editForm.querySelector("select[name='role']").value;
      const status = editForm.querySelector("select[name='status']").value;
      const tempPassword = editForm.querySelector("input[name='tempPassword']").value.trim();

      if (!displayName || !email) {
        feedback.textContent = "Display name and email are required.";
        return;
      }

      feedback.textContent = "Saving...";
      const updates = { displayName, email, role, status };
      if (tempPassword) {
        updates.tempPassword = tempPassword;
      }

      try {
        await apiRequest(`/users/${user.userId}`, "PATCH", updates);
        feedback.textContent = "Saved.";
        await loadUsers();
      } catch (error) {
        feedback.textContent = `Save failed: ${error.message}`;
      }
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(feedback);

    const assignmentGrid = document.createElement("div");
    assignmentGrid.className = "assignment-grid";
    assignmentGrid.innerHTML = `
      <div>
        <h3>Available Groups</h3>
        <select class="available-groups" multiple size="8"></select>
      </div>
      <div class="assignment-actions">
        <button class="assign-group">Assign &gt;&gt;</button>
        <button class="remove-group secondary">&lt;&lt; Remove</button>
      </div>
      <div>
        <h3>Assigned Groups</h3>
        <select class="assigned-groups" multiple size="8"></select>
      </div>
    `;

    const availableSelect = assignmentGrid.querySelector(".available-groups");
    const assignedSelect = assignmentGrid.querySelector(".assigned-groups");
    const assignButton = assignmentGrid.querySelector(".assign-group");
    const removeButton = assignmentGrid.querySelector(".remove-group");

    assignButton.addEventListener("click", async () => {
      const selected = Array.from(availableSelect.selectedOptions).map((opt) => ({
        channelId: opt.value,
        channelTenantId: opt.dataset.tenantId || state.tenantId
      }));
      if (!selected.length) {
        return;
      }
      feedback.textContent = "Assigning...";
      try {
        for (const selection of selected) {
          await assignUserToGroup(user.userId, selection.channelId, selection.channelTenantId);
        }
        await loadAssignmentsForUser(user.userId);
        renderAssignmentLists(user.userId, availableSelect, assignedSelect);
        feedback.textContent = "";
      } catch (error) {
        feedback.textContent = `Assign failed: ${error.message}`;
      }
    });

    removeButton.addEventListener("click", async () => {
      const selected = Array.from(assignedSelect.selectedOptions).map((opt) => ({
        channelId: opt.value,
        channelTenantId: opt.dataset.tenantId || state.tenantId
      }));
      if (!selected.length) {
        return;
      }
      feedback.textContent = "Removing...";
      try {
        for (const selection of selected) {
          await removeUserFromGroup(user.userId, selection.channelId, selection.channelTenantId);
        }
        await loadAssignmentsForUser(user.userId);
        renderAssignmentLists(user.userId, availableSelect, assignedSelect);
        feedback.textContent = "";
      } catch (error) {
        feedback.textContent = `Remove failed: ${error.message}`;
      }
    });

    panel.appendChild(editForm);
    panel.appendChild(editActions);
    panel.appendChild(assignmentGrid);

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        `Delete ${user.displayName} (${user.email ?? "no email"})?`
      );
      if (!confirmed) {
        return;
      }

      feedback.textContent = "Deleting...";
      try {
        await apiRequest(`/users/${user.userId}`, "DELETE");
        feedback.textContent = "Deleted.";
        await loadUsers();
      } catch (error) {
        feedback.textContent = `Delete failed: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);
    item.appendChild(panel);
    userList.appendChild(item);

    editButton.addEventListener("click", async () => {
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) {
        if (!state.groups.length) {
          await loadGroups();
        }
        await loadAssignmentsForUser(user.userId);
        renderAssignmentLists(user.userId, availableSelect, assignedSelect);
      }
    });
  });
}

async function loadTenantPricing() {
  if (!state.tenantId) {
    return;
  }
  try {
    const data = await apiRequest("/tenant-pricing", "GET");
    state.pricing = {
      planId: data.planId ?? null,
      planName: data.planName ?? "Default",
      userCost: data.pricing?.userCost ?? 2.00,
      dispatcherCost: data.pricing?.dispatcherCost ?? 5.00,
      transcriptionCost: data.pricing?.transcriptionCost ?? 2.00,
      translationCost: data.pricing?.translationCost ?? 3.00,
      elevationRuleCost: data.pricing?.elevationRuleCost ?? 1.00,
      retentionCostPerDay: data.pricing?.retentionCostPerDay ?? 0.01
    };
  } catch (error) {
    // Use default pricing if fetch fails
    console.warn("Failed to load tenant pricing, using defaults:", error.message);
  }
  // Update pricing hints in the UI
  updatePricingHints();
}

function updatePricingHints() {
  const p = state.pricing;
  userCostHint.textContent = `$${p.userCost.toFixed(2)}/month for users and admins. $${p.dispatcherCost.toFixed(2)}/month for dispatchers.`;
  userCostLegendUser.textContent = `User/Admin ($${p.userCost.toFixed(2)})`;
  userCostLegendDispatcher.textContent = `Dispatcher ($${p.dispatcherCost.toFixed(2)})`;
  retentionCostHint.textContent = `First 30 days free. $${p.retentionCostPerDay.toFixed(2)} per user per day beyond 30. Effective retention = max(tenant, user, channel).`;
}

async function loadTenantLicense() {
  if (!state.tenantId) {
    return;
  }
  try {
    const data = await apiRequest("/tenant-license", "GET");
    state.license = {
      planId: data.planId ?? null,
      planName: data.planName ?? "Default",
      transcriptionEnabled: data.license?.transcriptionEnabled ?? true,
      translationEnabled: data.license?.translationEnabled ?? true,
      aiElevationEnabled: data.license?.aiElevationEnabled ?? true,
      dataRetentionEnabled: data.license?.dataRetentionEnabled ?? true,
      userLimit: data.license?.userLimit ?? null,
      userCount: data.userCount ?? 0,
      isOverLimit: data.isOverLimit ?? false
    };
  } catch (error) {
    // Use default license if fetch fails (all features enabled)
    console.warn("Failed to load tenant license, using defaults:", error.message);
  }
  applyLicenseRestrictions();
}

function applyLicenseRestrictions() {
  const { transcriptionEnabled, translationEnabled, aiElevationEnabled, dataRetentionEnabled } = state.license;

  // Transcription tab restrictions
  const transcriptionWarning = document.getElementById("transcription-license-warning");
  if (transcriptionWarning) {
    if (!transcriptionEnabled) {
      transcriptionWarning.classList.remove("hidden");
      tenantTranscriptionToggle.disabled = true;
      saveTenantTranscriptionButton.disabled = true;
    } else {
      transcriptionWarning.classList.add("hidden");
      tenantTranscriptionToggle.disabled = false;
      saveTenantTranscriptionButton.disabled = false;
    }
  }

  // Translation tab restrictions
  const translationWarning = document.getElementById("translation-license-warning");
  if (translationWarning) {
    if (!transcriptionEnabled || !translationEnabled) {
      translationWarning.classList.remove("hidden");
      tenantTranslationToggle.disabled = true;
      saveTenantTranslationButton.disabled = true;
    } else {
      translationWarning.classList.add("hidden");
      // Note: These may still be disabled by transcription being off at the tenant level
    }
  }

  // AI Elevation tab restrictions
  const elevationWarning = document.getElementById("elevation-license-warning");
  if (elevationWarning) {
    if (!transcriptionEnabled || !aiElevationEnabled) {
      elevationWarning.classList.remove("hidden");
      createElevationRuleButton.disabled = true;
    } else {
      elevationWarning.classList.add("hidden");
      createElevationRuleButton.disabled = false;
    }
  }

  // Data Retention tab restrictions
  const retentionWarning = document.getElementById("retention-license-warning");
  if (retentionWarning) {
    if (!dataRetentionEnabled) {
      retentionWarning.classList.remove("hidden");
      tenantRetentionSelect.disabled = true;
      saveTenantRetentionButton.disabled = true;
    } else {
      retentionWarning.classList.add("hidden");
      tenantRetentionSelect.disabled = false;
      saveTenantRetentionButton.disabled = false;
    }
  }

  // User limit display and enforcement
  updateUserLimitDisplay();
}

function updateUserLimitDisplay() {
  const { userLimit, userCount, isOverLimit } = state.license;
  const userLimitDisplay = document.getElementById("user-limit-display");
  const complianceWarning = document.getElementById("user-compliance-warning");

  // Update user count display
  if (userLimitDisplay) {
    if (userLimit === null) {
      userLimitDisplay.textContent = `${userCount} users`;
      userLimitDisplay.className = "";
    } else {
      userLimitDisplay.textContent = `${userCount} / ${userLimit} users`;
      userLimitDisplay.className = isOverLimit ? "user-limit-exceeded" : "";
    }
  }

  // Disable create user button if at or over limit
  if (userLimit !== null && userCount >= userLimit) {
    createUserButton.disabled = true;
    createUserStatus.textContent = `User limit reached (${userLimit}). Deactivate users to add more.`;
  } else if (!isOverLimit) {
    createUserButton.disabled = false;
    if (createUserStatus.textContent.includes("User limit")) {
      createUserStatus.textContent = "";
    }
  }

  // Show compliance warning if over limit
  if (complianceWarning) {
    if (isOverLimit) {
      complianceWarning.classList.remove("hidden");
      complianceWarning.textContent = `Warning: You have ${userCount} users but your license only allows ${userLimit}. Please deactivate ${userCount - userLimit} user(s) to comply with your license.`;
    } else {
      complianceWarning.classList.add("hidden");
    }
  }
}

async function loadUsers() {
  if (!state.tenantId) {
    return;
  }
  try {
    userStatusMessage.textContent = "Loading users...";
    const data = await apiRequest("/users?limit=200", "GET");
    state.users = data.users ?? [];
    renderUsers(getFilteredUsers(state.users));
    updateUserCostCalculator();
    userStatusMessage.textContent = "";
  } catch (error) {
    userStatusMessage.textContent = `Failed to load users: ${error.message}`;
  }
}

function updateUserCostCalculator() {
  const users = state.users || [];

  if (users.length === 0) {
    userCostBreakdown.textContent = "No users";
    userCostMonthly.textContent = "0.00";
    return;
  }

  const dispatchers = users.filter(u => u.role === "DISPATCHER");
  const others = users.filter(u => u.role !== "DISPATCHER");

  const dispatcherCost = dispatchers.length * state.pricing.dispatcherCost;
  const otherCost = others.length * state.pricing.userCost;
  const monthly = (dispatcherCost + otherCost).toFixed(2);

  let breakdownLines = [];

  if (others.length > 0) {
    breakdownLines.push(`<span style="color:#22c55e">●</span> ${others.length} user${others.length > 1 ? 's' : ''}/admin${others.length > 1 ? 's' : ''} × $${state.pricing.userCost.toFixed(2)} = $${otherCost.toFixed(2)}`);
  }
  if (dispatchers.length > 0) {
    breakdownLines.push(`<span style="color:#eab308">●</span> ${dispatchers.length} dispatcher${dispatchers.length > 1 ? 's' : ''} × $${state.pricing.dispatcherCost.toFixed(2)} = $${dispatcherCost.toFixed(2)}`);
  }

  userCostBreakdown.innerHTML = breakdownLines.join('<br>');
  userCostMonthly.textContent = monthly;
}

function getFilteredGroups(groups) {
  const query = groupSearchInput.value.trim().toLowerCase();
  return groups
    .filter((group) => (query.length === 0 ? true : group.name.toLowerCase().includes(query)))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function renderGroupMembershipLists(users, assignedUserIds, availableSelect, assignedSelect) {
  const byName = (a, b) => a.displayName.localeCompare(b.displayName, "en", { sensitivity: "base" });
  const availableUsers = users.filter((user) => !assignedUserIds.has(user.userId)).sort(byName);
  const assignedUsers = users.filter((user) => assignedUserIds.has(user.userId)).sort(byName);

  availableSelect.innerHTML = "";
  assignedSelect.innerHTML = "";

  availableUsers.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = `${user.displayName} (${user.email ?? "no email"})`;
    availableSelect.appendChild(option);
  });

  assignedUsers.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = `${user.displayName} (${user.email ?? "no email"})`;
    assignedSelect.appendChild(option);
  });
}

function renderGroups(groups) {
  groupList.innerHTML = "";
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.textContent = "No groups found.";
    empty.className = "hint";
    groupList.appendChild(empty);
    return;
  }

  const localGroups = groups.filter((group) => !group.isShared && !group.isSharedOut);
  const sharedOutGroups = groups.filter((group) => !group.isShared && group.isSharedOut);
  const sharedGroups = groups.filter((group) => group.isShared);

  const renderSection = (title, items) => {
    const header = document.createElement("h3");
    header.textContent = title;
    groupList.appendChild(header);

    if (!items.length) {
      const empty = document.createElement("p");
      empty.textContent = "None.";
      empty.className = "hint";
      groupList.appendChild(empty);
      return;
    }

    items.forEach((group) => {
      const item = document.createElement("div");
      item.className = "tenant-item";

      const meta = document.createElement("div");
      let sharedLabel = "";
      if (group.isShared) {
        sharedLabel = `Shared from ${group.tenantId}`;
      } else if (group.isSharedOut) {
        sharedLabel = "Shared out to partner tenants";
      }
      const priorityBadge = group.isPriorityGroup ? '<span style="background: #dc2626; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">PRIORITY</span>' : '';
      const geoBadge = group.geoEnabled ? '<span style="background: #0891b2; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 8px;">GEO</span>' : '';
      const geoInfo = group.geoEnabled ? `<div class="hint">📍 ${group.geoAddress || `${group.geoLat?.toFixed(4)}, ${group.geoLng?.toFixed(4)}`} (${group.geoRadiusMeters}m)</div>` : '';
      meta.innerHTML = `
        <strong>${group.name}</strong>${priorityBadge}${geoBadge}
        <div class="hint">ID: ${group.channelId}</div>
        <div class="hint">Created: ${group.createdAt ?? "n/a"}</div>
        ${geoInfo}
        ${sharedLabel ? `<div class="hint">${sharedLabel}</div>` : ""}
      `;

    const placeholder = document.createElement("div");
    placeholder.className = "hint";
    placeholder.textContent = "";

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

    const panel = document.createElement("div");
    panel.className = "admin-panel hidden";

    const editForm = document.createElement("div");
    editForm.className = "grid";
    editForm.innerHTML = `
      <label>
        Group Name
        <input name="groupName" type="text" value="${group.name}" />
      </label>
      <label style="flex-direction: row; align-items: center; gap: 8px;">
        <input name="isPriorityGroup" type="checkbox" ${group.isPriorityGroup ? 'checked' : ''} style="width: 18px; height: 18px;" />
        <span>Priority Group</span>
      </label>
      <label style="flex-direction: row; align-items: center; gap: 8px;">
        <input name="geoEnabled" type="checkbox" ${group.geoEnabled ? 'checked' : ''} style="width: 18px; height: 18px;" />
        <span>Enable Geo-Fence</span>
      </label>
      <div class="edit-geo-fields ${group.geoEnabled ? '' : 'hidden'}" style="grid-column: 1 / -1;">
        <div class="grid" style="margin-top: 0.5rem;">
          <label>
            Address (optional)
            <input name="geoAddress" type="text" value="${group.geoAddress || ''}" placeholder="123 Main St, City" />
          </label>
        </div>
        <div class="grid" style="margin-top: 0.5rem;">
          <label>
            Latitude
            <input name="geoLat" type="number" step="0.000001" value="${group.geoLat || ''}" placeholder="37.7749" />
          </label>
          <label>
            Longitude
            <input name="geoLng" type="number" step="0.000001" value="${group.geoLng || ''}" placeholder="-122.4194" />
          </label>
          <label>
            Radius
            <select name="geoRadiusMeters">
              <option value="100" ${group.geoRadiusMeters === 100 ? 'selected' : ''}>100m</option>
              <option value="250" ${group.geoRadiusMeters === 250 ? 'selected' : ''}>250m</option>
              <option value="500" ${!group.geoRadiusMeters || group.geoRadiusMeters === 500 ? 'selected' : ''}>500m</option>
              <option value="1000" ${group.geoRadiusMeters === 1000 ? 'selected' : ''}>1km</option>
              <option value="5000" ${group.geoRadiusMeters === 5000 ? 'selected' : ''}>5km</option>
            </select>
          </label>
        </div>
        <div class="hint" style="margin-top: 0.5rem;">Click on the map to set the geo-fence location.</div>
        <div class="edit-geo-map" style="height: 300px; border-radius: 8px; background: #1a1a2e; margin-top: 0.5rem;"></div>
      </div>
      <div class="hint" style="grid-column: 1 / -1;">Priority groups auto-elevate all messages. Geo-fenced groups grant temporary access to users within the defined area.</div>
    `;

    // Toggle geo fields visibility in edit form
    const geoEnabledCheckbox = editForm.querySelector("input[name='geoEnabled']");
    const editGeoFields = editForm.querySelector(".edit-geo-fields");
    const editGeoMapContainer = editForm.querySelector(".edit-geo-map");
    let editGeoMap = null;
    let editGeoMarker = null;
    let editGeoCircle = null;

    function initEditGeoMap() {
      if (editGeoMap) {
        editGeoMap.invalidateSize();
        return;
      }

      const initialLat = group.geoLat || 39.8283;
      const initialLng = group.geoLng || -98.5795;
      const initialZoom = group.geoLat ? 15 : 4;

      editGeoMap = L.map(editGeoMapContainer).setView([initialLat, initialLng], initialZoom);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(editGeoMap);

      // If group already has coordinates, show marker and circle
      if (group.geoLat && group.geoLng) {
        updateEditGeoMapMarker(group.geoLat, group.geoLng);
      }

      // Handle map clicks
      editGeoMap.on("click", (e) => {
        const { lat, lng } = e.latlng;
        editForm.querySelector("input[name='geoLat']").value = lat.toFixed(6);
        editForm.querySelector("input[name='geoLng']").value = lng.toFixed(6);
        updateEditGeoMapMarker(lat, lng);
      });
    }

    function updateEditGeoMapMarker(lat, lng) {
      const radius = parseInt(editForm.querySelector("select[name='geoRadiusMeters']").value) || 500;

      if (editGeoMarker) {
        editGeoMap.removeLayer(editGeoMarker);
      }
      if (editGeoCircle) {
        editGeoMap.removeLayer(editGeoCircle);
      }

      editGeoCircle = L.circle([lat, lng], {
        radius: radius,
        color: "#0891b2",
        fillColor: "#0891b2",
        fillOpacity: 0.2,
        weight: 2
      }).addTo(editGeoMap);

      editGeoMarker = L.marker([lat, lng]).addTo(editGeoMap);

      // Fit map to show the circle
      editGeoMap.fitBounds(editGeoCircle.getBounds(), { padding: [20, 20] });
    }

    geoEnabledCheckbox.addEventListener("change", () => {
      editGeoFields.classList.toggle("hidden", !geoEnabledCheckbox.checked);
      if (geoEnabledCheckbox.checked) {
        setTimeout(() => initEditGeoMap(), 100);
      }
    });

    // If geo is already enabled, init map when panel opens
    if (group.geoEnabled) {
      setTimeout(() => initEditGeoMap(), 100);
    }

    // Update map when lat/lng fields change
    editForm.querySelector("input[name='geoLat']").addEventListener("change", () => {
      const lat = parseFloat(editForm.querySelector("input[name='geoLat']").value);
      const lng = parseFloat(editForm.querySelector("input[name='geoLng']").value);
      if (!isNaN(lat) && !isNaN(lng) && editGeoMap) {
        updateEditGeoMapMarker(lat, lng);
      }
    });

    editForm.querySelector("input[name='geoLng']").addEventListener("change", () => {
      const lat = parseFloat(editForm.querySelector("input[name='geoLat']").value);
      const lng = parseFloat(editForm.querySelector("input[name='geoLng']").value);
      if (!isNaN(lat) && !isNaN(lng) && editGeoMap) {
        updateEditGeoMapMarker(lat, lng);
      }
    });

    // Update circle when radius changes
    editForm.querySelector("select[name='geoRadiusMeters']").addEventListener("change", () => {
      const lat = parseFloat(editForm.querySelector("input[name='geoLat']").value);
      const lng = parseFloat(editForm.querySelector("input[name='geoLng']").value);
      if (!isNaN(lat) && !isNaN(lng) && editGeoMap) {
        updateEditGeoMapMarker(lat, lng);
      }
    });

    const editActions = document.createElement("div");
    editActions.className = "row";
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save changes";
    const feedback = document.createElement("div");
    feedback.className = "hint";

    saveButton.addEventListener("click", async () => {
      const name = editForm.querySelector("input[name='groupName']").value.trim();
      const isPriorityGroup = editForm.querySelector("input[name='isPriorityGroup']").checked;
      const geoEnabled = editForm.querySelector("input[name='geoEnabled']").checked;

      if (!name) {
        feedback.textContent = "Group name is required.";
        return;
      }

      const payload = { name, isPriorityGroup, geoEnabled };

      if (geoEnabled) {
        const geoLat = parseFloat(editForm.querySelector("input[name='geoLat']").value);
        const geoLng = parseFloat(editForm.querySelector("input[name='geoLng']").value);
        if (isNaN(geoLat) || isNaN(geoLng)) {
          feedback.textContent = "Geo-fence requires valid coordinates.";
          return;
        }
        payload.geoLat = geoLat;
        payload.geoLng = geoLng;
        payload.geoRadiusMeters = parseInt(editForm.querySelector("select[name='geoRadiusMeters']").value);
        const geoAddress = editForm.querySelector("input[name='geoAddress']").value.trim();
        if (geoAddress) payload.geoAddress = geoAddress;
      }

      feedback.textContent = "Saving...";
      try {
        await apiRequest(`/channels/${group.channelId}`, "PATCH", payload);
        feedback.textContent = "Saved.";
        geoChannelsCache = null; // Invalidate cache for location history
        await loadGroups();
      } catch (error) {
        feedback.textContent = `Save failed: ${error.message}`;
      }
    });

    editActions.appendChild(saveButton);
    editActions.appendChild(feedback);

    const membershipGrid = document.createElement("div");
    membershipGrid.className = "assignment-grid";
    membershipGrid.innerHTML = `
      <div>
        <h3>Available Users</h3>
        <select class="available-users" multiple size="8"></select>
      </div>
      <div class="assignment-actions">
        <button class="assign-user">Assign &gt;&gt;</button>
        <button class="remove-user secondary">&lt;&lt; Remove</button>
      </div>
      <div>
        <h3>Assigned Users</h3>
        <select class="assigned-users" multiple size="8"></select>
      </div>
    `;

    const availableUsersSelect = membershipGrid.querySelector(".available-users");
    const assignedUsersSelect = membershipGrid.querySelector(".assigned-users");
    const assignUserButton = membershipGrid.querySelector(".assign-user");
    const removeUserButton = membershipGrid.querySelector(".remove-user");
    let assignedUserIds = new Set();

    assignUserButton.addEventListener("click", async () => {
      const selected = Array.from(availableUsersSelect.selectedOptions).map((opt) => opt.value);
      if (!selected.length) {
        return;
      }
      feedback.textContent = "Assigning...";
      try {
        for (const userId of selected) {
          await assignUserToGroup(userId, group.channelId, group.tenantId ?? state.tenantId);
        }
        const memberData = await apiRequest(
          `/channel-members?channelId=${encodeURIComponent(group.channelId)}&channelTenantId=${encodeURIComponent(
            group.tenantId ?? state.tenantId
          )}`,
          "GET"
        );
        assignedUserIds = new Set((memberData.members ?? []).map((member) => member.userId));
        renderGroupMembershipLists(state.users, assignedUserIds, availableUsersSelect, assignedUsersSelect);
        feedback.textContent = "";
      } catch (error) {
        feedback.textContent = `Assign failed: ${error.message}`;
      }
    });

    removeUserButton.addEventListener("click", async () => {
      const selected = Array.from(assignedUsersSelect.selectedOptions).map((opt) => opt.value);
      if (!selected.length) {
        return;
      }
      feedback.textContent = "Removing...";
      try {
        for (const userId of selected) {
          await removeUserFromGroup(userId, group.channelId, group.tenantId ?? state.tenantId);
        }
        const memberData = await apiRequest(
          `/channel-members?channelId=${encodeURIComponent(group.channelId)}&channelTenantId=${encodeURIComponent(
            group.tenantId ?? state.tenantId
          )}`,
          "GET"
        );
        assignedUserIds = new Set((memberData.members ?? []).map((member) => member.userId));
        renderGroupMembershipLists(state.users, assignedUserIds, availableUsersSelect, assignedUsersSelect);
        feedback.textContent = "";
      } catch (error) {
        feedback.textContent = `Remove failed: ${error.message}`;
      }
    });

    panel.appendChild(editForm);
    panel.appendChild(editActions);
    panel.appendChild(membershipGrid);

    editButton.addEventListener("click", () => {
      panel.classList.toggle("hidden");
      if (!panel.classList.contains("hidden")) {
        const ensureUsers = state.users.length ? Promise.resolve() : loadUsers();
        ensureUsers
          .then(async () => {
            const memberData = await apiRequest(
              `/channel-members?channelId=${encodeURIComponent(
                group.channelId
              )}&channelTenantId=${encodeURIComponent(group.tenantId ?? state.tenantId)}`,
              "GET"
            );
            assignedUserIds = new Set((memberData.members ?? []).map((member) => member.userId));
            renderGroupMembershipLists(
              state.users,
              assignedUserIds,
              availableUsersSelect,
              assignedUsersSelect
            );
          })
          .catch(() => null);
      }
    });

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete group ${group.name}?`);
      if (!confirmed) {
        return;
      }
      feedback.textContent = "Deleting...";
      try {
        await apiRequest(`/channels/${group.channelId}`, "DELETE");
        feedback.textContent = "Deleted.";
        await loadGroups();
      } catch (error) {
        feedback.textContent = `Delete failed: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(placeholder);
    item.appendChild(actions);
      item.appendChild(panel);
      groupList.appendChild(item);

    if (group.isShared) {
      editForm.querySelector("input[name='groupName']").disabled = true;
      editForm.querySelector("input[name='isPriorityGroup']").disabled = true;
      deleteButton.disabled = true;
      editButton.title = "Edit membership for shared group.";
      deleteButton.title = "Shared group cannot be deleted here.";
    }
  });
  };

  renderSection("Local Groups", localGroups);
  renderSection("Shared Out", sharedOutGroups);
  renderSection("Shared With Me", sharedGroups);
}

async function loadGroups() {
  if (!state.tenantId) {
    return;
  }
  try {
    groupStatus.textContent = "Loading groups...";
    const data = await apiRequest("/channels?limit=200", "GET");
    const groups = data.channels ?? [];
    try {
      const federationData = await apiRequest("/federations", "GET");
      const sharedOutIds = new Set(
        (federationData.federations ?? []).flatMap(
          (federation) => federation.sharedChannelIds ?? []
        )
      );
      groups.forEach((group) => {
        const tenantId = group.tenantId ?? state.tenantId;
        if (tenantId === state.tenantId && sharedOutIds.has(group.channelId)) {
          group.isSharedOut = true;
        }
      });
    } catch (error) {
      // If federation lookup fails, keep groups list as-is.
    }
    state.groups = groups;
    renderGroups(getFilteredGroups(state.groups));
    groupStatus.textContent = "";
  } catch (error) {
    groupStatus.textContent = `Failed to load groups: ${error.message}`;
  }
}

function getFederationDisplayName(entry) {
  return entry.partnerName || entry.partnerId || "Unknown tenant";
}

function renderFederations() {
  federationList.innerHTML = "";
  if (!state.federationEntries.length) {
    const empty = document.createElement("p");
    empty.textContent = "No federations yet.";
    empty.className = "hint";
    federationList.appendChild(empty);
    return;
  }

  state.federationEntries.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "tenant-item";
    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${getFederationDisplayName(entry)}</strong>
      <div class="hint">Status: ${entry.statusLabel}</div>
    `;

    const statusWrap = document.createElement("div");
    if (entry.type === "federation") {
      statusWrap.innerHTML = `
        <span class="hint">Current Status</span>
        <div><strong>${entry.statusLabel}</strong></div>
        <div class="hint">Created: ${entry.createdAt ?? "n/a"}</div>
      `;
    } else {
      statusWrap.innerHTML = `
        <span class="hint">Invite</span>
        <div class="hint">ID: ${entry.inviteId}</div>
        <div class="hint">Expires: ${entry.expiresAt ?? "n/a"}</div>
      `;
    }

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className = "secondary";
    editButton.type = "button";
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "danger";
    deleteButton.type = "button";
    const rowFeedback = document.createElement("div");
    rowFeedback.className = "hint";

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    actions.appendChild(rowFeedback);

    const panel = document.createElement("div");
    panel.className = "admin-panel hidden";

    const panelBody = document.createElement("div");
    panelBody.className = "grid";
    const panelActions = document.createElement("div");
    panelActions.className = "row";
    const feedback = document.createElement("div");
    feedback.className = "hint";
    let assignmentGrid = null;

    if (entry.type === "federation") {
      panelBody.innerHTML = `
        <label>
          Status
          <select name="status">
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </label>
      `;
      panelBody.querySelector("select[name='status']").value = entry.status;

      assignmentGrid = document.createElement("div");
      assignmentGrid.className = "assignment-grid";

      const availableWrap = document.createElement("div");
      availableWrap.innerHTML = "<h3>Available Groups</h3>";
      const availableSelect = document.createElement("select");
      availableSelect.multiple = true;
      availableSelect.size = 6;
      availableWrap.appendChild(availableSelect);

      const sharedWrap = document.createElement("div");
      sharedWrap.innerHTML = "<h3>Shared Groups</h3>";
      const sharedSelect = document.createElement("select");
      sharedSelect.multiple = true;
      sharedSelect.size = 6;
      sharedWrap.appendChild(sharedSelect);

      const actionWrap = document.createElement("div");
      actionWrap.className = "assignment-actions";
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.textContent = "Share >>";
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "secondary";
      removeButton.textContent = "<< Unshare";
      actionWrap.appendChild(addButton);
      actionWrap.appendChild(removeButton);

      const sharedIds = new Set(entry.sharedChannelIds ?? []);
      const sortedGroups = [...state.groups]
        .filter((group) => (group.tenantId ?? state.tenantId) === state.tenantId)
        .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
      sortedGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.channelId;
        option.textContent = group.name;
        if (sharedIds.has(group.channelId)) {
          sharedSelect.appendChild(option);
        } else {
          availableSelect.appendChild(option);
        }
      });

      addButton.addEventListener("click", (event) => {
        event.preventDefault();
        moveSelectedOptions(availableSelect, sharedSelect);
      });
      removeButton.addEventListener("click", (event) => {
        event.preventDefault();
        moveSelectedOptions(sharedSelect, availableSelect);
      });

      assignmentGrid.appendChild(availableWrap);
      assignmentGrid.appendChild(actionWrap);
      assignmentGrid.appendChild(sharedWrap);

      const saveButton = document.createElement("button");
      saveButton.textContent = "Save changes";
      saveButton.addEventListener("click", async () => {
        const status = panelBody.querySelector("select[name='status']").value;
        const sharedChannelIds = Array.from(sharedSelect.options).map((option) => option.value);
        feedback.textContent = "Saving...";
        try {
          await apiRequest(`/federations/${entry.partnerId}`, "PATCH", {
            status,
            sharedChannelIds
          });
          feedback.textContent = "Saved.";
          await loadFederations();
        } catch (error) {
          feedback.textContent = `Save failed: ${error.message}`;
        }
      });

      panelActions.appendChild(saveButton);
    } else if (entry.direction === "received") {
      panelBody.innerHTML = `
        <label>
          Verification Code
          <input name="code" type="text" placeholder="6-digit code" />
        </label>
      `;

      const acceptButton = document.createElement("button");
      acceptButton.textContent = "Accept invite";
      acceptButton.addEventListener("click", async () => {
        const code = panelBody.querySelector("input[name='code']").value.trim();
        if (!code) {
          feedback.textContent = "Verification code is required.";
          return;
        }
        feedback.textContent = "Accepting...";
        try {
          await apiRequest("/federation-invites/accept", "POST", {
            inviteId: entry.inviteId,
            code
          });
          feedback.textContent = "Accepted.";
          await loadFederations();
        } catch (error) {
          feedback.textContent = `Accept failed: ${error.message}`;
        }
      });

      panelActions.appendChild(acceptButton);
    } else {
      panelBody.innerHTML = `
        <p class="hint">Waiting on remote acceptance.</p>
      `;
    }

    panelActions.appendChild(feedback);
    panel.appendChild(panelBody);
    if (assignmentGrid) {
      panel.appendChild(assignmentGrid);
    }
    panel.appendChild(panelActions);

    editButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      panel.classList.toggle("hidden");
    });

    deleteButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      rowFeedback.textContent = "Deleting...";
      try {
        if (entry.type === "federation") {
          await apiRequest(`/federations/${entry.partnerId}`, "DELETE");
        } else {
          await apiRequest(`/federation-invites/${entry.inviteId}`, "DELETE");
        }
        rowFeedback.textContent = "Deleted.";
        await loadFederations();
      } catch (error) {
        rowFeedback.textContent = `Delete failed: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);
    item.appendChild(panel);
    federationList.appendChild(item);
  });
}

async function loadFederations() {
  if (!state.tenantId) {
    return;
  }
  try {
    federationStatus.textContent = "Loading federations...";
    const [federations, received, sent] = await Promise.all([
      apiRequest("/federations", "GET"),
      apiRequest("/federation-invites?direction=received", "GET"),
      apiRequest("/federation-invites?direction=sent", "GET")
    ]);
    state.federations = federations.federations ?? [];
    state.receivedInvites = received.invites ?? [];
    state.sentInvites = sent.invites ?? [];
    const federationEntries = [];

    state.federations.forEach((federation) => {
      federationEntries.push({
        type: "federation",
        partnerId: federation.partnerId,
        partnerName: federation.partnerName,
        status: federation.status,
        statusLabel: federation.status === "SUSPENDED" ? "Suspended" : "Active",
        sharedChannelIds: federation.sharedChannelIds ?? [],
        createdAt: federation.createdAt
      });
    });

    state.receivedInvites.forEach((invite) => {
      federationEntries.push({
        type: "invite",
        direction: "received",
        inviteId: invite.inviteId,
        partnerId: invite.fromTenantId,
        partnerName: invite.fromTenantName,
        statusLabel: "Pending acceptance",
        expiresAt: invite.expiresAt
      });
    });

    state.sentInvites.forEach((invite) => {
      federationEntries.push({
        type: "invite",
        direction: "sent",
        inviteId: invite.inviteId,
        partnerId: invite.toTenantId,
        partnerName: invite.toTenantName,
        statusLabel: "Pending remote acceptance",
        expiresAt: invite.expiresAt
      });
    });

    state.federationEntries = federationEntries.sort((a, b) =>
      getFederationDisplayName(a).localeCompare(getFederationDisplayName(b))
    );
    renderFederations();
    federationStatus.textContent = "";
  } catch (error) {
    federationStatus.textContent = `Failed to load federations: ${error.message}`;
  }
}

loginButton.addEventListener("click", async () => {
  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value.trim();
  state.apiBaseUrl = apiBaseUrlInput.value.trim();
  state.adminEmail = email;

  if (!state.apiBaseUrl || !email || !password) {
    loginStatus.textContent = "API base URL, email, and password are required.";
    return;
  }

  loginStatus.textContent = "Signing in...";
  saveState();

  try {
    const result = await tenantLogin(email, password);
    state.adminId = result.adminId;
    state.tenants = result.tenants ?? [];
    state.tenantId = result.defaultTenantId ?? state.tenants[0]?.tenantId ?? "";
    setTenantOptions();
    await loadTenantPricing();
    await loadTenantLicense();
    await loadUsers();
    await loadGroups();
    showApp(true);
    loginStatus.textContent = "";
    adminPasswordInput.value = "";
  } catch (error) {
    loginStatus.textContent = `Sign in failed: ${error.message}`;
    showApp(false);
  }
});

logoutButton.addEventListener("click", () => {
  state.adminId = "";
  state.tenantId = "";
  state.tenants = [];
  state.users = [];
  state.groups = [];
  state.federations = [];
  state.sentInvites = [];
  state.receivedInvites = [];
  state.federationEntries = [];
  userList.innerHTML = "";
  groupList.innerHTML = "";
  federationList.innerHTML = "";
  showApp(false);
  loginStatus.textContent = "Signed out.";
});

createUserButton.addEventListener("click", async () => {
  // Check license limit before creating
  const { userLimit, userCount } = state.license;
  if (userLimit !== null && userCount >= userLimit) {
    createUserStatus.textContent = `Cannot create user: License limit of ${userLimit} reached.`;
    return;
  }

  const displayName = userNameInput.value.trim();
  const email = userEmailInput.value.trim();
  const role = userRoleSelect.value;
  const status = userStatusSelect.value;
  const tempPassword = userTempPasswordInput.value.trim();
  if (!displayName || !email || !tempPassword) {
    createUserStatus.textContent = "Display name, email, and temp password are required.";
    return;
  }

  try {
    createUserStatus.textContent = "Creating...";
    await apiRequest("/users", "POST", { displayName, email, role, status, tempPassword });
    userNameInput.value = "";
    userEmailInput.value = "";
    userTempPasswordInput.value = "";
    await loadUsers();
    await loadTenantLicense(); // Refresh license to update user count
    createUserStatus.textContent = "User created.";
  } catch (error) {
    createUserStatus.textContent = `Create failed: ${error.message}`;
  }
});

// Geo-fence map state for create form
let createGeoMap = null;
let createGeoMarker = null;
let createGeoCircle = null;

function initCreateGeoMap() {
  if (createGeoMap) {
    createGeoMap.invalidateSize();
    return;
  }

  createGeoMap = L.map("group-geo-map").setView([39.8283, -98.5795], 4);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
  }).addTo(createGeoMap);

  // Handle map clicks
  createGeoMap.on("click", (e) => {
    const { lat, lng } = e.latlng;
    document.getElementById("group-geo-lat").value = lat.toFixed(6);
    document.getElementById("group-geo-lng").value = lng.toFixed(6);
    updateCreateGeoMapMarker(lat, lng);
  });
}

function updateCreateGeoMapMarker(lat, lng) {
  const radius = parseInt(document.getElementById("group-geo-radius").value) || 500;

  if (createGeoMarker) {
    createGeoMap.removeLayer(createGeoMarker);
  }
  if (createGeoCircle) {
    createGeoMap.removeLayer(createGeoCircle);
  }

  createGeoCircle = L.circle([lat, lng], {
    radius: radius,
    color: "#0891b2",
    fillColor: "#0891b2",
    fillOpacity: 0.2,
    weight: 2
  }).addTo(createGeoMap);

  createGeoMarker = L.marker([lat, lng]).addTo(createGeoMap);

  // Fit map to show the circle
  createGeoMap.fitBounds(createGeoCircle.getBounds(), { padding: [20, 20] });
}

function clearCreateGeoMap() {
  if (createGeoMarker) {
    createGeoMap.removeLayer(createGeoMarker);
    createGeoMarker = null;
  }
  if (createGeoCircle) {
    createGeoMap.removeLayer(createGeoCircle);
    createGeoCircle = null;
  }
}

// Geo-fence toggle handler
document.getElementById("group-geo-enabled").addEventListener("change", (e) => {
  document.getElementById("geo-fields").classList.toggle("hidden", !e.target.checked);
  if (e.target.checked) {
    // Delay map init to allow container to become visible
    setTimeout(() => {
      initCreateGeoMap();
    }, 100);
  }
});

// Update map when lat/lng fields change
document.getElementById("group-geo-lat").addEventListener("change", () => {
  const lat = parseFloat(document.getElementById("group-geo-lat").value);
  const lng = parseFloat(document.getElementById("group-geo-lng").value);
  if (!isNaN(lat) && !isNaN(lng) && createGeoMap) {
    updateCreateGeoMapMarker(lat, lng);
  }
});

document.getElementById("group-geo-lng").addEventListener("change", () => {
  const lat = parseFloat(document.getElementById("group-geo-lat").value);
  const lng = parseFloat(document.getElementById("group-geo-lng").value);
  if (!isNaN(lat) && !isNaN(lng) && createGeoMap) {
    updateCreateGeoMapMarker(lat, lng);
  }
});

// Update circle when radius changes
document.getElementById("group-geo-radius").addEventListener("change", () => {
  const lat = parseFloat(document.getElementById("group-geo-lat").value);
  const lng = parseFloat(document.getElementById("group-geo-lng").value);
  if (!isNaN(lat) && !isNaN(lng) && createGeoMap) {
    updateCreateGeoMapMarker(lat, lng);
  }
});

createGroupButton.addEventListener("click", async () => {
  const name = groupNameInput.value.trim();
  const isPriorityGroup = document.getElementById("group-priority").checked;
  const geoEnabled = document.getElementById("group-geo-enabled").checked;

  if (!name) {
    createGroupStatus.textContent = "Group name is required.";
    return;
  }

  const payload = { name, isPriorityGroup };

  if (geoEnabled) {
    const geoLat = parseFloat(document.getElementById("group-geo-lat").value);
    const geoLng = parseFloat(document.getElementById("group-geo-lng").value);
    if (isNaN(geoLat) || isNaN(geoLng)) {
      createGroupStatus.textContent = "Geo-fence requires valid coordinates.";
      return;
    }
    payload.geoEnabled = true;
    payload.geoLat = geoLat;
    payload.geoLng = geoLng;
    payload.geoRadiusMeters = parseInt(document.getElementById("group-geo-radius").value);
    const geoAddress = document.getElementById("group-geo-address").value.trim();
    if (geoAddress) payload.geoAddress = geoAddress;
  }

  try {
    createGroupStatus.textContent = "Creating...";
    await apiRequest("/channels", "POST", payload);
    groupNameInput.value = "";
    document.getElementById("group-priority").checked = false;
    document.getElementById("group-geo-enabled").checked = false;
    document.getElementById("geo-fields").classList.add("hidden");
    document.getElementById("group-geo-lat").value = "";
    document.getElementById("group-geo-lng").value = "";
    document.getElementById("group-geo-address").value = "";
    clearCreateGeoMap();
    geoChannelsCache = null; // Invalidate cache for location history
    await loadGroups();
    createGroupStatus.textContent = "Group created.";
  } catch (error) {
    createGroupStatus.textContent = `Create failed: ${error.message}`;
  }
});

createFederationButton.addEventListener("click", async () => {
  const toTenantId = federationTargetInput.value.trim();
  if (!toTenantId) {
    federationCreateStatus.textContent = "Target tenant ID is required.";
    return;
  }
  federationCreateStatus.textContent = "Creating invite...";
  federationCode.textContent = "";
  try {
    const data = await apiRequest("/federation-invites", "POST", { toTenantId });
    federationCreateStatus.textContent = "Invite created. Share the code OOB.";
    federationCode.textContent = `Invite ID: ${data.inviteId} | Code: ${data.code}`;
    federationTargetInput.value = "";
    await loadFederations();
  } catch (error) {
    federationCreateStatus.textContent = `Create failed: ${error.message}`;
  }
});

acceptFederationButton.addEventListener("click", async () => {
  const inviteId = federationInviteIdInput.value.trim();
  const code = federationCodeInput.value.trim();
  if (!inviteId || !code) {
    federationAcceptStatus.textContent = "Invite ID and code are required.";
    return;
  }
  federationAcceptStatus.textContent = "Accepting invite...";
  try {
    await apiRequest("/federation-invites/accept", "POST", { inviteId, code });
    federationAcceptStatus.textContent = "Federation accepted.";
    federationInviteIdInput.value = "";
    federationCodeInput.value = "";
    await loadFederations();
  } catch (error) {
    federationAcceptStatus.textContent = `Accept failed: ${error.message}`;
  }
});

tenantSelector.addEventListener("change", async () => {
  state.tenantId = tenantSelector.value;
  updateTenantStatus();
  await loadTenantPricing();
  await loadTenantLicense();
  await loadUsers();
  await loadGroups();
});

userSearchInput.addEventListener("input", () => {
  renderUsers(getFilteredUsers(state.users ?? []));
});

userStatusFilter.addEventListener("change", () => {
  renderUsers(getFilteredUsers(state.users ?? []));
});

refreshUsersButton.addEventListener("click", () => {
  loadUsers();
});

groupSearchInput.addEventListener("input", () => {
  renderGroups(getFilteredGroups(state.groups ?? []));
});

refreshGroupsButton.addEventListener("click", () => {
  loadGroups();
});

refreshFederationsButton.addEventListener("click", () => {
  loadFederations();
});

tabUsers.addEventListener("click", () => {
  setActiveTab("users");
});

tabGroups.addEventListener("click", () => {
  setActiveTab("groups");
});

tabFederations.addEventListener("click", () => {
  setActiveTab("federations");
  loadFederations();
});

// Logs tab elements
const logUserFilter = document.getElementById("log-user-filter");
const logChannelFilter = document.getElementById("log-channel-filter");
const logStartDate = document.getElementById("log-start-date");
const logEndDate = document.getElementById("log-end-date");
const applyLogFiltersButton = document.getElementById("apply-log-filters");
const clearLogFiltersButton = document.getElementById("clear-log-filters");
const refreshLogsButton = document.getElementById("refresh-logs");
const logStatus = document.getElementById("log-status");
const logTableBody = document.getElementById("log-table-body");
const loadMoreLogsButton = document.getElementById("load-more-logs");

async function loadTransmissions(append = false) {
  try {
    logStatus.textContent = "Loading transmissions...";

    const params = new URLSearchParams();
    if (logUserFilter.value) params.set("userId", logUserFilter.value);
    if (logChannelFilter.value) params.set("channelId", logChannelFilter.value);
    if (logStartDate.value) params.set("startDate", new Date(logStartDate.value).toISOString());
    if (logEndDate.value) {
      const endDate = new Date(logEndDate.value);
      endDate.setHours(23, 59, 59, 999);
      params.set("endDate", endDate.toISOString());
    }
    if (append && state.transmissionsCursor) {
      params.set("cursor", state.transmissionsCursor);
    }

    const data = await apiRequest(`/transmissions?${params.toString()}`, "GET");

    if (append) {
      state.transmissions = [...state.transmissions, ...(data.transmissions ?? [])];
    } else {
      state.transmissions = data.transmissions ?? [];
    }
    state.transmissionsCursor = data.nextCursor;

    renderTransmissions();
    logStatus.textContent = `Showing ${state.transmissions.length} transmissions`;

    loadMoreLogsButton.style.display = state.transmissionsCursor ? "inline-block" : "none";
  } catch (error) {
    logStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function renderTransmissions() {
  logTableBody.innerHTML = "";

  if (!state.transmissions.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6" style="text-align: center; color: #666;">No transmissions found</td>`;
    logTableBody.appendChild(row);
    return;
  }

  state.transmissions.forEach((tx) => {
    const row = document.createElement("tr");

    const time = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "N/A";
    const location = tx.latitude && tx.longitude
      ? `${tx.latitude.toFixed(4)}, ${tx.longitude.toFixed(4)}`
      : "N/A";
    const summary = tx.summaryText || tx.transcriptText || "(No transcript)";
    const audioLink = tx.audioUrl
      ? `<a href="${tx.audioUrl}" target="_blank">Play</a>`
      : "N/A";

    row.innerHTML = `
      <td>${time}</td>
      <td>${tx.senderName || tx.senderId || "Unknown"}</td>
      <td>${location}</td>
      <td>${tx.channelName || tx.channelId || "Unknown"}</td>
      <td class="summary-cell">${summary}</td>
      <td>${audioLink}</td>
    `;
    logTableBody.appendChild(row);
  });
}

function populateLogFilters() {
  // Populate user filter
  logUserFilter.innerHTML = '<option value="">All Users</option>';
  state.users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = user.displayName || user.email || user.userId;
    logUserFilter.appendChild(option);
  });

  // Populate channel filter from groups
  logChannelFilter.innerHTML = '<option value="">All Channels</option>';
  state.groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.channelId;
    option.textContent = group.name || group.channelId;
    logChannelFilter.appendChild(option);
  });
}

tabLogs.addEventListener("click", async () => {
  setActiveTab("logs");
  if (!state.users.length) await loadUsers();
  if (!state.groups.length) await loadGroups();
  populateLogFilters();
  loadTransmissions();
});

applyLogFiltersButton.addEventListener("click", () => {
  loadTransmissions();
});

clearLogFiltersButton.addEventListener("click", () => {
  logUserFilter.value = "";
  logChannelFilter.value = "";
  logStartDate.value = "";
  logEndDate.value = "";
  loadTransmissions();
});

refreshLogsButton.addEventListener("click", () => {
  loadTransmissions();
});

loadMoreLogsButton.addEventListener("click", () => {
  loadTransmissions(true);
});

// Export transmission logs to CSV
const exportLogsButton = document.getElementById("export-logs");
exportLogsButton.addEventListener("click", async () => {
  logStatus.textContent = "Fetching all matching transmissions...";
  exportLogsButton.disabled = true;

  try {
    // Build filter params from current filter state
    const params = new URLSearchParams();
    if (logUserFilter.value) params.set("userId", logUserFilter.value);
    if (logChannelFilter.value) params.set("channelId", logChannelFilter.value);
    if (logStartDate.value) params.set("startDate", new Date(logStartDate.value).toISOString());
    if (logEndDate.value) {
      const endDate = new Date(logEndDate.value);
      endDate.setHours(23, 59, 59, 999);
      params.set("endDate", endDate.toISOString());
    }

    // Fetch all pages
    let allTransmissions = [];
    let cursor = null;
    let pageCount = 0;

    do {
      const pageParams = new URLSearchParams(params);
      pageParams.set("limit", "200");
      if (cursor) pageParams.set("cursor", cursor);

      const data = await apiRequest(`/transmissions?${pageParams.toString()}`, "GET");
      allTransmissions = [...allTransmissions, ...(data.transmissions ?? [])];
      cursor = data.nextCursor;
      pageCount++;
      logStatus.textContent = `Fetching... ${allTransmissions.length} transmissions`;
    } while (cursor && pageCount < 100); // Safety limit

    if (!allTransmissions.length) {
      logStatus.textContent = "No transmissions to export.";
      return;
    }

    const headers = ["Time", "Sender", "Sender ID", "Location", "Channel", "Channel ID", "Summary", "Transcript", "Audio URL"];
    const rows = allTransmissions.map(tx => {
      const time = tx.createdAt ? new Date(tx.createdAt).toISOString() : "";
      const location = tx.latitude && tx.longitude ? `${tx.latitude},${tx.longitude}` : "";
      return [
        time,
        tx.senderName || "",
        tx.senderId || "",
        location,
        tx.channelName || "",
        tx.channelId || "",
        (tx.summaryText || "").replace(/"/g, '""'),
        (tx.transcriptText || "").replace(/"/g, '""'),
        tx.audioUrl || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transmission-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    logStatus.textContent = `Exported ${allTransmissions.length} transmissions.`;
  } catch (error) {
    logStatus.textContent = `Export failed: ${error.message}`;
  } finally {
    exportLogsButton.disabled = false;
  }
});

// Policies tab elements and state
const policiesStatus = document.getElementById("policies-status");
const tenantRetentionSelect = document.getElementById("tenant-retention");
const saveTenantRetentionButton = document.getElementById("save-tenant-retention");
const tenantRetentionStatus = document.getElementById("tenant-retention-status");
const refreshPoliciesButton = document.getElementById("refresh-policies");
const channelPoliciesList = document.getElementById("channel-policies-list");
const userPoliciesList = document.getElementById("user-policies-list");
const costBreakdown = document.getElementById("cost-breakdown");
const costMonthly = document.getElementById("cost-monthly");

let retentionPolicies = {
  tenantRetentionDays: null,
  channelPolicies: [],
  users: [], // Each user has effectiveDays, source, sourceDetail, etc.
  totalUsers: 0
};

function updateCostCalculator() {
  const users = retentionPolicies.users || [];
  const FREE_DAYS = 30;

  if (users.length === 0) {
    costBreakdown.textContent = "No users";
    costMonthly.textContent = "0.00";
    return;
  }

  // Group users by source type
  const tenantUsers = users.filter(u => u.source === 'tenant');
  const userPolicyUsers = users.filter(u => u.source === 'user');
  const channelPolicyUsers = users.filter(u => u.source === 'channel');

  // Calculate total cost (only days beyond 30 are charged)
  const totalBillableDays = users.reduce((sum, u) => sum + Math.max(0, u.effectiveDays - FREE_DAYS), 0);
  const monthly = (totalBillableDays * state.pricing.retentionCostPerDay).toFixed(2);

  // Build breakdown display
  let breakdownLines = [];

  // Tenant default users (30 days = free)
  if (tenantUsers.length > 0) {
    const days = tenantUsers[0].effectiveDays;
    const billableDays = Math.max(0, days - FREE_DAYS);
    const cost = (tenantUsers.length * billableDays * state.pricing.retentionCostPerDay).toFixed(2);
    if (billableDays === 0) {
      breakdownLines.push(`<span style="color:#6b7280">●</span> ${tenantUsers.length} user${tenantUsers.length > 1 ? 's' : ''} (tenant default) × ${days} days = FREE`);
    } else {
      breakdownLines.push(`<span style="color:#6b7280">●</span> ${tenantUsers.length} user${tenantUsers.length > 1 ? 's' : ''} (tenant default) × ${billableDays} billable days = $${cost}`);
    }
  }

  // User policy users
  userPolicyUsers.forEach(u => {
    const billableDays = Math.max(0, u.effectiveDays - FREE_DAYS);
    const cost = (billableDays * state.pricing.retentionCostPerDay).toFixed(2);
    breakdownLines.push(`<span style="color:#22c55e">●</span> ${u.displayName} (user policy) × ${billableDays} billable days = $${cost}`);
  });

  // Channel policy users
  channelPolicyUsers.forEach(u => {
    const billableDays = Math.max(0, u.effectiveDays - FREE_DAYS);
    const cost = (billableDays * state.pricing.retentionCostPerDay).toFixed(2);
    const channelName = u.sourceDetail || 'channel';
    breakdownLines.push(`<span style="color:#eab308">●</span> ${u.displayName} (via "${channelName}") × ${billableDays} billable days = $${cost}`);
  });

  costBreakdown.innerHTML = breakdownLines.join('<br>');
  costMonthly.textContent = monthly;
}

async function loadRetentionPolicies() {
  try {
    policiesStatus.textContent = "Loading policies...";
    const data = await apiRequest("/retention-policies", "GET");
    retentionPolicies = data;

    // Set tenant retention select
    tenantRetentionSelect.value = data.tenantRetentionDays || "";

    // Update cost calculator
    updateCostCalculator();

    // Render channel and user policies
    renderChannelPolicies();
    renderUserPolicies();

    policiesStatus.textContent = "";
  } catch (error) {
    policiesStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function renderChannelPolicies() {
  channelPoliciesList.innerHTML = "";

  if (!state.groups.length) {
    const empty = document.createElement("p");
    empty.textContent = "No channels available.";
    empty.className = "hint";
    channelPoliciesList.appendChild(empty);
    return;
  }

  // Build a map of channel policies
  const policyMap = {};
  (retentionPolicies.channelPolicies || []).forEach(p => {
    policyMap[p.channelId] = p.retentionDays;
  });

  state.groups
    .filter(g => !g.isShared) // Only show local groups
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
    .forEach(group => {
      const item = document.createElement("div");
      item.className = "tenant-item";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.gap = "1rem";

      const meta = document.createElement("div");
      meta.style.flex = "1";
      meta.innerHTML = `<strong>${group.name}</strong>`;

      const select = document.createElement("select");
      select.innerHTML = `
        <option value="">Inherit from tenant</option>
        <option value="90">90 days</option>
        <option value="180">180 days</option>
        <option value="365">365 days</option>
      `;
      select.value = policyMap[group.channelId] || "";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "secondary";

      const feedback = document.createElement("div");
      feedback.className = "hint";
      feedback.style.minWidth = "100px";

      saveBtn.addEventListener("click", async () => {
        feedback.textContent = "Saving...";
        try {
          await apiRequest("/retention-policies", "POST", {
            targetType: "channel",
            targetId: group.channelId,
            retentionDays: select.value ? parseInt(select.value) : null
          });
          feedback.textContent = "Saved";
          await loadRetentionPolicies(); // Refresh to show updated effective retention
        } catch (error) {
          feedback.textContent = `Error: ${error.message}`;
        }
      });

      item.appendChild(meta);
      item.appendChild(select);
      item.appendChild(saveBtn);
      item.appendChild(feedback);
      channelPoliciesList.appendChild(item);
    });
}

function renderUserPolicies() {
  userPoliciesList.innerHTML = "";

  const users = retentionPolicies.users || [];

  if (!users.length) {
    const empty = document.createElement("p");
    empty.textContent = "No users available.";
    empty.className = "hint";
    userPoliciesList.appendChild(empty);
    return;
  }

  // Sort users alphabetically by display name
  const sortedUsers = [...users].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "")
  );

  sortedUsers.forEach(user => {
    const item = document.createElement("div");
    item.className = "tenant-item";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "1rem";

    // Source indicator color
    const sourceColor = user.source === 'tenant' ? '#6b7280' :
                        user.source === 'user' ? '#22c55e' : '#eab308';

    const meta = document.createElement("div");
    meta.style.flex = "1";

    // Show effective retention info
    let effectiveInfo = `${user.effectiveDays} days`;
    if (user.source === 'channel') {
      effectiveInfo += ` (via "${user.sourceDetail}")`;
    } else if (user.source === 'tenant') {
      effectiveInfo += ` (tenant default)`;
    }

    meta.innerHTML = `
      <strong><span style="color:${sourceColor}">●</span> ${user.displayName}</strong>
      <br><span class="hint">${user.email || ""}</span>
      <br><span class="hint">Effective: ${effectiveInfo}</span>
    `;

    const select = document.createElement("select");
    select.innerHTML = `
      <option value="">No user policy</option>
      <option value="90">90 days</option>
      <option value="180">180 days</option>
      <option value="365">365 days</option>
    `;
    select.value = user.userPolicyDays || "";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "secondary";

    const feedback = document.createElement("div");
    feedback.className = "hint";
    feedback.style.minWidth = "100px";

    saveBtn.addEventListener("click", async () => {
      feedback.textContent = "Saving...";
      try {
        await apiRequest("/retention-policies", "POST", {
          targetType: "user",
          targetId: user.userId,
          retentionDays: select.value ? parseInt(select.value) : null
        });
        feedback.textContent = "Saved";
        await loadRetentionPolicies(); // Refresh to show updated effective retention
      } catch (error) {
        feedback.textContent = `Error: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(select);
    item.appendChild(saveBtn);
    item.appendChild(feedback);
    userPoliciesList.appendChild(item);
  });
}

saveTenantRetentionButton.addEventListener("click", async () => {
  tenantRetentionStatus.textContent = "Saving...";
  try {
    await apiRequest("/retention-policies", "POST", {
      targetType: "tenant",
      retentionDays: tenantRetentionSelect.value ? parseInt(tenantRetentionSelect.value) : null
    });
    tenantRetentionStatus.textContent = "Saved";
    await loadRetentionPolicies(); // Refresh all to show updated effective retention
  } catch (error) {
    tenantRetentionStatus.textContent = `Error: ${error.message}`;
  }
});

tabPolicies.addEventListener("click", async () => {
  setActiveTab("policies");
  if (!state.users.length) await loadUsers();
  if (!state.groups.length) await loadGroups();
  await loadRetentionPolicies();
});

refreshPoliciesButton.addEventListener("click", () => {
  loadRetentionPolicies();
});

// ==================== Transcription & Translation Tab ====================

const tenantTranscriptionToggle = document.getElementById("tenant-transcription-toggle");
const saveTenantTranscriptionButton = document.getElementById("save-tenant-transcription");
const tenantTranscriptionStatus = document.getElementById("tenant-transcription-status");
const transcriptionCostBreakdown = document.getElementById("transcription-cost-breakdown");
const transcriptionCostMonthly = document.getElementById("transcription-cost-monthly");
const tenantTranslationToggle = document.getElementById("tenant-translation-toggle");
const saveTenantTranslationButton = document.getElementById("save-tenant-translation");
const tenantTranslationStatus = document.getElementById("tenant-translation-status");
const refreshTranslationButton = document.getElementById("refresh-translation");
const translationCostBreakdown = document.getElementById("translation-cost-breakdown");
const translationCostMonthly = document.getElementById("translation-cost-monthly");
const translationStatus = document.getElementById("translation-status");

// Channel translation elements
const untranslatedChannelsSelect = document.getElementById("untranslated-channels");
const translatedChannelsSelect = document.getElementById("translated-channels");
const enableChannelTranslationBtn = document.getElementById("enable-channel-translation");
const disableChannelTranslationBtn = document.getElementById("disable-channel-translation");
const channelTranslationStatus = document.getElementById("channel-translation-status");

// User translation elements
const untranslatedUsersSelect = document.getElementById("untranslated-users");
const translatedUsersSelect = document.getElementById("translated-users");
const enableUserTranslationBtn = document.getElementById("enable-user-translation");
const disableUserTranslationBtn = document.getElementById("disable-user-translation");
const userTranslationStatus = document.getElementById("user-translation-status");

// Transcription and translation costs are now fetched from API (state.pricing)

let translationPolicies = {
  tenantTranscriptionEnabled: false,
  tenantTranslationEnabled: false,
  channelPolicies: [],
  users: [],
  totalUsers: 0,
  usersWithTranslation: 0
};

function updateTranscriptionCostCalculator() {
  const users = translationPolicies.users || [];
  const transcriptionEnabled = translationPolicies.tenantTranscriptionEnabled;

  if (!transcriptionEnabled) {
    transcriptionCostBreakdown.innerHTML = '<span style="color:#6b7280">Transcription disabled</span>';
    transcriptionCostMonthly.textContent = "0.00";
    return;
  }

  if (users.length === 0) {
    transcriptionCostBreakdown.textContent = "No users";
    transcriptionCostMonthly.textContent = "0.00";
    return;
  }

  const transcriptionCost = users.length * state.pricing.transcriptionCost;
  const monthly = transcriptionCost.toFixed(2);

  transcriptionCostBreakdown.innerHTML = `<span style="color:#22c55e">●</span> ${users.length} user${users.length > 1 ? 's' : ''} × $${state.pricing.transcriptionCost.toFixed(2)} = $${monthly}`;
  transcriptionCostMonthly.textContent = monthly;
}

function updateTranslationCostCalculator() {
  const users = translationPolicies.users || [];
  const transcriptionEnabled = translationPolicies.tenantTranscriptionEnabled;
  const translationEnabled = translationPolicies.tenantTranslationEnabled;

  if (!transcriptionEnabled || !translationEnabled) {
    translationCostBreakdown.innerHTML = '<span style="color:#6b7280">Translation disabled</span>';
    translationCostMonthly.textContent = "0.00";
    return;
  }

  if (users.length === 0) {
    translationCostBreakdown.textContent = "No users";
    translationCostMonthly.textContent = "0.00";
    return;
  }

  const usersWithTranslation = users.filter(u => u.translationEnabled);

  if (usersWithTranslation.length === 0) {
    translationCostBreakdown.innerHTML = '<span style="color:#6b7280">●</span> No users with translation enabled';
    translationCostMonthly.textContent = "0.00";
    return;
  }

  const translationCost = usersWithTranslation.length * state.pricing.translationCost;
  const monthly = translationCost.toFixed(2);

  // Build breakdown display
  let breakdownLines = [];

  const userPolicyUsers = usersWithTranslation.filter(u => u.source === 'user');
  const channelPolicyUsers = usersWithTranslation.filter(u => u.source === 'channel');

  if (userPolicyUsers.length > 0) {
    breakdownLines.push(`<span style="color:#22c55e">●</span> User policy: ${userPolicyUsers.length} user${userPolicyUsers.length > 1 ? 's' : ''} × $${state.pricing.translationCost.toFixed(2)} = $${(userPolicyUsers.length * state.pricing.translationCost).toFixed(2)}`);
  }
  if (channelPolicyUsers.length > 0) {
    breakdownLines.push(`<span style="color:#eab308">●</span> Channel policy: ${channelPolicyUsers.length} user${channelPolicyUsers.length > 1 ? 's' : ''} × $${state.pricing.translationCost.toFixed(2)} = $${(channelPolicyUsers.length * state.pricing.translationCost).toFixed(2)}`);
  }

  translationCostBreakdown.innerHTML = breakdownLines.join('<br>');
  translationCostMonthly.textContent = monthly;
}

async function loadTranslationPolicies() {
  try {
    translationStatus.textContent = "Loading policies...";
    const data = await apiRequest("/translation-policies");
    translationPolicies = data;

    // Update toggles
    tenantTranscriptionToggle.checked = data.tenantTranscriptionEnabled;
    tenantTranslationToggle.checked = data.tenantTranslationEnabled;

    // Disable translation toggle if transcription is off
    tenantTranslationToggle.disabled = !data.tenantTranscriptionEnabled;
    saveTenantTranslationButton.disabled = !data.tenantTranscriptionEnabled;

    updateTranscriptionCostCalculator();
    updateTranslationCostCalculator();
    renderTranslationChannelPolicies();
    renderTranslationUserPolicies();
    translationStatus.textContent = "";
  } catch (error) {
    translationStatus.textContent = `Error: ${error.message}`;
  }
}

function renderTranslationChannelPolicies() {
  untranslatedChannelsSelect.innerHTML = "";
  translatedChannelsSelect.innerHTML = "";

  const disabled = !translationPolicies.tenantTranscriptionEnabled || !translationPolicies.tenantTranslationEnabled;
  untranslatedChannelsSelect.disabled = disabled;
  translatedChannelsSelect.disabled = disabled;
  enableChannelTranslationBtn.disabled = disabled;
  disableChannelTranslationBtn.disabled = disabled;

  if (disabled) {
    channelTranslationStatus.textContent = "Enable tenant transcription and translation first.";
    return;
  }
  channelTranslationStatus.textContent = "";

  if (!state.groups.length) {
    channelTranslationStatus.textContent = "No channels available.";
    return;
  }

  // Build a set of translated channel IDs
  const translatedSet = new Set(
    (translationPolicies.channelPolicies || []).map(p => p.channelId)
  );

  // Sort groups alphabetically
  const sortedGroups = [...state.groups]
    .filter(g => !g.isShared)
    .sort((a, b) => a.name.localeCompare(b.name));

  sortedGroups.forEach(group => {
    const option = document.createElement("option");
    option.value = group.channelId;
    option.textContent = group.name;

    if (translatedSet.has(group.channelId)) {
      translatedChannelsSelect.appendChild(option);
    } else {
      untranslatedChannelsSelect.appendChild(option);
    }
  });
}

function renderTranslationUserPolicies() {
  untranslatedUsersSelect.innerHTML = "";
  translatedUsersSelect.innerHTML = "";

  const disabled = !translationPolicies.tenantTranscriptionEnabled || !translationPolicies.tenantTranslationEnabled;
  untranslatedUsersSelect.disabled = disabled;
  translatedUsersSelect.disabled = disabled;
  enableUserTranslationBtn.disabled = disabled;
  disableUserTranslationBtn.disabled = disabled;

  if (disabled) {
    userTranslationStatus.textContent = "Enable tenant transcription and translation first.";
    return;
  }
  userTranslationStatus.textContent = "";

  const users = translationPolicies.users || [];

  if (!users.length) {
    userTranslationStatus.textContent = "No users available.";
    return;
  }

  // Sort users alphabetically by display name
  const sortedUsers = [...users].sort((a, b) =>
    (a.displayName || "").localeCompare(b.displayName || "")
  );

  sortedUsers.forEach(user => {
    const option = document.createElement("option");
    option.value = user.userId;
    // Show source info for translated users
    if (user.translationEnabled && user.source === 'channel') {
      option.textContent = `${user.displayName} (via ${user.sourceDetail})`;
    } else {
      option.textContent = user.displayName;
    }

    if (user.translationEnabled) {
      translatedUsersSelect.appendChild(option);
    } else {
      untranslatedUsersSelect.appendChild(option);
    }
  });
}

saveTenantTranscriptionButton.addEventListener("click", async () => {
  tenantTranscriptionStatus.textContent = "Saving...";
  try {
    await apiRequest("/translation-policies", "POST", {
      targetType: "tenant",
      setting: "transcription",
      enabled: tenantTranscriptionToggle.checked
    });
    tenantTranscriptionStatus.textContent = "Saved";
    await loadTranslationPolicies();
  } catch (error) {
    tenantTranscriptionStatus.textContent = `Error: ${error.message}`;
  }
});

saveTenantTranslationButton.addEventListener("click", async () => {
  tenantTranslationStatus.textContent = "Saving...";
  try {
    await apiRequest("/translation-policies", "POST", {
      targetType: "tenant",
      setting: "translation",
      enabled: tenantTranslationToggle.checked
    });
    tenantTranslationStatus.textContent = "Saved";
    await loadTranslationPolicies();
  } catch (error) {
    tenantTranslationStatus.textContent = `Error: ${error.message}`;
  }
});

tabTranscription.addEventListener("click", async () => {
  setActiveTab("transcription");
  await loadTranslationPolicies();
});

const refreshTranscriptionButton = document.getElementById("refresh-transcription");
refreshTranscriptionButton?.addEventListener("click", () => {
  loadTranslationPolicies();
});

tabTranslation.addEventListener("click", async () => {
  setActiveTab("translation");
  if (!state.groups.length) await loadGroups();
  await loadTranslationPolicies();
});

refreshTranslationButton.addEventListener("click", () => {
  loadTranslationPolicies();
});

// Channel translation enable/disable handlers
enableChannelTranslationBtn.addEventListener("click", async () => {
  const selected = Array.from(untranslatedChannelsSelect.selectedOptions).map(o => o.value);
  if (!selected.length) return;

  channelTranslationStatus.textContent = "Enabling...";
  try {
    await Promise.all(selected.map(channelId =>
      apiRequest("/translation-policies", "POST", {
        targetType: "channel",
        targetId: channelId,
        setting: "translation",
        enabled: true
      })
    ));
    channelTranslationStatus.textContent = "Saved";
    await loadTranslationPolicies();
  } catch (error) {
    channelTranslationStatus.textContent = `Error: ${error.message}`;
  }
});

disableChannelTranslationBtn.addEventListener("click", async () => {
  const selected = Array.from(translatedChannelsSelect.selectedOptions).map(o => o.value);
  if (!selected.length) return;

  channelTranslationStatus.textContent = "Disabling...";
  try {
    await Promise.all(selected.map(channelId =>
      apiRequest("/translation-policies", "POST", {
        targetType: "channel",
        targetId: channelId,
        setting: "translation",
        enabled: null
      })
    ));
    channelTranslationStatus.textContent = "Saved";
    await loadTranslationPolicies();
  } catch (error) {
    channelTranslationStatus.textContent = `Error: ${error.message}`;
  }
});

// User translation enable/disable handlers
enableUserTranslationBtn.addEventListener("click", async () => {
  const selected = Array.from(untranslatedUsersSelect.selectedOptions).map(o => o.value);
  if (!selected.length) return;

  userTranslationStatus.textContent = "Enabling...";
  try {
    await Promise.all(selected.map(userId =>
      apiRequest("/translation-policies", "POST", {
        targetType: "user",
        targetId: userId,
        setting: "translation",
        enabled: true
      })
    ));
    userTranslationStatus.textContent = "Saved";
    await loadTranslationPolicies();
  } catch (error) {
    userTranslationStatus.textContent = `Error: ${error.message}`;
  }
});

disableUserTranslationBtn.addEventListener("click", async () => {
  const selected = Array.from(translatedUsersSelect.selectedOptions).map(o => o.value);
  if (!selected.length) return;

  userTranslationStatus.textContent = "Disabling...";
  try {
    await Promise.all(selected.map(userId =>
      apiRequest("/translation-policies", "POST", {
        targetType: "user",
        targetId: userId,
        setting: "translation",
        enabled: null
      })
    ));
    userTranslationStatus.textContent = "Saved";
    await loadTranslationPolicies();
  } catch (error) {
    userTranslationStatus.textContent = `Error: ${error.message}`;
  }
});

// ==================== Admin Logs Tab ====================

const adminLogStatus = document.getElementById("admin-log-status");
const adminLogTableBody = document.getElementById("admin-log-table-body");
const refreshAdminLogsButton = document.getElementById("refresh-admin-logs");
const loadMoreAdminLogsButton = document.getElementById("load-more-admin-logs");
const adminLogAdminFilter = document.getElementById("admin-log-admin-filter");
const adminLogStartDate = document.getElementById("admin-log-start-date");
const adminLogEndDate = document.getElementById("admin-log-end-date");
const applyAdminLogFiltersBtn = document.getElementById("apply-admin-log-filters");
const clearAdminLogFiltersBtn = document.getElementById("clear-admin-log-filters");

function formatAdminAction(action) {
  // Convert action codes to human-readable text
  const actionMap = {
    "SET_RETENTION_POLICY": "Set retention policy",
    "REMOVE_RETENTION_POLICY": "Remove retention policy",
    "ENABLE_TRANSCRIPTION": "Enable transcription",
    "DISABLE_TRANSCRIPTION": "Disable transcription",
    "CLEAR_TRANSCRIPTION": "Clear transcription setting",
    "ENABLE_TRANSLATION": "Enable translation",
    "DISABLE_TRANSLATION": "Disable translation",
    "CLEAR_TRANSLATION": "Clear translation setting",
    "CREATE_USER": "Create user",
    "UPDATE_USER": "Update user",
    "DELETE_USER": "Delete user",
    "CREATE_CHANNEL": "Create channel",
    "UPDATE_CHANNEL": "Update channel",
    "DELETE_CHANNEL": "Delete channel",
    "CREATE_FEDERATION_INVITE": "Create federation invite",
    "ACCEPT_FEDERATION_INVITE": "Accept federation invite",
    "DELETE_FEDERATION_INVITE": "Delete federation invite",
    "UPDATE_FEDERATION": "Update federation",
    "DELETE_FEDERATION": "Delete federation"
  };
  return actionMap[action] || action;
}

function formatAdminDetails(details) {
  if (!details) return "-";

  const parts = [];
  if (details.retentionDays !== undefined) {
    parts.push(`Retention: ${details.retentionDays === null ? "inherit" : details.retentionDays + " days"}`);
  }
  if (details.setting !== undefined) {
    parts.push(`Setting: ${details.setting}`);
  }
  if (details.enabled !== undefined) {
    parts.push(`Enabled: ${details.enabled === null ? "inherit" : details.enabled}`);
  }
  if (details.displayName !== undefined) {
    parts.push(`Name: ${details.displayName}`);
  }
  if (details.email !== undefined) {
    parts.push(`Email: ${details.email}`);
  }
  if (details.role !== undefined) {
    parts.push(`Role: ${details.role}`);
  }
  if (details.status !== undefined) {
    parts.push(`Status: ${details.status}`);
  }
  if (details.memberName !== undefined) {
    parts.push(`Member: ${details.memberName}`);
  }

  return parts.length > 0 ? parts.join(", ") : "-";
}

function populateAdminLogFilters() {
  // Populate admin filter with users who have TENANT_ADMIN role
  adminLogAdminFilter.innerHTML = '<option value="">All Admins</option>';
  const admins = state.users.filter(u => u.role === "TENANT_ADMIN");
  admins.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
  admins.forEach(admin => {
    const option = document.createElement("option");
    option.value = admin.userId;
    option.textContent = admin.displayName || admin.email || admin.userId;
    adminLogAdminFilter.appendChild(option);
  });
}

async function loadAdminLogs(append = false) {
  try {
    adminLogStatus.textContent = "Loading admin logs...";

    const params = new URLSearchParams();
    params.set("limit", "50");
    if (append && state.adminLogsCursor) {
      params.set("cursor", state.adminLogsCursor);
    }

    // Add filter parameters
    const actorId = adminLogAdminFilter.value;
    const startDate = adminLogStartDate.value;
    const endDate = adminLogEndDate.value;

    if (actorId) {
      params.set("actorId", actorId);
    }
    if (startDate) {
      params.set("startDate", startDate);
    }
    if (endDate) {
      params.set("endDate", endDate);
    }

    const data = await apiRequest(`/admin-logs?${params.toString()}`, "GET");

    if (append) {
      state.adminLogs = [...state.adminLogs, ...(data.logs ?? [])];
    } else {
      state.adminLogs = data.logs ?? [];
    }
    state.adminLogsCursor = data.nextCursor;

    renderAdminLogs();
    adminLogStatus.textContent = `Showing ${state.adminLogs.length} entries`;

    loadMoreAdminLogsButton.style.display = state.adminLogsCursor ? "inline-block" : "none";
  } catch (error) {
    adminLogStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function renderAdminLogs() {
  adminLogTableBody.innerHTML = "";

  if (!state.adminLogs.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" style="text-align: center; color: #666;">No admin logs found</td>`;
    adminLogTableBody.appendChild(row);
    return;
  }

  state.adminLogs.forEach((log) => {
    const row = document.createElement("tr");

    const time = log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A";
    const admin = log.actorName || log.actorId || "Unknown";
    const action = formatAdminAction(log.action);
    const target = log.targetName
      ? `${log.targetType}: ${log.targetName}`
      : log.targetId
        ? `${log.targetType}: ${log.targetId}`
        : log.targetType || "-";
    const details = formatAdminDetails(log.details);

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

tabAdminLogs.addEventListener("click", async () => {
  setActiveTab("admin-logs");
  // Load users first to populate admin filter
  if (state.users.length === 0) {
    await loadUsers();
  }
  populateAdminLogFilters();
  loadAdminLogs();
});

refreshAdminLogsButton.addEventListener("click", () => {
  loadAdminLogs();
});

loadMoreAdminLogsButton.addEventListener("click", () => {
  loadAdminLogs(true);
});

applyAdminLogFiltersBtn.addEventListener("click", () => {
  loadAdminLogs();
});

clearAdminLogFiltersBtn.addEventListener("click", () => {
  adminLogAdminFilter.value = "";
  adminLogStartDate.value = "";
  adminLogEndDate.value = "";
  loadAdminLogs();
});

// Export admin logs to CSV
const exportAdminLogsButton = document.getElementById("export-admin-logs");
exportAdminLogsButton.addEventListener("click", async () => {
  adminLogStatus.textContent = "Fetching all matching admin logs...";
  exportAdminLogsButton.disabled = true;

  try {
    // Build filter params from current filter state
    const params = new URLSearchParams();
    if (adminLogAdminFilter.value) params.set("actorId", adminLogAdminFilter.value);
    if (adminLogStartDate.value) params.set("startDate", adminLogStartDate.value);
    if (adminLogEndDate.value) params.set("endDate", adminLogEndDate.value);

    // Fetch all pages
    let allLogs = [];
    let cursor = null;
    let pageCount = 0;

    do {
      const pageParams = new URLSearchParams(params);
      pageParams.set("limit", "200");
      if (cursor) pageParams.set("cursor", cursor);

      const data = await apiRequest(`/admin-logs?${pageParams.toString()}`, "GET");
      allLogs = [...allLogs, ...(data.logs ?? [])];
      cursor = data.nextCursor;
      pageCount++;
      adminLogStatus.textContent = `Fetching... ${allLogs.length} admin logs`;
    } while (cursor && pageCount < 100); // Safety limit

    if (!allLogs.length) {
      adminLogStatus.textContent = "No admin logs to export.";
      return;
    }

    const headers = ["Time", "Admin", "Admin ID", "Action", "Target Type", "Target", "Target ID", "Details"];
    const rows = allLogs.map(log => {
      const time = log.timestamp ? new Date(log.timestamp).toISOString() : "";
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : "";
      return [
        time,
        log.actorName || "",
        log.actorId || "",
        log.action || "",
        log.targetType || "",
        log.targetName || "",
        log.targetId || "",
        details
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    adminLogStatus.textContent = `Exported ${allLogs.length} admin logs.`;
  } catch (error) {
    adminLogStatus.textContent = `Export failed: ${error.message}`;
  } finally {
    exportAdminLogsButton.disabled = false;
  }
});

// ==================== AI Elevation Tab ====================

const elevationStatus = document.getElementById("elevation-status");
const elevationRulesList = document.getElementById("elevation-rules-list");
const elevationRuleTypeFilter = document.getElementById("elevation-rule-type-filter");
const refreshElevationButton = document.getElementById("refresh-elevation");
const elevationRuleNameInput = document.getElementById("elevation-rule-name");
const elevationSourceTypeSelect = document.getElementById("elevation-source-type");
const elevationSourceSelector = document.getElementById("elevation-source-selector");
const elevationSourceIdsSelect = document.getElementById("elevation-source-ids");
const elevationConditionInput = document.getElementById("elevation-condition");
const elevationDestShowGroupsBtn = document.getElementById("elevation-dest-show-groups");
const elevationDestShowUsersBtn = document.getElementById("elevation-dest-show-users");
const elevationDestAvailableSelect = document.getElementById("elevation-dest-available");
const elevationDestSelectedSelect = document.getElementById("elevation-dest-selected");
const elevationDestAddBtn = document.getElementById("elevation-dest-add");
const elevationDestRemoveBtn = document.getElementById("elevation-dest-remove");
const createElevationRuleButton = document.getElementById("create-elevation-rule");
const createElevationStatus = document.getElementById("create-elevation-status");
const elevationCostBreakdown = document.getElementById("elevation-cost-breakdown");
const elevationCostMonthly = document.getElementById("elevation-cost-monthly");

// Elevation rule cost is now fetched from API (state.pricing)

// Track which view is active for destination selector
let elevationDestViewMode = "groups"; // "groups" or "users"
// Track selected destinations (combined groups and users)
let elevationSelectedDestinations = []; // { type: "group"|"user", id: string, name: string }

function populateElevationSelectors() {
  // Populate source ids based on source type
  elevationSourceIdsSelect.innerHTML = "";
  const sourceType = elevationSourceTypeSelect.value;

  if (sourceType === "GROUPS") {
    state.groups
      .filter(g => !g.isShared)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(group => {
        const option = document.createElement("option");
        option.value = group.channelId;
        option.textContent = group.name;
        elevationSourceIdsSelect.appendChild(option);
      });
    elevationSourceSelector.classList.remove("hidden");
  } else if (sourceType === "USERS") {
    state.users
      .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""))
      .forEach(user => {
        const option = document.createElement("option");
        option.value = user.userId;
        option.textContent = user.displayName || user.email || user.userId;
        elevationSourceIdsSelect.appendChild(option);
      });
    elevationSourceSelector.classList.remove("hidden");
  } else {
    elevationSourceSelector.classList.add("hidden");
  }

  // Populate destination available list based on view mode
  populateElevationDestAvailable();
  // Render selected destinations
  renderElevationDestSelected();
}

function populateElevationDestAvailable() {
  elevationDestAvailableSelect.innerHTML = "";

  // Get IDs already selected
  const selectedIds = new Set(elevationSelectedDestinations.map(d => `${d.type}:${d.id}`));

  if (elevationDestViewMode === "groups") {
    // Update button styles
    elevationDestShowGroupsBtn.classList.remove("secondary");
    elevationDestShowUsersBtn.classList.add("secondary");

    state.groups
      .filter(g => !g.isShared && !selectedIds.has(`group:${g.channelId}`))
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(group => {
        const option = document.createElement("option");
        option.value = group.channelId;
        option.dataset.type = "group";
        option.dataset.name = group.name;
        option.textContent = group.name;
        elevationDestAvailableSelect.appendChild(option);
      });
  } else {
    // Update button styles
    elevationDestShowGroupsBtn.classList.add("secondary");
    elevationDestShowUsersBtn.classList.remove("secondary");

    state.users
      .filter(u => !selectedIds.has(`user:${u.userId}`))
      .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""))
      .forEach(user => {
        const option = document.createElement("option");
        option.value = user.userId;
        option.dataset.type = "user";
        option.dataset.name = user.displayName || user.email || user.userId;
        option.textContent = user.displayName || user.email || user.userId;
        elevationDestAvailableSelect.appendChild(option);
      });
  }
}

function renderElevationDestSelected() {
  elevationDestSelectedSelect.innerHTML = "";

  // Sort by type then name
  const sorted = [...elevationSelectedDestinations].sort((a, b) => {
    if (a.type !== b.type) return a.type === "group" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach(dest => {
    const option = document.createElement("option");
    option.value = dest.id;
    option.dataset.type = dest.type;
    option.textContent = `${dest.name} (${dest.type})`;
    elevationDestSelectedSelect.appendChild(option);
  });
}

function clearElevationDestinations() {
  elevationSelectedDestinations = [];
  renderElevationDestSelected();
  populateElevationDestAvailable();
}

async function loadElevationRules() {
  try {
    elevationStatus.textContent = "Loading elevation rules...";
    const data = await apiRequest("/elevation-rules", "GET");
    state.elevationRules = data.rules ?? [];
    renderElevationRules();
    updateElevationCostCalculator();
    elevationStatus.textContent = "";
  } catch (error) {
    elevationStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function updateElevationCostCalculator() {
  const allRules = state.elevationRules || [];
  const activeRules = allRules.filter(r => r.enabled !== false);

  if (activeRules.length === 0) {
    elevationCostBreakdown.textContent = "No active rules";
    elevationCostMonthly.textContent = "0.00";
    return;
  }

  const monthly = (activeRules.length * state.pricing.elevationRuleCost).toFixed(2);

  elevationCostBreakdown.innerHTML = `<span style="color:#22c55e">●</span> ${activeRules.length} active rule${activeRules.length > 1 ? 's' : ''} × $${state.pricing.elevationRuleCost.toFixed(2)} = $${monthly}`;
  elevationCostMonthly.textContent = monthly;
}

function renderElevationRules() {
  elevationRulesList.innerHTML = "";

  const filterValue = elevationRuleTypeFilter?.value || "ALL";

  // Filter rules based on type
  const filteredRules = state.elevationRules.filter(rule => {
    if (filterValue === "ALL") return true;
    if (filterValue === "BOLO") return rule.isBolo === true;
    if (filterValue === "TENANT") return rule.isBolo !== true;
    return true;
  });

  if (!filteredRules.length) {
    const empty = document.createElement("p");
    empty.textContent = filterValue === "ALL" ? "No elevation rules configured." : `No ${filterValue.toLowerCase()} rules found.`;
    empty.className = "hint";
    elevationRulesList.appendChild(empty);
    return;
  }

  filteredRules.forEach(rule => {
    const item = document.createElement("div");
    item.className = "tenant-item";

    // Build display name - BOLOs show "BOLO - Username"
    const displayName = rule.isBolo ? `BOLO - ${rule.createdByName || rule.createdBy}` : rule.name;

    // Build source description
    let sourceDesc = "All transmissions";
    if (rule.sourceType === "GROUPS" && rule.sourceNames?.length) {
      sourceDesc = `Groups: ${rule.sourceNames.join(", ")}`;
    } else if (rule.sourceType === "USERS" && rule.sourceNames?.length) {
      sourceDesc = `Users: ${rule.sourceNames.join(", ")}`;
    }

    // Build destination description
    const destParts = [];
    if (rule.destinationGroupNames?.length) {
      destParts.push(`Groups: ${rule.destinationGroupNames.join(", ")}`);
    }
    if (rule.destinationUserNames?.length) {
      destParts.push(`Users: ${rule.destinationUserNames.join(", ")}`);
    }
    const destDesc = destParts.length ? destParts.join("; ") : "No destinations";

    const meta = document.createElement("div");
    meta.innerHTML = `
      <strong>${displayName}</strong>
      ${rule.isBolo ? '<span class="hint" style="margin-left: 8px; color: #f97316;">(Dispatcher BOLO)</span>' : ''}
      <div class="hint">Source: ${sourceDesc}</div>
      <div class="hint">Condition: ${rule.conditionText?.substring(0, 80)}${(rule.conditionText?.length || 0) > 80 ? "..." : ""}</div>
      <div class="hint">Route to: ${destDesc}</div>
    `;

    const statusWrap = document.createElement("div");
    statusWrap.innerHTML = `
      <span class="hint">Status</span>
      <div><strong style="color: ${rule.enabled ? '#22c55e' : '#ef4444'}">${rule.enabled ? "ENABLED" : "DISABLED"}</strong></div>
      <div class="hint">Created: ${rule.createdAt ? new Date(rule.createdAt).toLocaleDateString() : "N/A"}</div>
      ${rule.isBolo ? `<div class="hint">By: ${rule.createdByName || rule.createdBy}</div>` : ''}
    `;

    const actions = document.createElement("div");
    actions.className = "tenant-actions";

    const toggleButton = document.createElement("button");
    toggleButton.textContent = rule.enabled ? "Disable" : "Enable";
    toggleButton.className = "secondary";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "danger";

    const rowFeedback = document.createElement("div");
    rowFeedback.className = "hint";

    actions.appendChild(toggleButton);
    actions.appendChild(deleteButton);
    actions.appendChild(rowFeedback);

    toggleButton.addEventListener("click", async () => {
      rowFeedback.textContent = "Updating...";
      try {
        await apiRequest(`/elevation-rules/${encodeURIComponent(rule.ruleId)}`, "PATCH", {
          enabled: !rule.enabled
        });
        rowFeedback.textContent = "Updated";
        await loadElevationRules();
      } catch (error) {
        rowFeedback.textContent = `Error: ${error.message}`;
      }
    });

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete rule "${rule.name}"?`);
      if (!confirmed) return;

      rowFeedback.textContent = "Deleting...";
      try {
        await apiRequest(`/elevation-rules/${encodeURIComponent(rule.ruleId)}`, "DELETE");
        rowFeedback.textContent = "Deleted";
        await loadElevationRules();
      } catch (error) {
        rowFeedback.textContent = `Error: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);
    elevationRulesList.appendChild(item);
  });
}

elevationSourceTypeSelect.addEventListener("change", () => {
  populateElevationSelectors();
});

// Destination view toggle handlers
elevationDestShowGroupsBtn.addEventListener("click", () => {
  elevationDestViewMode = "groups";
  populateElevationDestAvailable();
});

elevationDestShowUsersBtn.addEventListener("click", () => {
  elevationDestViewMode = "users";
  populateElevationDestAvailable();
});

// Add selected items to destinations
elevationDestAddBtn.addEventListener("click", () => {
  const selected = Array.from(elevationDestAvailableSelect.selectedOptions);
  if (selected.length === 0) return;

  selected.forEach(opt => {
    elevationSelectedDestinations.push({
      type: opt.dataset.type,
      id: opt.value,
      name: opt.dataset.name
    });
  });

  populateElevationDestAvailable();
  renderElevationDestSelected();
});

// Remove selected items from destinations
elevationDestRemoveBtn.addEventListener("click", () => {
  const selected = Array.from(elevationDestSelectedSelect.selectedOptions);
  if (selected.length === 0) return;

  const toRemove = new Set(selected.map(opt => `${opt.dataset.type}:${opt.value}`));
  elevationSelectedDestinations = elevationSelectedDestinations.filter(
    d => !toRemove.has(`${d.type}:${d.id}`)
  );

  populateElevationDestAvailable();
  renderElevationDestSelected();
});

createElevationRuleButton.addEventListener("click", async () => {
  const name = elevationRuleNameInput.value.trim();
  const sourceType = elevationSourceTypeSelect.value;
  const sourceIds = sourceType !== "ALL"
    ? Array.from(elevationSourceIdsSelect.selectedOptions).map(o => o.value)
    : [];
  const conditionText = elevationConditionInput.value.trim();

  // Extract destination groups and users from combined selection
  const destinationGroups = elevationSelectedDestinations
    .filter(d => d.type === "group")
    .map(d => d.id);
  const destinationUsers = elevationSelectedDestinations
    .filter(d => d.type === "user")
    .map(d => d.id);

  if (!name) {
    createElevationStatus.textContent = "Rule name is required.";
    return;
  }
  if (!conditionText) {
    createElevationStatus.textContent = "Condition is required.";
    return;
  }
  if (sourceType !== "ALL" && sourceIds.length === 0) {
    createElevationStatus.textContent = "Select at least one source.";
    return;
  }
  if (destinationGroups.length === 0 && destinationUsers.length === 0) {
    createElevationStatus.textContent = "Select at least one destination.";
    return;
  }

  createElevationStatus.textContent = "Creating...";
  try {
    await apiRequest("/elevation-rules", "POST", {
      name,
      sourceType,
      sourceIds,
      conditionText,
      destinationGroups,
      destinationUsers
    });
    createElevationStatus.textContent = "Rule created.";
    elevationRuleNameInput.value = "";
    elevationSourceTypeSelect.value = "ALL";
    elevationConditionInput.value = "";
    clearElevationDestinations();
    populateElevationSelectors();
    await loadElevationRules();
  } catch (error) {
    createElevationStatus.textContent = `Error: ${error.message}`;
  }
});

tabElevation.addEventListener("click", async () => {
  setActiveTab("elevation");
  if (!state.users.length) await loadUsers();
  if (!state.groups.length) await loadGroups();
  // Reset destination view mode and selections
  elevationDestViewMode = "groups";
  clearElevationDestinations();
  populateElevationSelectors();
  await loadElevationRules();
});

refreshElevationButton.addEventListener("click", () => {
  loadElevationRules();
});

elevationRuleTypeFilter?.addEventListener("change", () => {
  renderElevationRules();
});

// API Keys tab elements
const apiKeysStatus = document.getElementById("api-keys-status");
const apiKeyNameInput = document.getElementById("api-key-name");
const apiKeyExpirySelect = document.getElementById("api-key-expiry");
const createApiKeyButton = document.getElementById("create-api-key");
const createApiKeyStatus = document.getElementById("create-api-key-status");
const apiKeyCreatedCard = document.getElementById("api-key-created-card");
const apiKeyCreatedValue = document.getElementById("api-key-created-value");
const apiKeyCopyButton = document.getElementById("api-key-copy");
const apiKeyDismissButton = document.getElementById("api-key-dismiss");
const apiKeysList = document.getElementById("api-keys-list");
const refreshApiKeysButton = document.getElementById("refresh-api-keys");
const apiKeyAvailablePerms = document.getElementById("api-key-available-perms");
const apiKeySelectedPerms = document.getElementById("api-key-selected-perms");
const apiKeyAddPermButton = document.getElementById("api-key-add-perm");
const apiKeyRemovePermButton = document.getElementById("api-key-remove-perm");
const apiKeyAddAllButton = document.getElementById("api-key-add-all");
const apiKeyStatusFilter = document.getElementById("api-key-status-filter");

// Permissions grouped by platform function
const API_KEY_PERMISSION_GROUPS = [
  { group: "Users", permissions: [
    { value: "users:read", label: "View users" },
    { value: "users:write", label: "Create, update, delete users" }
  ]},
  { group: "Channels", permissions: [
    { value: "channels:read", label: "View channels/groups" },
    { value: "channels:write", label: "Create, update, delete channels" }
  ]},
  { group: "Transmissions", permissions: [
    { value: "transmissions:read", label: "View transmissions and logs" }
  ]},
  { group: "Federations", permissions: [
    { value: "federations:read", label: "View federations" },
    { value: "federations:write", label: "Create, update, delete federations" }
  ]},
  { group: "Policies", permissions: [
    { value: "policies:read", label: "View retention/translation policies" },
    { value: "policies:write", label: "Update retention/translation policies" }
  ]},
  { group: "Elevation", permissions: [
    { value: "elevation:read", label: "View elevation rules" },
    { value: "elevation:write", label: "Create, update, delete elevation rules" }
  ]}
];

function populatePermissionSelect(selectEl, selectedPerms = []) {
  selectEl.innerHTML = "";
  const selectedSet = new Set(selectedPerms);
  API_KEY_PERMISSION_GROUPS.forEach(group => {
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

function populateSelectedPermissions(selectEl, selectedPerms = []) {
  selectEl.innerHTML = "";
  const permMap = {};
  API_KEY_PERMISSION_GROUPS.forEach(group => {
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

function getSelectedPermissionsFromSelect(selectEl) {
  const perms = [];
  selectEl.querySelectorAll("option").forEach(opt => perms.push(opt.value));
  return perms;
}

function initCreateKeyPermissions() {
  populatePermissionSelect(apiKeyAvailablePerms, []);
  apiKeySelectedPerms.innerHTML = "";
}

async function loadApiKeys() {
  try {
    apiKeysStatus.textContent = "Loading API keys...";
    const data = await apiRequest("/api-keys", "GET");
    state.apiKeys = data.keys ?? [];
    renderApiKeys();
    apiKeysStatus.textContent = "";
  } catch (error) {
    apiKeysStatus.textContent = `Failed to load: ${error.message}`;
  }
}

function getKeyStatus(key) {
  if (key.status === "revoked") return "REVOKED";
  if (key.expiresAt && new Date(key.expiresAt) < new Date()) return "EXPIRED";
  return "ACTIVE";
}

function renderApiKeys() {
  apiKeysList.innerHTML = "";

  const filterValue = apiKeyStatusFilter.value;

  // Filter by status
  const filtered = state.apiKeys.filter(key => {
    if (filterValue === "ALL") return true;
    return getKeyStatus(key) === filterValue;
  });

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent = filterValue === "ALL" ? "No API keys configured." : `No ${filterValue.toLowerCase()} keys.`;
    empty.className = "hint";
    apiKeysList.appendChild(empty);
    return;
  }

  // Sort: active first, then by created date
  const sorted = [...filtered].sort((a, b) => {
    const statusA = getKeyStatus(a);
    const statusB = getKeyStatus(b);
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
    populatePermissionSelect(editAvailableSelect, currentPerms);
    populateSelectedPermissions(editSelectedSelect, currentPerms);

    addBtn.addEventListener("click", () => {
      const toAdd = Array.from(editAvailableSelect.selectedOptions).map(o => o.value);
      if (!toAdd.length) return;
      const current = getSelectedPermissionsFromSelect(editSelectedSelect);
      const updated = [...current, ...toAdd];
      populatePermissionSelect(editAvailableSelect, updated);
      populateSelectedPermissions(editSelectedSelect, updated);
    });

    removeBtn.addEventListener("click", () => {
      const toRemove = new Set(Array.from(editSelectedSelect.selectedOptions).map(o => o.value));
      if (!toRemove.size) return;
      const current = getSelectedPermissionsFromSelect(editSelectedSelect);
      const updated = current.filter(p => !toRemove.has(p));
      populatePermissionSelect(editAvailableSelect, updated);
      populateSelectedPermissions(editSelectedSelect, updated);
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
      const selectedPermissions = getSelectedPermissionsFromSelect(editSelectedSelect);

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
        await apiRequest(`/api-keys/${key.keyId}`, "PATCH", updates);
        feedback.textContent = "Saved.";
        await loadApiKeys();
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
        await apiRequest(`/api-keys/${key.keyId}`, "DELETE");
        rowFeedback.textContent = "Revoked.";
        await loadApiKeys();
      } catch (error) {
        rowFeedback.textContent = `Failed: ${error.message}`;
      }
    });

    item.appendChild(meta);
    item.appendChild(statusWrap);
    item.appendChild(actions);
    item.appendChild(panel);
    apiKeysList.appendChild(item);
  });
}

apiKeyAddPermButton.addEventListener("click", () => {
  const toAdd = Array.from(apiKeyAvailablePerms.selectedOptions).map(o => o.value);
  if (!toAdd.length) return;
  const current = getSelectedPermissionsFromSelect(apiKeySelectedPerms);
  const updated = [...current, ...toAdd];
  populatePermissionSelect(apiKeyAvailablePerms, updated);
  populateSelectedPermissions(apiKeySelectedPerms, updated);
});

apiKeyRemovePermButton.addEventListener("click", () => {
  const toRemove = new Set(Array.from(apiKeySelectedPerms.selectedOptions).map(o => o.value));
  if (!toRemove.size) return;
  const current = getSelectedPermissionsFromSelect(apiKeySelectedPerms);
  const updated = current.filter(p => !toRemove.has(p));
  populatePermissionSelect(apiKeyAvailablePerms, updated);
  populateSelectedPermissions(apiKeySelectedPerms, updated);
});

apiKeyAddAllButton.addEventListener("click", () => {
  const allPerms = [];
  API_KEY_PERMISSION_GROUPS.forEach(g => g.permissions.forEach(p => allPerms.push(p.value)));
  populatePermissionSelect(apiKeyAvailablePerms, allPerms);
  populateSelectedPermissions(apiKeySelectedPerms, allPerms);
});

createApiKeyButton.addEventListener("click", async () => {
  const name = apiKeyNameInput.value.trim();
  const expiryDays = apiKeyExpirySelect.value;
  const selectedPermissions = getSelectedPermissionsFromSelect(apiKeySelectedPerms);

  if (!name) {
    createApiKeyStatus.textContent = "Name is required.";
    return;
  }
  if (selectedPermissions.length === 0) {
    createApiKeyStatus.textContent = "At least one permission is required.";
    return;
  }

  const payload = { name, permissions: selectedPermissions };
  if (expiryDays) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(expiryDays, 10));
    payload.expiresAt = expiry.toISOString();
  }

  createApiKeyStatus.textContent = "Creating...";
  try {
    const result = await apiRequest("/api-keys", "POST", payload);
    createApiKeyStatus.textContent = "";

    // Show the key in the created card
    apiKeyCreatedValue.value = result.key;
    apiKeyCreatedCard.classList.remove("hidden");

    // Reset form
    apiKeyNameInput.value = "";
    apiKeyExpirySelect.value = "";
    initCreateKeyPermissions();

    await loadApiKeys();
  } catch (error) {
    createApiKeyStatus.textContent = `Error: ${error.message}`;
  }
});

apiKeyCopyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(apiKeyCreatedValue.value);
    apiKeyCopyButton.textContent = "Copied!";
    setTimeout(() => {
      apiKeyCopyButton.textContent = "Copy";
      apiKeyCreatedCard.classList.add("hidden");
      apiKeyCreatedValue.value = "";
    }, 1500);
  } catch (error) {
    // Fallback for older browsers
    apiKeyCreatedValue.select();
    document.execCommand("copy");
    apiKeyCopyButton.textContent = "Copied!";
    setTimeout(() => {
      apiKeyCopyButton.textContent = "Copy";
      apiKeyCreatedCard.classList.add("hidden");
      apiKeyCreatedValue.value = "";
    }, 1500);
  }
});

apiKeyDismissButton.addEventListener("click", () => {
  apiKeyCreatedCard.classList.add("hidden");
  apiKeyCreatedValue.value = "";
});

tabApiKeys.addEventListener("click", async () => {
  setActiveTab("api-keys");
  initCreateKeyPermissions();
  await loadApiKeys();
});

refreshApiKeysButton.addEventListener("click", () => {
  loadApiKeys();
});

apiKeyStatusFilter.addEventListener("change", () => {
  renderApiKeys();
});

// ==================== Billing Tab ====================

const billingStatus = document.getElementById("billing-status");
const refreshBillingButton = document.getElementById("refresh-billing");
const billingUsersDetail = document.getElementById("billing-users-detail");
const billingUsersCost = document.getElementById("billing-users-cost");
const billingTranscriptionDetail = document.getElementById("billing-transcription-detail");
const billingTranscriptionCost = document.getElementById("billing-transcription-cost");
const billingTranslationDetail = document.getElementById("billing-translation-detail");
const billingTranslationCost = document.getElementById("billing-translation-cost");
const billingElevationDetail = document.getElementById("billing-elevation-detail");
const billingElevationCost = document.getElementById("billing-elevation-cost");
const billingRetentionDetail = document.getElementById("billing-retention-detail");
const billingRetentionCost = document.getElementById("billing-retention-cost");
const billingTotal = document.getElementById("billing-total");

function updateBillingCalculator() {
  let totalCost = 0;

  // 1. User costs
  const users = state.users || [];
  const dispatchers = users.filter(u => u.role === "DISPATCHER");
  const otherUsers = users.filter(u => u.role !== "DISPATCHER");
  const userCost = (dispatchers.length * state.pricing.dispatcherCost) + (otherUsers.length * state.pricing.userCost);

  if (users.length === 0) {
    billingUsersDetail.textContent = "No users";
  } else {
    const parts = [];
    if (otherUsers.length > 0) parts.push(`${otherUsers.length} user/admin × $${state.pricing.userCost.toFixed(2)}`);
    if (dispatchers.length > 0) parts.push(`${dispatchers.length} dispatcher × $${state.pricing.dispatcherCost.toFixed(2)}`);
    billingUsersDetail.textContent = parts.join(", ");
  }
  billingUsersCost.textContent = `$${userCost.toFixed(2)}`;
  totalCost += userCost;

  // 2. Transcription costs
  const transcriptionEnabled = translationPolicies.tenantTranscriptionEnabled;
  const transcriptionUsers = translationPolicies.users || [];
  const transcriptionCost = transcriptionEnabled ? transcriptionUsers.length * state.pricing.transcriptionCost : 0;

  if (!transcriptionEnabled) {
    billingTranscriptionDetail.textContent = "Disabled";
  } else if (transcriptionUsers.length === 0) {
    billingTranscriptionDetail.textContent = "No users";
  } else {
    billingTranscriptionDetail.textContent = `${transcriptionUsers.length} user${transcriptionUsers.length > 1 ? 's' : ''} × $${state.pricing.transcriptionCost.toFixed(2)}`;
  }
  billingTranscriptionCost.textContent = `$${transcriptionCost.toFixed(2)}`;
  totalCost += transcriptionCost;

  // 3. Translation costs
  const translationEnabled = translationPolicies.tenantTranslationEnabled;
  const usersWithTranslation = (translationPolicies.users || []).filter(u => u.translationEnabled);
  const translationCost = (transcriptionEnabled && translationEnabled) ? usersWithTranslation.length * state.pricing.translationCost : 0;

  if (!transcriptionEnabled || !translationEnabled) {
    billingTranslationDetail.textContent = "Disabled";
  } else if (usersWithTranslation.length === 0) {
    billingTranslationDetail.textContent = "No users enabled";
  } else {
    billingTranslationDetail.textContent = `${usersWithTranslation.length} user${usersWithTranslation.length > 1 ? 's' : ''} × $${state.pricing.translationCost.toFixed(2)}`;
  }
  billingTranslationCost.textContent = `$${translationCost.toFixed(2)}`;
  totalCost += translationCost;

  // 4. Elevation costs (only count enabled rules)
  const allRules = state.elevationRules || [];
  const activeRules = allRules.filter(r => r.enabled !== false);
  const elevationCost = activeRules.length * state.pricing.elevationRuleCost;

  if (activeRules.length === 0) {
    billingElevationDetail.textContent = "No active rules";
  } else {
    billingElevationDetail.textContent = `${activeRules.length} rule${activeRules.length > 1 ? 's' : ''} × $${state.pricing.elevationRuleCost.toFixed(2)}`;
  }
  billingElevationCost.textContent = `$${elevationCost.toFixed(2)}`;
  totalCost += elevationCost;

  // 5. Retention costs (use effectiveDays already calculated by backend)
  const retentionUsers = retentionPolicies.users || [];
  const FREE_DAYS = 30;
  let retentionCost = 0;

  if (retentionUsers.length > 0) {
    retentionUsers.forEach(u => {
      const billableDays = Math.max(0, (u.effectiveDays || 30) - FREE_DAYS);
      retentionCost += billableDays * state.pricing.retentionCostPerDay;
    });
  }

  if (retentionUsers.length === 0) {
    billingRetentionDetail.textContent = "No users";
  } else {
    const tenantDefault = retentionPolicies.tenantRetentionDays || 30;
    billingRetentionDetail.textContent = `${retentionUsers.length} user${retentionUsers.length > 1 ? 's' : ''}, ${tenantDefault} day default`;
  }
  billingRetentionCost.textContent = `$${retentionCost.toFixed(2)}`;
  totalCost += retentionCost;

  // Total
  billingTotal.textContent = totalCost.toFixed(2);
}

async function loadBillingData() {
  billingStatus.textContent = "Loading billing data...";
  try {
    // Load all required data in parallel
    const promises = [];
    if (!state.users.length) promises.push(loadUsers());
    if (!translationPolicies.users?.length) promises.push(loadTranslationPolicies());
    if (!state.elevationRules.length) promises.push(loadElevationRules());
    if (!retentionPolicies.users?.length) promises.push(loadRetentionPolicies());

    await Promise.all(promises);
    updateBillingCalculator();
    billingStatus.textContent = "";
  } catch (error) {
    billingStatus.textContent = `Error: ${error.message}`;
  }
}

tabBilling.addEventListener("click", async () => {
  setActiveTab("billing");
  await loadBillingData();
});

refreshBillingButton.addEventListener("click", async () => {
  // Force reload all data
  state.users = [];
  translationPolicies.users = [];
  state.elevationRules = [];
  retentionPolicies.users = [];
  await loadBillingData();
});

// Sidebar section collapse handling
document.querySelectorAll(".sidebar-section-header").forEach(header => {
  header.addEventListener("click", () => {
    const section = header.parentElement;
    section.classList.toggle("collapsed");
  });
});

// ==========================================
// Location History
// ==========================================

const locationUserFilter = document.getElementById("location-user-filter");
const locationStartDate = document.getElementById("location-start-date");
const locationEndDate = document.getElementById("location-end-date");
const loadLocationHistoryBtn = document.getElementById("load-location-history");
const locationStatus = document.getElementById("location-status");
const locationPlaybackControls = document.getElementById("location-playback-controls");
const locationTimeline = document.getElementById("location-timeline");
const locationCurrentTime = document.getElementById("location-current-time");
const locationTotalPoints = document.getElementById("location-total-points");
const locationPlayBtn = document.getElementById("location-play");
const locationPauseBtn = document.getElementById("location-pause");
const locationSpeedSelect = document.getElementById("location-speed");

let locationMap = null;
let locationMarker = null;
let locationPath = null;
let locationHistory = [];
let locationPlaybackIndex = 0;
let locationPlaybackInterval = null;
let locationPathLine = null;
let locationTransmissions = [];
let transmissionMarkers = [];
let currentAudio = null;
let geoFenceCircles = [];
let geoChannelsCache = null;

// Color schemes for presence
const PRESENCE_COLORS = {
  AVAILABLE: "#22c55e",  // Green
  BUSY: "#f59e0b",       // Amber
  DND: "#ef4444",        // Red
  OFFLINE: "#6b7280"     // Gray
};

// SVG icon generators for connection types
function createCellTowerIcon(color) {
  return L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="#fff" stroke-width="0.5">
      <path d="M12 22V10"/>
      <path d="M12 10l-4 4"/>
      <path d="M12 10l4 4"/>
      <rect x="10" y="2" width="4" height="8" rx="1"/>
      <path d="M6 8c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="${color}" stroke-width="2"/>
      <path d="M3 10c0-5 4-9 9-9s9 4 9 9" fill="none" stroke="${color}" stroke-width="2"/>
    </svg>`,
    className: "location-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
}

function createWifiIcon(color) {
  return L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="#fff" stroke-width="0.5">
      <circle cx="12" cy="18" r="3"/>
      <path d="M5 12c0-3.9 3.1-7 7-7s7 3.1 7 7" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M2 9c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    className: "location-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

function createSatelliteIcon(color) {
  return L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="#fff" stroke-width="0.5">
      <ellipse cx="12" cy="12" rx="3" ry="2" transform="rotate(-45 12 12)"/>
      <path d="M4 4l3 3" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 17l3 3" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <rect x="6" y="6" width="4" height="2" rx="1" transform="rotate(-45 8 7)"/>
      <rect x="14" y="14" width="4" height="2" rx="1" transform="rotate(-45 16 15)"/>
      <circle cx="4" cy="20" r="2" fill="none" stroke="${color}" stroke-width="1.5"/>
      <path d="M4 16c2.2 0 4 1.8 4 4" fill="none" stroke="${color}" stroke-width="1.5"/>
      <path d="M4 12c4.4 0 8 3.6 8 8" fill="none" stroke="${color}" stroke-width="1.5"/>
    </svg>`,
    className: "location-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

function createWalkieTalkieIcon(color) {
  return L.divIcon({
    html: `<svg viewBox="0 0 24 24" width="28" height="28" fill="${color}" stroke="#fff" stroke-width="0.5">
      <rect x="7" y="4" width="10" height="18" rx="2" ry="2"/>
      <circle cx="12" cy="9" r="2.5" fill="#0f172a"/>
      <rect x="9" y="14" width="6" height="5" rx="1" fill="#0f172a"/>
      <rect x="4" y="6" width="3" height="5" rx="1"/>
      <path d="M17 2c1.5 1 2.5 2.5 2.5 4.5" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M19 0c2 1.3 3.5 3.5 3.5 6" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
    className: "location-icon walkie-talkie-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
}

function getConnectionIcon(pollMode, presence) {
  const color = PRESENCE_COLORS[presence] || PRESENCE_COLORS.AVAILABLE;
  switch (pollMode) {
    case "WIFI": return createWifiIcon(color);
    case "SAT": return createSatelliteIcon(color);
    case "CELL":
    default: return createCellTowerIcon(color);
  }
}

function initLocationMap() {
  if (locationMap) return;

  locationMap = L.map("location-map").setView([39.8283, -98.5795], 4);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }).addTo(locationMap);
}

async function fetchGeoChannels() {
  if (geoChannelsCache) return geoChannelsCache;

  try {
    const data = await apiRequest("/geo-channels", "GET");
    geoChannelsCache = data.geoChannels || [];
    return geoChannelsCache;
  } catch (err) {
    console.error("Failed to fetch geo-channels:", err);
    return [];
  }
}

function clearGeoFenceCircles() {
  geoFenceCircles.forEach(circle => {
    if (locationMap) locationMap.removeLayer(circle);
  });
  geoFenceCircles = [];
}

async function drawGeoFenceCircles() {
  clearGeoFenceCircles();

  const geoChannels = await fetchGeoChannels();
  if (!geoChannels.length || !locationMap) return;

  geoChannels.forEach(channel => {
    if (channel.lat && channel.lng) {
      // Draw the geo-fence circle
      const circle = L.circle([channel.lat, channel.lng], {
        radius: channel.radiusMeters || 500,
        color: "#0891b2",
        fillColor: "#0891b2",
        fillOpacity: 0.15,
        weight: 2,
        dashArray: "5, 5"
      }).addTo(locationMap);

      // Add a popup with the channel name
      circle.bindPopup(`
        <div style="text-align: center;">
          <strong>${channel.name}</strong><br>
          <span style="color: #0891b2; font-size: 11px;">GEO-FENCE</span><br>
          <span style="font-size: 11px;">${channel.radiusMeters || 500}m radius</span>
        </div>
      `);

      // Add a label marker at the center
      const labelIcon = L.divIcon({
        html: `<div style="background: #0891b2; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; white-space: nowrap; font-weight: 500;">${channel.name}</div>`,
        className: "geo-fence-label",
        iconAnchor: [0, 0]
      });
      const labelMarker = L.marker([channel.lat, channel.lng], { icon: labelIcon }).addTo(locationMap);

      geoFenceCircles.push(circle);
      geoFenceCircles.push(labelMarker);
    }
  });

  console.log(`[Location Map] Drew ${geoChannels.length} geo-fence circles`);
}

function populateLocationUserFilter() {
  locationUserFilter.innerHTML = '<option value="">Select a user</option>';
  const sortedUsers = [...state.users].sort((a, b) =>
    (a.displayName || a.email || a.userId).localeCompare(b.displayName || b.email || b.userId)
  );
  sortedUsers.forEach(user => {
    const option = document.createElement("option");
    option.value = user.userId;
    option.textContent = user.displayName || user.email || user.userId;
    locationUserFilter.appendChild(option);
  });
}

async function loadLocationHistory() {
  const userId = locationUserFilter.value;
  if (!userId) {
    locationStatus.textContent = "Please select a user.";
    return;
  }

  locationStatus.textContent = "Loading location history...";
  stopLocationPlayback();
  stopCurrentAudio();

  try {
    const params = new URLSearchParams({ userId });
    const startTime = locationStartDate.value ? `${locationStartDate.value}T00:00:00.000Z` : null;
    const endTime = locationEndDate.value ? `${locationEndDate.value}T23:59:59.999Z` : null;

    if (startTime) params.set("startTime", startTime);
    if (endTime) params.set("endTime", endTime);

    // Fetch location history and transmissions in parallel
    const [locationData, transmissionData] = await Promise.all([
      apiRequest(`/location-history?${params.toString()}`, "GET"),
      fetchUserTransmissions(userId, startTime, endTime)
    ]);

    locationHistory = (locationData.locationHistory || []).reverse(); // Oldest first for playback
    locationTransmissions = transmissionData || [];

    const txCount = locationTransmissions.length;
    console.log("[Location History] Loaded", locationHistory.length, "location points and", txCount, "transmissions");

    // Always render the transmission log
    renderTransmissionLog();

    if (locationHistory.length === 0) {
      const txMsg = txCount > 0 ? ` Found ${txCount} transmissions.` : "";
      locationStatus.textContent = `No location history found for this user in the selected range.${txMsg}`;
      locationPlaybackControls.classList.add("hidden");
      // Clear map but keep transmission log
      if (locationMarker) {
        locationMap.removeLayer(locationMarker);
        locationMarker = null;
      }
      if (locationPathLine) {
        locationMap.removeLayer(locationPathLine);
        locationPathLine = null;
      }
      transmissionMarkers.forEach(marker => locationMap.removeLayer(marker));
      transmissionMarkers = [];
      return;
    }

    locationStatus.textContent = `Found ${locationHistory.length} location points${txCount > 0 ? ` and ${txCount} transmissions` : ""}.`;
    locationTotalPoints.textContent = `${locationHistory.length} points`;
    locationTimeline.max = locationHistory.length - 1;
    locationTimeline.value = 0;
    locationPlaybackIndex = 0;

    // Draw the full path
    drawLocationPath();

    // Draw geo-fence circles on the map
    await drawGeoFenceCircles();

    // Show the first point (this also updates transmission markers for that time)
    updateLocationMarker(0);

    // Fit map to path bounds
    if (locationPathLine) {
      locationMap.fitBounds(locationPathLine.getBounds(), { padding: [50, 50] });
    }

    locationPlaybackControls.classList.remove("hidden");
  } catch (err) {
    locationStatus.textContent = `Error: ${err.message}`;
    console.error("Failed to load location history:", err);
  }
}

async function fetchUserTransmissions(userId, startTime, endTime) {
  try {
    const params = new URLSearchParams({
      userId,
      limit: "500"
    });
    if (startTime) params.set("startDate", startTime);
    if (endTime) params.set("endDate", endTime);

    console.log("[Location History] Fetching transmissions with params:", params.toString());
    const data = await apiRequest(`/transmissions?${params.toString()}`, "GET");
    console.log("[Location History] Received transmissions:", data.transmissions?.length ?? 0);

    // Return all transmissions - filtering for map markers happens in drawTransmissionMarkers
    return data.transmissions || [];
  } catch (err) {
    console.error("Failed to fetch transmissions:", err);
    return [];
  }
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

// Update transmission markers based on current playback time
function updateTransmissionMarkers(currentTimestamp) {
  // Clear existing transmission markers
  transmissionMarkers.forEach(marker => locationMap.removeLayer(marker));
  transmissionMarkers = [];

  if (locationHistory.length === 0) return;

  const currentTime = new Date(currentTimestamp).getTime();

  // Show transmissions that occurred within 60 seconds of the current playback time
  const windowMs = 60 * 1000; // 60 second window

  const txWithLocation = locationTransmissions.filter(tx => {
    if (!tx.latitude || !tx.longitude) return false;
    const txTime = new Date(tx.createdAt).getTime();
    return txTime >= currentTime - windowMs && txTime <= currentTime + windowMs;
  });

  txWithLocation.forEach(tx => {
    // Use cyan color for transmission markers (broadcasting)
    const icon = createWalkieTalkieIcon("#38bdf8");
    const marker = L.marker([tx.latitude, tx.longitude], { icon }).addTo(locationMap);

    const time = new Date(tx.createdAt).toLocaleString();
    const duration = tx.durationMs ? `${(tx.durationMs / 1000).toFixed(1)}s` : "N/A";
    const summary = tx.summaryText || tx.transcriptText || "No transcript";

    const popupContent = document.createElement("div");
    popupContent.innerHTML = `
      <div class="location-popup-time">${time}</div>
      <div class="location-popup-coords">${tx.latitude.toFixed(6)}, ${tx.longitude.toFixed(6)}</div>
      <div class="location-popup-info" style="margin-top: 8px;">
        <strong>Duration:</strong> ${duration}<br>
        <strong>Channel:</strong> ${tx.channelName || tx.channelId}
      </div>
      <div class="location-popup-info" style="margin-top: 4px; max-width: 200px; word-wrap: break-word;">
        ${summary}
      </div>
      ${tx.audioUrl ? '<button class="tx-play-btn" style="margin-top: 8px; width: 100%;">▶ Play Audio</button>' : ""}
    `;

    if (tx.audioUrl) {
      const playBtn = popupContent.querySelector(".tx-play-btn");
      playBtn.addEventListener("click", () => {
        stopCurrentAudio();
        currentAudio = new Audio(tx.audioUrl);
        currentAudio.play();
        playBtn.textContent = "◼ Stop";
        playBtn.onclick = () => {
          stopCurrentAudio();
          playBtn.textContent = "▶ Play Audio";
          playBtn.onclick = null; // Reset to allow re-binding
        };
      });
    }

    marker.bindPopup(popupContent, { maxWidth: 250 });
    transmissionMarkers.push(marker);
  });
}

function renderTransmissionLog() {
  const logContainer = document.getElementById("transmission-log-container");
  if (!logContainer) return;

  if (locationTransmissions.length === 0) {
    logContainer.innerHTML = '<p class="hint">No transmissions found for this user in the selected date range.</p>';
    return;
  }

  // Sort transmissions by time (newest first for display)
  const sortedTx = [...locationTransmissions].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  let html = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Channel</th>
          <th>Duration</th>
          <th>Summary</th>
          <th>Audio</th>
        </tr>
      </thead>
      <tbody>
  `;

  sortedTx.forEach(tx => {
    const time = new Date(tx.createdAt).toLocaleString();
    const duration = tx.durationMs ? `${(tx.durationMs / 1000).toFixed(1)}s` : "-";
    const summary = tx.summaryText || tx.transcriptText || "-";
    const channelName = tx.channelName || tx.channelId || "-";

    html += `
      <tr>
        <td style="white-space: nowrap;">${time}</td>
        <td>${channelName}</td>
        <td>${duration}</td>
        <td class="summary-cell" title="${summary.replace(/"/g, '&quot;')}">${summary}</td>
        <td>
          ${tx.audioUrl ? `<button class="secondary tx-log-play-btn" data-url="${tx.audioUrl}">▶</button>` : "-"}
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  logContainer.innerHTML = html;

  // Add click handlers for play buttons
  logContainer.querySelectorAll(".tx-log-play-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.url;
      if (currentAudio && btn.textContent === "◼") {
        stopCurrentAudio();
        btn.textContent = "▶";
      } else {
        // Stop any currently playing audio and reset all buttons
        stopCurrentAudio();
        logContainer.querySelectorAll(".tx-log-play-btn").forEach(b => b.textContent = "▶");

        currentAudio = new Audio(url);
        currentAudio.play();
        btn.textContent = "◼";
        currentAudio.onended = () => {
          btn.textContent = "▶";
          currentAudio = null;
        };
      }
    });
  });
}

function clearLocationMap() {
  if (locationMarker) {
    locationMap.removeLayer(locationMarker);
    locationMarker = null;
  }
  if (locationPathLine) {
    locationMap.removeLayer(locationPathLine);
    locationPathLine = null;
  }
  // Clear transmission markers from map (but don't clear the data array)
  transmissionMarkers.forEach(marker => locationMap.removeLayer(marker));
  transmissionMarkers = [];
}

function resetLocationHistoryState() {
  clearLocationMap();
  locationTransmissions = [];
  locationHistory = [];

  // Clear transmission log
  const logContainer = document.getElementById("transmission-log-container");
  if (logContainer) {
    logContainer.innerHTML = '<p class="hint">Select a user and date range, then click "Load History" to view transmissions.</p>';
  }
}

function drawLocationPath() {
  clearLocationMap();

  if (locationHistory.length === 0) return;

  const pathCoords = locationHistory.map(point => [point.latitude, point.longitude]);

  locationPathLine = L.polyline(pathCoords, {
    color: "#38bdf8",
    weight: 3,
    opacity: 0.6
  }).addTo(locationMap);
}

function updateLocationMarker(index) {
  if (index < 0 || index >= locationHistory.length) return;

  const point = locationHistory[index];
  const latlng = [point.latitude, point.longitude];
  const pollMode = point.pollMode || "CELL";
  const presence = point.presence || "AVAILABLE";
  const presenceColor = PRESENCE_COLORS[presence] || PRESENCE_COLORS.AVAILABLE;

  // Get the appropriate icon based on connection type and presence
  const icon = getConnectionIcon(pollMode, presence);

  // Remove existing marker and create new one with updated icon
  if (locationMarker) {
    locationMap.removeLayer(locationMarker);
  }
  locationMarker = L.marker(latlng, { icon }).addTo(locationMap);

  // Update popup
  const time = new Date(point.timestamp).toLocaleString();
  const networkLabels = { WIFI: "WiFi", CELL: "Cellular", SAT: "Satellite" };
  const networkLabel = networkLabels[pollMode] || pollMode;

  const popupContent = `
    <div class="location-popup-time">${time}</div>
    <div class="location-popup-coords">${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}</div>
    <div class="location-popup-info">
      <strong>Connection:</strong> ${networkLabel}
    </div>
    <div class="location-popup-info">
      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${presenceColor}; margin-right: 4px;"></span>
      <strong>Presence:</strong> ${presence}
    </div>
    ${point.batteryLevel != null ? `<div class="location-popup-info"><strong>Battery:</strong> ${point.batteryLevel}%</div>` : ""}
  `;
  locationMarker.bindPopup(popupContent);

  // Update transmission markers to show only those up to current time
  updateTransmissionMarkers(point.timestamp);

  // Update timeline display
  locationCurrentTime.textContent = time;
  locationTimeline.value = index;
  locationPlaybackIndex = index;
}

function startLocationPlayback() {
  if (locationHistory.length === 0) return;

  const speed = parseFloat(locationSpeedSelect.value);
  const interval = 1000 / speed; // Base rate: 1 point per second

  locationPlayBtn.classList.add("hidden");
  locationPauseBtn.classList.remove("hidden");

  locationPlaybackInterval = setInterval(() => {
    locationPlaybackIndex++;
    if (locationPlaybackIndex >= locationHistory.length) {
      locationPlaybackIndex = locationHistory.length - 1;
      stopLocationPlayback();
      return;
    }
    updateLocationMarker(locationPlaybackIndex);
  }, interval);
}

function stopLocationPlayback() {
  if (locationPlaybackInterval) {
    clearInterval(locationPlaybackInterval);
    locationPlaybackInterval = null;
  }
  locationPlayBtn.classList.remove("hidden");
  locationPauseBtn.classList.add("hidden");
}

// Location History Event Listeners
tabLocationHistory.addEventListener("click", async () => {
  setActiveTab("location-history");
  initLocationMap();

  // Load users if not already loaded
  if (state.users.length === 0) {
    await loadUsers();
  }
  populateLocationUserFilter();

  // Set default date range to last 7 days
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  locationEndDate.value = today.toISOString().split("T")[0];
  locationStartDate.value = weekAgo.toISOString().split("T")[0];

  // Invalidate map size after tab becomes visible
  setTimeout(() => {
    if (locationMap) {
      locationMap.invalidateSize();
    }
  }, 100);
});

loadLocationHistoryBtn.addEventListener("click", loadLocationHistory);

locationUserFilter.addEventListener("change", () => {
  resetLocationHistoryState();
  locationPlaybackControls.classList.add("hidden");
});

locationPlayBtn.addEventListener("click", startLocationPlayback);
locationPauseBtn.addEventListener("click", stopLocationPlayback);

locationTimeline.addEventListener("input", () => {
  stopLocationPlayback();
  updateLocationMarker(parseInt(locationTimeline.value, 10));
});

locationSpeedSelect.addEventListener("change", () => {
  if (locationPlaybackInterval) {
    stopLocationPlayback();
    startLocationPlayback();
  }
});

showApp(false);
