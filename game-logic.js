let rooms = [];
let clientIO;

const initializeGame = (io, socket) => {
  console.log("a user connect", socket.id);

  clientIO = io;
  // User creates new game room after clicking 'submit' on the frontend
  socket.on("createNewGame", createNewGame);

  // User joins gameRoom after going to a URL with '/game/:gameId'
  socket.on("join-game", playerJoinsGame);

  socket.on("send-message", playerSendMessage);

  // Run code when the client disconnects from their socket session.
  socket.on("disconnect", onDisconnect);
};

function createNewGame(gameId) {
  const data = {
    id: gameId,
    players: [],
    host: null,
    gameStarted: false,
  };

  // Join the Room and wait for the other player
  this.join(gameId);
  this.emit("createdNewGame");
  rooms.push(data);

  const room = rooms.find((room) => room.id === gameId);

  if (room) {
    room.host = this.id;
  }

  console.log(`User ${this.id} created a server.`);
}

function playerJoinsGame(data) {
  const { gameId, playerName } = data;

  const room = rooms.find((room) => room.id == gameId);

  // If the room not exists...
  if (room === undefined) {
    this.emit("room-not-found", "This game session does not exist.");
    return;
  }

  this.join(gameId);
  room.players.push({ id: this.id, name: playerName, lives: 2 });

  clientIO.to(gameId).emit("player-joined", {
    players: room.players.map((player) => player.name),
  });

  clientIO.to(gameId).emit("recieve-message", {
    message: `${playerName} joined the game.`,
    name: "BOT",
    id: `${this.id}${Math.random()}`,
    gameId,
  });

  console.log(room);
  console.log(playerName, "has joined room " + gameId);
}

function playerSendMessage(data) {
  console.log(data);
  this.to(data.gameId).emit("recieve-message", data);
}

function onDisconnect() {
  // Find the room that the disconnected player belonged to
  const roomIndex = rooms.findIndex((room) => {
    const playerIndex = room.players.findIndex(
      (player) => player.id === this.id
    );
    return playerIndex !== -1;
  });

  // If the room exists...
  if (roomIndex !== -1) {
    const room = rooms[roomIndex];

    // Remove the disconnected player from the player list
    const playerIndex = room.players.findIndex(
      (player) => player.id === this.id
    );
    const player = room.players[playerIndex];

    room.players.splice(playerIndex, 1);

    // If the disconnected player was the host, assign a new hos
    if (room.host === this.id) {
      if (room.players.length > 0) {
        room.host = room.players[0].id;
      } else {
        rooms.splice(roomIndex, 1);
      }
    }

    // Emit the updated player list to the remaining players in the room
    this.to(room.id).emit("player-joined", {
      players: room.players.map((player) => player.name),
    });

    clientIO.to(room.id).emit("recieve-message", {
      message: `${player.name} left the game.`,
      name: "BOT",
      id: `${this.id}${Math.random()}`,
      gameId: room.id,
    });
  }

  console.log(rooms);
  console.log("a user disconnected", this.id);
}

export default initializeGame;
