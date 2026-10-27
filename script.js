
const form = document.querySelector("#message-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#messages");

// Display a message in the chat
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

// Send a message to the Python ML chatbot
async function sendMessage() {
    const text = input.value.trim();

    if (!text) return;

    // Remove the welcome message
    messages.querySelector(".welcome-message")?.remove();

    // Display the user's message
    addMessage(text, "user");

    // Clear the input
    input.value = "";
    input.style.height = "auto";

    // Prevent duplicate submissions while waiting
    const sendButton = form.querySelector(
        'button[type="submit"]'
    );

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {
        // Send the message to Flask
        const response = await fetch("http://127.0.0.1:5000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: text
            })
        });

        // Convert the server response to JavaScript data
        const data = await response.json();

        // Handle errors returned by Flask
        if (!response.ok) {
            throw new Error(
                data.reply || `Server error: ${response.status}`
            );
        }

        // Display the chatbot's reply
        addMessage(
            data.reply || "I couldn't generate a response.",
            "assistant"
        );

    } catch (error) {
        console.error("Chat error:", error);

        addMessage(
            "Sorry, I couldn't connect to CyberMentor AI. Please check that the Flask server is running.",
            "assistant"
        );

    } finally {
        // Re-enable the send button
        if (sendButton) {
            sendButton.disabled = false;
        }

        input.focus();
    }
}

// Handle form submission
form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
});

// Send message when Enter is pressed
// Shift + Enter creates a new line
input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

// Automatically grow the textarea
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

        const welcome = document.createElement("p");

        welcome.className = "welcome-message";
        welcome.textContent =
            "Hi! Type a message to get started.";

        messages.append(welcome);

        input.value = "";
        input.style.height = "auto";
        input.focus();
    });
