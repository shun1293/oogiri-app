from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
from openai import OpenAI
import httpx
import json
import os

app = Flask(__name__)
CORS(app)

# OpenAI APIキーの設定（環境変数から取得）

client = OpenAI(api_key="OPENAI_API_KEY", http_client=httpx.Client(transport=transport))

@app.route('/')
def index():
    return render_template('index.html')


@app.route("/prompt", methods=["GET"])
def prompt():
    try:
        print(">>> ENV API KEY:", os.getenv("OPENAI_API_KEY")) 
        gpt_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "user",
                    "content": "シュールで答えやすい大喜利のお題を1つ出力してください。ただし宇宙に関する言葉は使わないでください。日本人が知っている固有名詞や時事ネタに関するお題を5分の1程度の確率で出してください。お題は必ず疑問形にしてください。会話文や説明は一切書かず、お題の文章だけを出力してください。"
                }
            ]
        )
        prompt_text = gpt_response.choices[0].message.content
        return Response(
            json.dumps({"prompt": prompt_text}, ensure_ascii=False, indent=2),
            content_type="application/json; charset=utf-8"
        )
    except Exception as e:
        print(">>> ERROR:", str(e))  # ← これがCloud Runログに出ます！
        return jsonify({"error": str(e)}), 500


@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json['message']
        gpt_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_message}]
        )
        reply = gpt_response.choices[0].message.content
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/evaluate", methods=["POST"])
def evaluate():
    try:
        data = request.get_json()
        prompt = data["prompt"]
        answer = data["answer"]

        message = f"""お題＝{prompt}と回答{answer}に対して、ユーモアとしての面白さを日本語で100点満点で採点し、さまざまな観点から評価してください。1点刻みで細かく採点してください。60点～100点までまんべんなく使ってください。つまらないときはお世辞を言わないでください。面白かった時のみ褒めてください。採点の結果は次の形式で出力してください：\n
点数: ○点（100点満点）\n
講評: ○○○○○\n
"""

        gpt_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}]
        )

        result = gpt_response.choices[0].message.content
        return jsonify({"result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/example", methods=["POST"])
def example():
    try:
        data = request.get_json()
        prompt = data["prompt"]

        message = f"次の大喜利のお題に対して、シュールで非日常的な模範解答を3つ,箇条書きで出してください。模範解答ひとつごとに改行してください。ただし宇宙に関する言葉は使わないでください。答えは一文に収め、疑問形は使わないでください。模範解答以外の余計な説明などは言わないでください。\n\nお題: {prompt}"

        gpt_response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": message}]
        )

        example = gpt_response.choices[0].message.content
        return jsonify({"example": example})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
    print(">>> Flask 起動準備OK")  # ← これがログに出れば、起動中までは成功