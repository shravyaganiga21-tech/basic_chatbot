const form = document.querySelector("#message-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}-message`;
  message.textContent = text;
  messages.append(message);
  message.scrollIntoView({ behavior: "smooth", block: "end" });
}

function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  messages.querySelector(".welcome-message")?.remove();
  addMessage(text, "user");
  input.value = "";
  input.style.height = "auto";

  window.setTimeout(() => {
    addMessage("This is a simple frontend demo. A chatbot response can be added here later.", "assistant");
  }, 500);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage();
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
});

document.querySelector("#new-chat").addEventListener("click", () => {
  messages.replaceChildren();

  const welcome = document.createElement("p");
  welcome.className = "welcome-message";
  welcome.textContent = "Hi! Type a message to get started.";
  messages.append(welcome);

  input.value = "";
  input.style.height = "auto";
  input.focus();
});
