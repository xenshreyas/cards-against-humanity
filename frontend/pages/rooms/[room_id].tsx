"use client";

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const Room = () => {
  const router = useRouter();
  const { room_id } = router.query;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (room_id) {
      const ws = new WebSocket(`ws://localhost:5001/ws/${room_id}`);
      socketRef.current = ws;

      ws.onmessage = (event) => {
        setMessages((prev) => [...prev, event.data]);
      };

      return () => {
        ws.close();
      };
    }
  }, [room_id]);

  const sendMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
      setMessage("");
    }
  };

  return (
    <div className="App">
      <h1>Chat Application</h1>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className="message">
            {msg}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Room;
