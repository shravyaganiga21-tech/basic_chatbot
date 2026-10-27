
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB

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

# 6. Chat with the trained model
while True:
    user = input("\nYou: ").strip()

    if user.lower() == "exit":
        print("Bot: See you next time!")
        break

    if not user:
        continue

    user_vector = vectorizer.transform([user])
    intent = model.predict(user_vector)[0]

    print("Predicted intent:", intent)
    print("Bot:", responses[intent])
