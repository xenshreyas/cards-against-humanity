from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import random
import json
from typing import Dict, List, Optional

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample cards for demonstration. A real implementation would use a much larger deck.
BLACK_CARDS = [
    "Why can't I sleep at night?",
    "I got 99 problems but ____ ain't one.",
    "What's that smell?",
]

WHITE_CARDS = [
    "A bag of magic beans.",
    "A subscription to Men's Fitness.",
    "An endless stream of diarrhea.",
    "Eating the last known bison.",
    "My ex-wife.",
    "A pyramid of severed heads.",
    "The miracle of childbirth.",
    "Fifty milligrams of Zoloft daily.",
    "A falcon with a cap on its head.",
    "The Kool-Aid Man.",
]

class Player:
    def __init__(self, websocket: WebSocket, name: str):
        self.websocket = websocket
        self.name = name
        self.hand: List[str] = []
        self.score = 0

class Game:
    def __init__(self):
        self.players: List[Player] = []
        self.judge_index = 0
        self.black_deck: List[str] = []
        self.white_deck: List[str] = []
        self.current_black: Optional[str] = None
        self.submissions: Dict[str, str] = {}
        self.started = False

    def add_player(self, player: Player):
        self.players.append(player)

    def remove_player(self, player: Player):
        self.players = [p for p in self.players if p != player]
        if self.judge_index >= len(self.players):
            self.judge_index = 0

    def start(self):
        self.black_deck = random.sample(BLACK_CARDS, len(BLACK_CARDS))
        self.white_deck = random.sample(WHITE_CARDS, len(WHITE_CARDS))
        self.started = True
        self.deal_hands()
        self.next_round()

    def deal_hands(self):
        for player in self.players:
            while len(player.hand) < 7 and self.white_deck:
                player.hand.append(self.white_deck.pop())

    def next_round(self):
        self.submissions.clear()
        if not self.black_deck:
            self.started = False
            self.current_black = None
            return
        self.current_black = self.black_deck.pop()
        self.judge_index = self.judge_index % len(self.players)
        self.deal_hands()

    def judge(self) -> Optional[Player]:
        if not self.players:
            return None
        return self.players[self.judge_index % len(self.players)]

    def rotate_judge(self):
        self.judge_index = (self.judge_index + 1) % len(self.players)

class ConnectionManager:
    def __init__(self):
        self.games: Dict[str, Game] = {}
        self.player_map: Dict[WebSocket, Player] = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        self.games.setdefault(room, Game())

    def disconnect(self, room: str, websocket: WebSocket):
        game = self.games.get(room)
        player = self.player_map.get(websocket)
        if game and player:
            game.remove_player(player)
            del self.player_map[websocket]
            if not game.players:
                del self.games[room]

    def add_player(self, room: str, websocket: WebSocket, name: str) -> Player:
        game = self.games[room]
        player = Player(websocket, name)
        game.add_player(player)
        self.player_map[websocket] = player
        return player

    async def send_state(self, room: str):
        game = self.games.get(room)
        if not game:
            return
        for player in game.players:
            state = {
                "type": "state",
                "players": [
                    {"name": p.name, "score": p.score} for p in game.players
                ],
                "judge": game.judge().name if game.started else None,
                "black_card": game.current_black,
                "hand": player.hand,
                "started": game.started,
            }
            if player == game.judge() and game.submissions:
                state["submissions"] = game.submissions
            await player.websocket.send_text(json.dumps(state))

    async def handle_message(self, room: str, websocket: WebSocket, data: dict):
        game = self.games[room]
        player = self.player_map[websocket]
        action = data.get("action")
        if action == "start_game":
            if not game.started:
                game.start()
                await self.send_state(room)
        elif action == "play_card" and game.started:
            idx = data.get("index")
            if idx is None or idx >= len(player.hand):
                return
            card = player.hand.pop(idx)
            game.submissions[player.name] = card
            await self.send_state(room)
            if len(game.submissions) >= len(game.players) - 1:
                # all non-judge submitted
                await self.send_state(room)
        elif action == "choose_winner" and player == game.judge():
            winner_name = data.get("player")
            winner = next((p for p in game.players if p.name == winner_name), None)
            if winner:
                winner.score += 1
            game.rotate_judge()
            game.next_round()
            await self.send_state(room)

manager = ConnectionManager()

@app.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(room, websocket)
    try:
        join_data = await websocket.receive_text()
        data = json.loads(join_data)
        if data.get("action") != "join":
            await websocket.close()
            return
        name = data.get("name", "Anonymous")
        player = manager.add_player(room, websocket, name)
        await manager.send_state(room)
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            await manager.handle_message(room, websocket, data)
    except WebSocketDisconnect:
        manager.disconnect(room, websocket)
        await manager.send_state(room)

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
