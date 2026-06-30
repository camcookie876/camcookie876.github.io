# ipdetect.py
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

COUNTRIES = {
    "us": ["en", "es"],
    "ca": ["en", "fr"]
}

def guess_locale(ip):
    try:
        data = requests.get(f"https://ipapi.co/{ip}/json/").json()
        country = data.get("country_code", "").lower()
        languages = data.get("languages", "en").split(",")
        lang = languages[0].split("-")[0]

        if country in COUNTRIES:
            if lang in COUNTRIES[country]:
                return country, lang
            return country, COUNTRIES[country][0]
    except:
        pass

    return "us", "en"

@app.route("/detect")
def detect():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    country, lang = guess_locale(ip)
    return jsonify({"country": country, "lang": lang})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)