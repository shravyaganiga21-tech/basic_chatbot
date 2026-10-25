from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

con = {
    "hello": "Hi, there",
    "how are you": "Fine, how are you?",
    "thank you": "Welcome",
    "whats your name": "Phirki"
}

@app.route("/chat", methods=["POST"])
def chat():

    data = request.json

    user_message = data["message"].lower()

    reply = con.get(
        user_message,
        "I don't know."
    )

    return jsonify({
        "reply": reply
    })

if __name__ == "__main__":
    app.run(debug=True)