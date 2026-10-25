(() => {
  "use strict";

  const STORAGE_KEYS = {
    conversations: "cybermentor.conversations",
    theme: "cybermentor.theme"
  };
  const MAX_TITLE_LENGTH = 42;
  const MAX_CONVERSATIONS = 50;
  const RESPONSE_DELAY_MS = 850;

  const elements = {
    sidebar: document.querySelector("#sidebar"),
    mobileScrim: document.querySelector("#mobile-scrim"),
    newChatButton: document.querySelector("#new-chat"),
    collapseSidebarButton: document.querySelector("#collapse-sidebar"),
    expandSidebarButton: document.querySelector("#expand-sidebar"),
    openSidebarButton: document.querySelector("#open-sidebar"),
    conversationList: document.querySelector("#conversation-list"),
    emptyHistory: document.querySelector("#empty-history"),
    historyCount: document.querySelector("#history-count"),
    welcomeScreen: document.querySelector("#welcome-screen"),
    messages: document.querySelector("#messages"),
    chatViewport: document.querySelector("#chat-viewport"),
    messageForm: document.querySelector("#message-form"),
    messageInput: document.querySelector("#message-input"),
    sendButton: document.querySelector("#send-button"),
    clearChatButton: document.querySelector("#clear-chat"),
    openSettingsButton: document.querySelector("#open-settings"),
    settingsBackdrop: document.querySelector("#settings-backdrop"),
    settingsDialog: document.querySelector("#settings-dialog"),
    closeSettingsButton: document.querySelector("#close-settings"),
    themeToggle: document.querySelector("#theme-toggle"),
    themeLabel: document.querySelector("#theme-label"),
    clearHistoryButton: document.querySelector("#clear-history"),
    toast: document.querySelector("#toast")
  };

  const responseTopics = [
    {
      keywords: ["tcp", "udp", "transmission control", "user datagram"],
      answer: "TCP and UDP are transport protocols—different ways to deliver data between devices.\n\n**TCP** makes a connection first, checks that data arrives in order, and retransmits missing pieces. It is reliable, which is useful for web pages and file transfers.\n\n**UDP** sends packets without setting up a connection or guaranteeing delivery. It has less overhead and is often useful for live calls, streaming, or games where speed matters.\n\nA simple analogy: TCP is tracked mail; UDP is a quick postcard."
    },
    {
      keywords: ["dhcp", "dynamic host configuration"],
      answer: "DHCP (Dynamic Host Configuration Protocol) automatically gives a device the network settings it needs, such as an IP address, gateway, and DNS server.\n\nA simplified exchange is called **DORA**: Discover (the device asks), Offer (a DHCP server responds), Request (the device accepts), and Acknowledge (the server confirms the lease).\n\nThis saves you from configuring each device manually. A typical home router acts as the DHCP server."
    },
    {
      keywords: ["dns", "domain name system", "domain name"],
      answer: "DNS (Domain Name System) translates human-friendly names such as `example.com` into IP addresses that computers use to find each other.\n\nWhen you visit a site, your device checks its cache and, if needed, asks a DNS resolver. The resolver looks up the answer through the DNS hierarchy and returns it for a limited time (its **TTL**).\n\nThink of DNS as the internet's contacts list: you remember a name, and it finds the number."
    },
    {
      keywords: ["ip address", "ip addresses", "ipv4", "ipv6", "internet protocol"],
      answer: "An IP address is a numerical address used to identify a device or network interface so data can be routed to it.\n\n**IPv4** addresses look like `192.168.1.10`; **IPv6** addresses are longer and were introduced to provide many more possible addresses. An address can be public (routable on the internet) or private (used inside a local network).\n\nIt's a bit like a mailing address for network traffic—routers use it to help packets reach the right destination."
    },
    {
      keywords: ["nat", "network address translation"],
      answer: "NAT (Network Address Translation) lets a router translate addresses between a private network and another network, commonly the public internet.\n\nAt home, many devices with private IP addresses can share one public IPv4 address. The router keeps track of connections so replies get sent back to the right device.\n\nNAT helps conserve IPv4 addresses, but it is not a replacement for a firewall or other security controls."
    },
    {
      keywords: ["cybersecurity", "cyber security", "phishing", "malware", "password", "two-factor", "2fa", "mfa", "security basics", "network security"],
      answer: "Cybersecurity is the practice of protecting devices, accounts, networks, and information from misuse or attack.\n\nA few good starting habits:\n- Use unique, long passwords and a password manager.\n- Turn on multi-factor authentication where available.\n- Keep software and devices updated.\n- Pause before opening unexpected links or attachments.\n- Back up important files and limit access to what you need.\n\nThese are useful basics, not a guarantee of security. If you have a specific concept in mind, ask me about it."
    },
    {
      keywords: ["network", "router", "firewall", "internet", "packet"],
      answer: "A computer network is a group of connected devices that exchange data. Devices break data into packets, and switches and routers help move those packets to the right destination.\n\nA router connects different networks (like your home network and the internet). A firewall applies rules to allow or block network traffic. These pieces work together, but they each have a different role.\n\nThis prototype has a small set of pre-written explanations. Try asking about DNS, DHCP, IP addresses, NAT, TCP vs UDP, or basic cybersecurity."
    }
  ];

  let conversations = loadConversations();
  let activeConversationId = conversations[0]?.id || null;
  const pendingResponses = new Set();
  let toastTimeoutId;

  applySavedTheme();
  renderConversationList();
  bindEvents();
  renderActiveConversation();

  function bindEvents() {
    elements.newChatButton.addEventListener("click", startNewConversation);
    elements.clearChatButton.addEventListener("click", startNewConversation);
    elements.collapseSidebarButton.addEventListener("click", () => {
      document.body.classList.add("sidebar-collapsed");
    });
    elements.expandSidebarButton.addEventListener("click", () => {
      document.body.classList.remove("sidebar-collapsed");
    });
    elements.openSidebarButton.addEventListener("click", openMobileSidebar);
    elements.mobileScrim.addEventListener("click", closeMobileSidebar);
    elements.messageForm.addEventListener("submit", (event) => {
      event.preventDefault();
      sendCurrentMessage();
    });
    elements.messageInput.addEventListener("input", () => {
      resizeComposer();
      updateSendButton();
    });
    elements.messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        sendCurrentMessage();
      }
    });
    document.querySelectorAll("[data-prompt]").forEach((button) => {
      button.addEventListener("click", () => sendMessage(button.dataset.prompt || ""));
    });
    elements.openSettingsButton.addEventListener("click", openSettings);
    elements.closeSettingsButton.addEventListener("click", closeSettings);
    elements.settingsBackdrop.addEventListener("click", (event) => {
      if (event.target === elements.settingsBackdrop) closeSettings();
    });
    elements.themeToggle.addEventListener("change", toggleTheme);
    elements.clearHistoryButton.addEventListener("click", clearConversationHistory);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSettings();
        closeMobileSidebar();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        startNewConversation();
      }
    });
  }

  function loadConversations() {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEYS.conversations);
      if (!storedValue) return [];
      const parsed = JSON.parse(storedValue);
      if (!Array.isArray(parsed)) throw new Error("Conversation history is not a list.");
      return parsed.filter(isValidConversation).slice(0, MAX_CONVERSATIONS);
    } catch (error) {
      console.error("Could not restore conversation history:", error);
      showToast("Saved conversations could not be read. Starting with an empty history.");
      return [];
    }
  }

  function isValidConversation(value) {
    return value
      && typeof value.id === "string"
      && typeof value.title === "string"
      && Array.isArray(value.messages)
      && value.messages.every((message) =>
        message
        && typeof message.id === "string"
        && ["user", "assistant"].includes(message.role)
        && typeof message.content === "string"
        && typeof message.createdAt === "number"
      );
  }

  function saveConversations() {
    try {
      localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
      return true;
    } catch (error) {
      console.error("Could not save conversation history:", error);
      showToast("This conversation could not be saved in your browser.");
      return false;
    }
  }

  function applySavedTheme() {
    let theme = "dark";
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
      if (savedTheme === "light" || savedTheme === "dark") theme = savedTheme;
    } catch (error) {
      console.error("Could not read the saved theme:", error);
    }
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    elements.themeToggle.checked = theme === "light";
    elements.themeLabel.textContent = theme === "light" ? "Light" : "Dark";
  }

  function toggleTheme() {
    const theme = elements.themeToggle.checked ? "light" : "dark";
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, theme);
    } catch (error) {
      console.error("Could not save the selected theme:", error);
      showToast("The theme changed, but could not be saved in this browser.");
    }
  }

  function startNewConversation() {
    activeConversationId = null;
    renderActiveConversation();
    closeMobileSidebar();
    elements.messageInput.focus();
  }

  function sendCurrentMessage() {
    sendMessage(elements.messageInput.value);
  }

  function sendMessage(rawText) {
    const content = rawText.trim();
    if (!content) return;

    let conversation = getActiveConversation();
    if (conversation && pendingResponses.has(conversation.id)) return;
    if (!conversation) {
      conversation = {
        id: createId(),
        title: makeConversationTitle(content),
        messages: [],
        updatedAt: Date.now()
      };
      conversations.unshift(conversation);
      activeConversationId = conversation.id;
    }

    conversation.messages.push(createMessage("user", content));
    conversation.updatedAt = Date.now();
    if (conversation.messages.filter((message) => message.role === "user").length === 1) {
      conversation.title = makeConversationTitle(content);
    }
    conversations = conversations.slice(0, MAX_CONVERSATIONS);
    activeConversationId = conversation.id;
    elements.messageInput.value = "";
    resizeComposer();
    updateSendButton();
    saveConversations();
    renderConversationList();
    renderActiveConversation();
    pendingResponses.add(conversation.id);
    renderThinkingIndicator();

    window.setTimeout(() => {
      const pendingConversation = conversations.find((item) => item.id === conversation.id);
      pendingResponses.delete(conversation.id);
      if (!pendingConversation) return;
      pendingConversation.messages.push(createMessage("assistant", getMockResponse(content)));
      pendingConversation.updatedAt = Date.now();
      saveConversations();
      renderConversationList();
      if (activeConversationId === pendingConversation.id) renderActiveConversation();
    }, RESPONSE_DELAY_MS);
  }

  function createMessage(role, content) {
    return { id: createId(), role, content, createdAt: Date.now() };
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makeConversationTitle(message) {
    const normalized = message.replace(/\s+/g, " ").trim();
    if (normalized.length <= MAX_TITLE_LENGTH) return normalized;
    return `${normalized.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
  }

  function getActiveConversation() {
    return conversations.find((conversation) => conversation.id === activeConversationId) || null;
  }

  // This frontend-only response handler can later be replaced by a request to your own backend.
  function getMockResponse(userMessage) {
    const normalized = userMessage.toLowerCase();
    const matchedTopic = responseTopics.find((topic) =>
      topic.keywords.some((keyword) => normalized.includes(keyword))
    );
    return matchedTopic
      ? matchedTopic.answer
      : "I'm still learning this small set of topics, so I don't have a prepared answer for that yet. Try asking me about DNS, DHCP, IP addresses, NAT, TCP versus UDP, or basic cybersecurity. Your question is still saved in this conversation!";
  }

  function renderConversationList() {
    elements.conversationList.replaceChildren();
    elements.historyCount.textContent = String(conversations.length);
    elements.emptyHistory.hidden = conversations.length > 0;

    conversations.forEach((conversation) => {
      const item = document.createElement("div");
      item.className = `conversation-item${conversation.id === activeConversationId ? " active" : ""}`;

      const selectButton = document.createElement("button");
      selectButton.className = "conversation-select";
      selectButton.type = "button";
      selectButton.setAttribute("aria-label", `Open conversation: ${conversation.title}`);
      selectButton.append(createIcon("chat"));
      const title = document.createElement("span");
      title.className = "conversation-title";
      title.textContent = conversation.title;
      selectButton.append(title);
      selectButton.addEventListener("click", () => selectConversation(conversation.id));

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-conversation";
      deleteButton.type = "button";
      deleteButton.setAttribute("aria-label", `Delete conversation: ${conversation.title}`);
      deleteButton.title = "Delete conversation";
      deleteButton.append(createIcon("trash"));
      deleteButton.addEventListener("click", () => deleteConversation(conversation.id));

      item.append(selectButton, deleteButton);
      elements.conversationList.append(item);
    });
  }

  function selectConversation(conversationId) {
    activeConversationId = conversationId;
    renderConversationList();
    renderActiveConversation();
    closeMobileSidebar();
  }

  function deleteConversation(conversationId) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (!conversation || !window.confirm(`Delete "${conversation.title}"? This cannot be undone.`)) return;
    conversations = conversations.filter((item) => item.id !== conversationId);
    if (activeConversationId === conversationId) activeConversationId = null;
    saveConversations();
    renderConversationList();
    renderActiveConversation();
  }

  function clearConversationHistory() {
    if (!conversations.length) {
      showToast("There are no saved conversations to clear.");
      return;
    }
    if (!window.confirm("Clear all saved conversations from this browser? This cannot be undone.")) return;
    conversations = [];
    activeConversationId = null;
    pendingResponses.clear();
    saveConversations();
    renderConversationList();
    renderActiveConversation();
    closeSettings();
    showToast("Conversation history cleared.");
  }

  function renderActiveConversation() {
    const conversation = getActiveConversation();
    elements.messages.replaceChildren();
    const hasMessages = Boolean(conversation && conversation.messages.length);
    elements.welcomeScreen.classList.toggle("is-hidden", hasMessages);
    elements.messages.classList.toggle("visible", hasMessages);
    updateSendButton();
    if (!hasMessages) return;

    conversation.messages.forEach((message) => {
      elements.messages.append(createMessageElement(message));
    });
    if (pendingResponses.has(conversation.id)) appendThinkingIndicator();
    scrollToLatest();
  }

  function createMessageElement(message) {
    const article = document.createElement("article");
    article.className = `message ${message.role}-message`;
    article.dataset.messageId = message.id;

    if (message.role === "assistant") {
      const avatar = document.createElement("span");
      avatar.className = "message-avatar";
      avatar.setAttribute("aria-label", "CyberMentor");
      avatar.append(createIcon("shield"));
      article.append(avatar);

      const body = document.createElement("div");
      body.className = "message-body";
      const meta = document.createElement("div");
      meta.className = "message-meta";
      meta.textContent = "CyberMentor";
      const content = document.createElement("div");
      content.className = "message-content";
      content.textContent = message.content;
      body.append(meta, content, createCopyButton(message.content));
      article.append(body);
    } else {
      const body = document.createElement("div");
      body.className = "message-body";
      const content = document.createElement("div");
      content.className = "message-content";
      content.textContent = message.content;
      body.append(content, createCopyButton(message.content));
      article.append(body);
    }
    return article;
  }

  function createCopyButton(text) {
    const button = document.createElement("button");
    button.className = "copy-button";
    button.type = "button";
    button.append(createIcon("copy"));
    const label = document.createElement("span");
    label.textContent = "Copy";
    button.append(label);
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        label.textContent = "Copied";
        window.setTimeout(() => { label.textContent = "Copy"; }, 1400);
      } catch (error) {
        console.error("Could not copy this message:", error);
        showToast("Could not copy. Your browser may not allow clipboard access here.");
      }
    });
    return button;
  }

  function renderThinkingIndicator() {
    const conversation = getActiveConversation();
    if (!conversation) return;
    elements.welcomeScreen.classList.add("is-hidden");
    elements.messages.classList.add("visible");
    appendThinkingIndicator();
    updateSendButton();
    scrollToLatest();
  }

  function appendThinkingIndicator() {
    const row = document.createElement("article");
    row.className = "message assistant-message";
    row.id = "thinking-indicator";
    const avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.append(createIcon("shield"));
    const body = document.createElement("div");
    body.className = "message-body";
    const indicator = document.createElement("div");
    indicator.className = "thinking-indicator";
    indicator.append(document.createTextNode("CyberMentor is thinking"));
    const dots = document.createElement("span");
    dots.className = "thinking-dots";
    dots.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 3; index += 1) dots.append(document.createElement("span"));
    indicator.append(dots);
    body.append(indicator);
    row.append(avatar, body);
    elements.messages.append(row);
  }

  function scrollToLatest() {
    window.requestAnimationFrame(() => {
      elements.chatViewport.scrollTop = elements.chatViewport.scrollHeight;
    });
  }

  function resizeComposer() {
    elements.messageInput.style.height = "auto";
    elements.messageInput.style.height = `${Math.min(elements.messageInput.scrollHeight, 150)}px`;
  }

  function updateSendButton() {
    const conversation = getActiveConversation();
    elements.sendButton.disabled = !elements.messageInput.value.trim()
      || Boolean(conversation && pendingResponses.has(conversation.id));
  }

  function openSettings() {
    elements.settingsBackdrop.hidden = false;
    elements.settingsDialog.focus();
    elements.closeSettingsButton.focus();
  }

  function closeSettings() {
    if (elements.settingsBackdrop.hidden) return;
    elements.settingsBackdrop.hidden = true;
    elements.openSettingsButton.focus();
  }

  function openMobileSidebar() {
    elements.sidebar.classList.add("mobile-open");
    elements.mobileScrim.hidden = false;
  }

  function closeMobileSidebar() {
    elements.sidebar.classList.remove("mobile-open");
    elements.mobileScrim.hidden = true;
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => {
      elements.toast.classList.remove("visible");
    }, 3200);
  }

  function createIcon(name) {
    const paths = {
      chat: ["M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4.5A7.5 7.5 0 1 1 20 11.5Z", "M8 10h8M8 14h5"],
      trash: ["M4 7h16M10 11v6M14 11v6M5.5 7l.8 13h11.4l.8-13M9 7V4h6v3"],
      shield: ["M12 3 20 6v6c0 5-3.4 8.8-8 11-4.6-2.2-8-6-8-11V6l8-3Z", "m9 12 2 2 4-4"],
      copy: ["M8 8V4h12v12h-4", "M4 8h12v12H4z"]
    };
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    paths[name].forEach((pathData) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      svg.append(path);
    });
    return svg;
  }
})();
