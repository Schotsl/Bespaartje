import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { Connection } from "mysql2/promise";

require("dotenv").config();

let globalConnection: Connection | undefined;
async function getConnection() {
  if (globalConnection) return globalConnection;

  globalConnection = await mysql.createConnection({
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    port: 3366,
  });

  return globalConnection;
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get("/", async (request, response) => {
  const connection = await getConnection();
  const [results] = await connection.query("SELECT * FROM user");

  return response.json(results);
});

app.post("/auth/login", async (request, response) => {
  const connection = await getConnection();
  const [results] = await connection.query("SELECT * FROM user");

  return response.json(results);

  const { email, password } = request.body;

  if (typeof email !== "string" || typeof password !== "string") {
    response.status(400).json({ message: "Invalid request body" });
    return;
  }

  // Query database

  const token = jwt.sign({ userId: 1 }, process.env.SECRET!, {
    expiresIn: "7d",
  });

  response.cookie("token", token, {
    httpOnly: true,
    sameSite: true,
    secure: true,
  });
});

app.post("/auth/signup", (request, response) => {});

app.listen(3000, () => {
  console.log("Listen on the port 3000...");
});
