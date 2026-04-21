import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Socket DB connected"))
  .catch((err) => console.log(err));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", ({ listingId, buyerId }) => {
    const room = `${listingId}_${buyerId}`;
    socket.join(room);
  });

  socket.on("sendMessage", (data) => {
    const { listingId, buyerId } = data;
    const room = `${listingId}_${buyerId}`;

    io.to(room).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(5000, () => {
  console.log("Socket server running on port 5000");
});
