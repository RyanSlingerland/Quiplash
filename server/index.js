const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");


app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("User connects:", socket.id);

  socket.on("join_game", (game) => {
    socket.join(game);
    console.log("User with ID:", socket.id, "joined the room", game);

    if (!rooms[game]) {
      rooms[game] = {
        prompts: [],
        users: [],
      };
    }

    const user = { id: socket.id, username: "" };
    rooms[game].users.push(user);

    io.to(game).emit("user_joined", { users: rooms[game].users });
  });

  socket.on("log_user", ({ username, game }) => {
    console.log("User with ID:", socket.id, "joined the room as", username);
    socket.join(game);

    const user = rooms[game].users.find((u) => u.id === socket.id);
    if (user) {
      user.username = username;
      io.to(game).emit("user_joined", { users: rooms[game].users });
    }
  });

  socket.on("start_game", (game) => {
    io.to(game).emit("start_game");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);

    for (const room in rooms) {
      const index = rooms[room].users.findIndex((user) => user.id === socket.id);
      if (index !== -1) {
        rooms[room].users.splice(index, 1);
        io.to(room).emit("user_left", { users: rooms[room].users });
        break;
      }
    }
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
