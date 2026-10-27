
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from flask_cors import CORS
from flask import Flask,request,jsonify,send_from_directory
app=Flask(__name__)
CORS(app, resources={
    r"/chat": {"origins": "http://127.0.0.1:5500"}
})
# 1. Training data: (message, intent)
data = [
    # Greetings
    ("hello", "greeting"),
    ("hi", "greeting"),
    ("hey", "greeting"),
    ("good morning", "greeting"),
    ("hello there", "greeting"),
    ("hi there", "greeting"),
    ("hey there", "greeting"),

    # Goodbyes
    ("bye", "goodbye"),
    ("goodbye", "goodbye"),
    ("see you", "goodbye"),
    ("good night", "goodbye"),
    ("talk to you later", "goodbye"),

    # Name questions
    ("what is your name", "name"),
    ("who are you", "name"),
    ("tell me your name", "name"),
    ("what should I call you", "name"),
]

# 2. Separate messages and labels
texts = [text for text, label in data]
labels = [label for text, label in data]

# 3. Convert text into numerical features
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

print("Vocabulary:", vectorizer.get_feature_names_out())
print("Feature matrix:")
print(X.toarray())

# 4. Train the machine learning model
model = MultinomialNB()
model.fit(X, labels)

print("\nModel trained successfully!")

# 5. Map intents to responses
responses = {
    "greeting": "Hello there! Welcome to CyberMentor AI.",
    "goodbye": "Goodbye! Keep learning and stay curious.",
    "name": "My name is CyberMentor AI."
}
# 5. Serve the website
@app.route("/")
def home():
    return send_from_directory(".", "index.html")

@app.route("/style.css")
def styles():
    return send_from_directory(".", "style.css")

@app.route("/script.js")
def javascript():
    return send_from_directory(".", "script.js")

# 6. Receive messages from the website
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"reply": "Please enter a message."}), 400

    # Convert message into numerical features
    user_vector = vectorizer.transform([user_message])

    # Avoid predicting an intent when no known words were found
    if user_vector.nnz == 0:
        return jsonify({
            "reply": "I'm still learning. Please try hello, bye, or ask my name."
        })

    # Predict intent and select response
    intent = model.predict(user_vector)[0]
    reply = responses[intent]

    return jsonify({
        "intent": intent,
        "reply": reply
    })

if __name__ == "__main__":
    app.run(debug=True)