import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Homepage = () => {
  const router = useRouter();

  const [room, setRoom] = useState("");

  const createRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 15);
    router.push(`/rooms/${roomId}`);
  };

  const joinRoom = () => {
    if (room.trim()) {
      router.push(`/rooms/${room}`);
    }
  };

  return (
    <div>
      <h1>Welcome to Cards Against Humanity</h1>
      <div>
        <button onClick={createRoom}>Create Room</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Room ID"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
};

export default Homepage;
