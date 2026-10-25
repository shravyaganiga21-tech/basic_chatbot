const form = document.querySelector("#message-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");

function addMessage(text, sender) {
    const message = document.createElement("div");

    message.className = `message ${sender}-message`;
    message.textContent = text;

    messages.append(message);

    message.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });
}

async function sendMessage() {

    const text = input.value.trim();

    if (!text) return;

    // Remove welcome message
    messages.querySelector(".welcome-message")?.remove();

    // Show user's message
    addMessage(text, "user");

    // Clear input
    input.value = "";
    input.style.height = "auto";

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/chat",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text
                })
            }
        );

        const data = await response.json();

        // Show bot response
        addMessage(data.reply, "assistant");

    } catch (error) {

        console.error(error);

        addMessage(
            "Backend connection failed",
            "assistant"
        );
    }
}

// Form submit
form.addEventListener("submit", (event) => {

    event.preventDefault();

    sendMessage();
});

// Enter key
input.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();
    }
});

// Auto-growing textarea
input.addEventListener("input", () => {

    input.style.height = "auto";

    input.style.height =
        `${Math.min(input.scrollHeight, 120)}px`;
});

// New chat button
document
    .querySelector("#new-chat")
    .addEventListener("click", () => {

        messages.replaceChildren();

        const welcome =
            document.createElement("p");

        welcome.className =
            "welcome-message";

        welcome.textContent =
            "Hi! Type a message to get started.";

        messages.append(welcome);

        input.value = "";

        input.style.height = "auto";

        input.focus();
    });