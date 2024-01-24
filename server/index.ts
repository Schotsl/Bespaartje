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

async function getUser(id: number) {
  const connection = await getConnection();

  const [users] = await connection.query(
    "SELECT id, email, name FROM user WHERE id = ?",
    [id]
  );

  return users[0];
}

async function getUitje(id: number) {
  const connection = await getConnection();

  const [uitje] = await connection.query(
    "SELECT id, title, owner_id FROM uitje WHERE id = ?",
    [id]
  );

  const [users] = await connection.query(
    "SELECT id, uitje_id, user_id, amount, amount_paid FROM uitje_user WHERE uitje_id = ?",
    [uitje[0].id]
  );

  const usersPromises = users.map((user) => getUser(user.user_id));
  const usersLoaded = await Promise.all(usersPromises);
  const usersFull = usersLoaded.map((user, index) => ({
    ...user,
    amount: users[index].amount,
    amount_paid: users[index].amount_paid,
  }));

  return {
    id: uitje[0].id,
    title: uitje[0].title,
    owner_id: uitje[0].owner_id,
    users: usersFull,
  };
}

app.get("/uitje", async (request, response) => {
  const { token } = request.cookies;

  // ENSURE AUTHENTICATION
  const user = 1;

  // Fetch the uitjes from the database
  const connection = await getConnection();
  const [ids] = await connection.query("SELECT id FROM uitje");

  // Fetch the full uitjes from the database
  const uitjesPromises = ids.map((uitje) => getUitje(uitje.id));
  const uitjesFull = await Promise.all(uitjesPromises);

  return response.json(uitjesFull);
});

app.post("/uitje", async (request, response) => {
  // ENSURE AUTHENTICATION
  const user = 1;

  // Fetch title and users from the request
  const { title, users } = request.body;

  const connection = await getConnection();

  const [results] = await connection.query(
    "INSERT INTO uitje (title,owner_id) VALUES (?, ?)",
    [title, user]
  );

  // Insert the uitjes_users into the database where every user is a new row
  const uitje = results.insertId;
  const values = users.map((user) => [uitje, user.user_id, user.amount]);

  await connection.query(
    "INSERT INTO uitje_user (uitje_id, user_id, amount) VALUES ?",
    [values]
  );

  // Return the uitje
  const uitjeMapped = await getUitje(uitje);

  return response.json(uitjeMapped);
});

app.post("/auth/signup", (request, response) => {});

app.listen(3000, () => {
  console.log("Listen on the port 3000...");
});
