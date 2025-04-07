import React, { useState, useEffect, useRef } from "react";
import "./style.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const promptLoaded = useRef(false);
  const API_BASE = "https://oogiri-app.onrender.com";

  // お題を1回だけ取得
  useEffect(() => {
    const fetchPrompt = async () => {
      if (promptLoaded.current) return;
      promptLoaded.current = true;

      try {
        const res = await fetch(`${API_BASE}/prompt`);
        const data = await res.json();
        setCurrentPrompt(data.prompt);
        setMessages([{ sender: "bot", text: `【お題】${data.prompt}` }]);
      } catch (err) {
        console.error("お題の取得に失敗しました:", err);
      }
    };
    fetchPrompt();
  }, []);

  // 回答送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input) return;

    const buttonId = Date.now();

    const buttonMessage = {
      id: buttonId,
      sender: "bot",
      type: "buttons",
      text: "",
      disabled: {
        evaluate: false,
        example: false,
      },
    };

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
      buttonMessage,
    ]);

    setUserAnswer(input);
    setInput("");
  };

  // 採点処理
  const handleEvaluate = async (id) => {
    const res = await fetch(`${API_BASE}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: currentPrompt, answer: userAnswer }),
    });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: `📝 採点結果：${data.result}` },
    ]);
    disableButtonsById(id, "evaluate");
  };

  // 模範解答処理
  const handleExample = async (id) => {
    const res = await fetch(`${API_BASE}/example`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: currentPrompt }),
    });
    const data = await res.json();
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: `📚 模範解答：\n${data.example}` },
    ]);
    disableButtonsById(id, "example");
  };

  // ボタンを個別に無効化
  const disableButtonsById = (id, buttonType) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              disabled: {
                ...msg.disabled,
                [buttonType]: true,
              },
            }
          : msg
      )
    );
  };

  // 新しいお題を出す
  const handleNewPrompt = async () => {
    const res = await fetch(`${API_BASE}/prompt`);
    const data = await res.json();
    setCurrentPrompt(data.prompt);
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: `【次のお題】${data.prompt}` },
    ]);
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            {msg.text}
            {msg.type === "buttons" && (
              <div className="button-group">
                <button
                  onClick={() => handleEvaluate(msg.id)}
                  disabled={msg.disabled?.evaluate}
                >
                  AIに採点してもらう
                </button>

                <button
                  onClick={() => handleExample(msg.id)}
                  disabled={msg.disabled?.example}
                >
                  AIの模範解答を見る
                </button>

                <button onClick={handleNewPrompt}>次のお題へ</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="さらに解答する"
        />
        <button type="submit">送信</button>
      </form>
    </div>
  );
}

export default App;
