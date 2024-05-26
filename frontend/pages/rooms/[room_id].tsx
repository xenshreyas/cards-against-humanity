"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5001");

const Room = () => {
  const router = useRouter();
  const { room_id } = router.query;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if (room_id) {
      socket.emit("join_room", { room: room_id });

      const handleMessage = (data: any) => {
        console.log("Message received:", data);
        setMessages((prevMessages) => [...prevMessages, data]);
      };

      socket.on("receive_message", handleMessage);

      // Cleanup the event listener on component unmount
      return () => {
        socket.off("receive_message", handleMessage);
        socket.emit("leave_room", { room: room_id });
      };
    }
  }, [room_id]);

  const sendMessage = () => {
    const request = { message: message, room: room_id };
    socket.emit("send_message", request);
    setMessage("");
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
