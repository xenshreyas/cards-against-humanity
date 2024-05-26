import React from "react";
import { useRouter } from "next/navigation";

const Homepage = () => {
  const router = useRouter();

  const createRoom = () => {
    // Logic to create a room and navigate to the room page
    const roomId = Math.random().toString(36).substring(2, 15); // Generate a random room ID
    router.push(`/rooms/${roomId}`);
  };

  return (
    <div>
      <h1>Welcome to Cards Against Humanity</h1>
      <button onClick={createRoom}>Create Room</button>
    </div>
  );
};

export default Homepage;
