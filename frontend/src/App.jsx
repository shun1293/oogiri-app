import React, { useState, useEffect, useRef } from "react";
import "./style.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [loadingCommon, setLoadingCommon] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const promptLoaded = useRef(false);
  const API_BASE = import.meta.env.VITE_API_BASE;
  const bottomRef = useRef(null);

  // お題を1回だけ取得
  useEffect(() => {
    const fetchPrompt = async () => {
      if (promptLoaded.current) return;//1回しか実行しないようにする
      promptLoaded.current = true;
      setLoading(true); //loadingをオンに
      
      try {
        const res = await fetch(`${API_BASE}/prompt`); //awaitの中は処理が終わるまで時間が止まり、他は処理が動き続ける。.envファイルの中のflaskURL/promptのjsonお題を取る
        const data = await res.json();//resの中身のjsonを読んでjsで読めるようにする
        setCurrentPrompt(data.prompt); //currentPromptの中にdata.promptを入れる
        setMessages([{ sender: "bot", text: `【お題】${data.prompt}` }]); //messagesの中にこれらのパラメータが状態配列（useState）として入る
      } catch (err) {
        console.error("お題の取得に失敗しました:", err);//エラーを取得したときの処理
      } finally {
        setLoading(false); //loadingをオフに
      }
    };
    fetchPrompt();// fetchPromptを実行する
  }, []); //[]が空だと最初のページ読み込み（マウント）時だけ実行

  useEffect(() => {
      //スマホでキーボードが出たとき用に画面vhのリサイズ
      const resizeHandler = () => {
        const viewportHeight = window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
      };
      window.addEventListener('resize', resizeHandler);
      resizeHandler();

      return () => window.removeEventListener('resize', resizeHandler);
    },[]);
      

  // 回答送信
  const handleSubmit = async (e) => {
    e.preventDefault(); //デフォルトの動作（ページリロード）を止める＝送信メッセージを残す
    if (!input) return;

    const buttonId = Date.now();

    const buttonMessage = { //buttonMessageというオブジェクトとその中身のパラメータ（キー）
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
      ...prev, //すでに入っている配列たちに
      { sender: "user", text: input }, //新しいこのトグルを追加→メッセージ履歴が残りながら積み重なる
      buttonMessage,
    ]);

    setUserAnswer(input); //userAnswerの中身をinputにする
    setInput(""); //inputの中を空っぽにする
  };

  // 採点処理
  const handleEvaluate = async (id) => {
    setLoadingCommon(true); //loadingをオンに
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
    setLoadingCommon(false); //loadingをオンに
  };

  // 模範解答処理
  const handleExample = async (id) => {
    setLoadingCommon(true); //loadingをオンに
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
    setLoadingCommon(false); //loadingをオフに
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
    setLoading(true); //loadingをオンに
    const res = await fetch(`${API_BASE}/prompt`);
    const data = await res.json();
    setCurrentPrompt(data.prompt);
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: `【次のお題】${data.prompt}` },
    ]);
    setLoading(false); //loadingをオフに
  };

  //メッセージが出るたびに最下部に自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [loading,messages]);

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
                  AIの<br />採点結果
                </button>

                <button
                  onClick={() => handleExample(msg.id)}
                  disabled={msg.disabled?.example}
                >
                  AIの<br />模範解答
                </button>

                <button onClick={handleNewPrompt}>次のお題</button>
              </div>
            )}
          </div>
        ))}
          {loading ? (
            <div className="loading-area">
              <span>お</span>
              <span>題</span>
              <span>を</span>
              <span>生</span>
              <span>成</span>
              <span>中</span>
              <span>…</span>
              <span>…</span>
            </div>
                ) : (
                   null
          )}
        <div ref={bottomRef} />
        {loadingCommon ? (
            <div className="loading-area">
              <span>生</span>
              <span>成</span>
              <span>中</span>
              <span>…</span>
              <span>…</span>
            </div>
                ) : (
                   null
          )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-bar">
        <input
          value={input} //この<input>に入力された値はinputに入る
          onChange={(e) => setInput(e.target.value)}//入力フォームの内容が変わったら、inputの中をこの<input>のvalueに更新する（setInput）する
          placeholder="解答を入力してください"
        />
        <button type="submit">送信</button>
      </form>
    </div>
  );
}

export default App;
