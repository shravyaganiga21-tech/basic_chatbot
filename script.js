const form = document.querySelector("#message-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");
const welcomeScreen = document.querySelector("#welcome-screen");
const sidebar = document.querySelector("#sidebar");

function addMessage(text, sender) {
  const message = document.createElement("article");
  message.className = `message ${sender}-message`;

  const body = document.createElement("div");
  body.className = "message-body";

  const content = document.createElement("div");
  content.className = "message-content";
  content.textContent = text;

  body.append(content);
  message.append(body);
  messages.append(message);
  message.scrollIntoView({ block: "end", behavior: "smooth" });
}

function getReply(question) {
  return `Thanks for your question: "${question}" This is a simple frontend demo, so it doesn't have an answer system connected yet.`;
}

function sendMessage(text) {
  const question = text.trim();
  if (!question) return;

  welcomeScreen.classList.add("is-hidden");
  messages.classList.add("visible");
  addMessage(question, "user");
  input.value = "";
  input.style.height = "auto";

  const thinkingMessage = document.createElement("article");
  thinkingMessage.className = "message assistant-message";
  thinkingMessage.id = "thinking-message";
  const thinkingText = document.createElement("div");
  thinkingText.className = "message-content";
  thinkingText.textContent = "CyberMentor is thinking...";
  thinkingMessage.append(thinkingText);
  messages.append(thinkingMessage);

  window.setTimeout(() => {
    if (!thinkingMessage.isConnected) return;
    thinkingMessage.remove();
    addMessage(getReply(question), "assistant");
  }, 700);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage(input.value);
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});

function startNewChat() {
  messages.replaceChildren();
  messages.classList.remove("visible");
  welcomeScreen.classList.remove("is-hidden");
  input.value = "";
  input.focus();
}

document.querySelector("#new-chat").addEventListener("click", startNewChat);
document.querySelector("#clear-chat").addEventListener("click", startNewChat);

document.querySelector("#collapse-sidebar").addEventListener("click", () => {
  document.body.classList.add("sidebar-collapsed");
});

document.querySelector("#expand-sidebar").addEventListener("click", () => {
  document.body.classList.remove("sidebar-collapsed");
});

document.querySelector("#open-sidebar").addEventListener("click", () => {
  sidebar.classList.add("mobile-open");
  document.querySelector("#mobile-scrim").hidden = false;
});

document.querySelector("#mobile-scrim").addEventListener("click", () => {
  sidebar.classList.remove("mobile-open");
  document.querySelector("#mobile-scrim").hidden = true;
});

document.querySelectorAll(".topic-link").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.dataset.prompt));
});
