"use client";

import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

interface Player {
  name: string;
  score: number;
}

interface GameState {
  type: string;
  players: Player[];
  judge: string | null;
  black_card: string | null;
  hand: string[];
  started: boolean;
  submissions?: Record<string, string>;
}

const Room = () => {
  const router = useRouter();
  const { room_id } = router.query;

  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [state, setState] = useState<GameState | null>(null);
  const [played, setPlayed] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const send = (data: any) => {
    socketRef.current?.send(JSON.stringify(data));
  };

  useEffect(() => {
    if (room_id && !socketRef.current) {
      const ws = new WebSocket(`ws://localhost:5001/ws/${room_id}`);
      socketRef.current = ws;
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data) as GameState;
        if (data.type === "state") {
          setState(data);
          setPlayed(false);
        }
      };
      ws.onclose = () => {
        socketRef.current = null;
      };
    }
  }, [room_id]);

  const join = () => {
    send({ action: "join", name });
    setJoined(true);
  };

  const startGame = () => send({ action: "start_game" });

  const playCard = (idx: number) => {
    send({ action: "play_card", index: idx });
    setPlayed(true);
  };

  const chooseWinner = (player: string) => {
    send({ action: "choose_winner", player });
  };

  return (
    <div>
      {!joined ? (
        <div>
          <h2>Join Room {room_id}</h2>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={join}>Join</button>
        </div>
      ) : (
        <div>
          <h2>Players</h2>
          <ul>
            {state?.players.map((p) => (
              <li key={p.name}>
                {p.name} - {p.score}
              </li>
            ))}
          </ul>
          {state?.judge && <p>Judge: {state.judge}</p>}
          {state?.black_card && <h3>{state.black_card}</h3>}
          {state && state.hand && (
            <div>
              <h4>Your hand</h4>
              {state.hand.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => playCard(idx)}
                  disabled={played || state.judge === name}
                >
                  {card}
                </button>
              ))}
            </div>
          )}
          {state?.submissions && state.judge === name && (
            <div>
              <h4>Pick the winner</h4>
              {Object.entries(state.submissions).map(([player, card]) => (
                <button key={player} onClick={() => chooseWinner(player)}>
                  {card}
                </button>
              ))}
            </div>
          )}
          {!state?.started && (
            <button onClick={startGame}>Start Game</button>
          )}
        </div>
      )}
    </div>
  );
};

export default Room;
