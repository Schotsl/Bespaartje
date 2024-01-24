import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mysql, { RowDataPacket } from "mysql2/promise";
import { Connection } from "mysql2/promise";
import { hash } from "bcrypt";

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  name: string;
}

require("dotenv").config();

let globalConnection: Connection | undefined;
async function getConnection() {
  if (globalConnection) return globalConnection;

  globalConnection = await mysql.createConnection({
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
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
  return response.json({
    message: "Hello world",
  });
});

app.post("/auth/login", async (request, response) => {
  const { email, password } = request.body;

  const hashedPassword = await hash(password, 10);

  const connection = await getConnection();
  const [results] = await connection.query<User[]>(
    "SELECT * FROM user WHERE email = ? AND password = ? LIMIT 1",
    [email, hashedPassword],
  );

  const user = results[0];

  if (!user) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.SECRET!, {
    expiresIn: "7d",
  });

  response.json({
    token,
  });
});

app.post("/auth/signup", async (request, response) => {
  const { email, password, name } = request.body;

  const hashedPassword = await hash(password, 10);

  const connection = await getConnection();
  const [results] = await connection.query(
    "INSERT INTO user (email, password, name) VALUES (?, ?, ?)",
    [email, hashedPassword, name],
  );
});

app.listen(3000, () => {
  console.log("Listen on the port 3000...");
});
