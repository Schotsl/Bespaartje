import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mysql, { RowDataPacket } from "mysql2/promise";
import { Connection } from "mysql2/promise";
import { compare, hash } from "bcrypt";

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  name: string;
}

require("dotenv").config();

let globalConnection: Connection | undefined;

async function getConnection() {
  if (globalConnection) {
    await globalConnection.connect();
    return globalConnection;
  }

  globalConnection = await mysql.createConnection({
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 3366,
  });

  setInterval(function () {
    globalConnection.query("SELECT 1");
  }, 5000);

  return globalConnection;
}

function assertAuthorization(bearer: string): { userId: number } {
  try {
    const token = bearer.split(" ")[1];
    jwt.verify(token, process.env.SECRET!);
    const decodedToken = jwt.decode(token);
    return decodedToken as { userId: number };
  } catch (error) {
    throw new Error("Invalid token");
  }
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

  const connection = await getConnection();
  const [results] = await connection.query<User[]>(
    "SELECT * FROM user WHERE email = ? LIMIT 1",
    [email]
  );

  const user = results[0];

  if (!user) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  if (!(await compare(password, user.password))) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.SECRET!, {
    expiresIn: "7d",
  });

  response.json({
    token,
  });
});

async function getUserByEmail(email: string) {
  const connection = await getConnection();

  const [users] = await connection.query<User[]>(
    "SELECT id, email, name FROM user WHERE email = ?",
    [email]
  );

  return users[0];
}

async function getUser(id: number) {
  const connection = await getConnection();

  const [users] = await connection.query<User[]>(
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
    amount: parseFloat(users[index].amount),
    amount_paid: parseFloat(users[index].amount_paid),
  }));

  return {
    id: uitje[0].id,
    title: uitje[0].title,
    owner_id: uitje[0].owner_id,
    users: usersFull,
  };
}

app.get("/user/:email", async (request, response) => {
  const { email } = request.params;

  const user = await getUserByEmail(email);

  if (!user) {
    return response.status(404).json({ message: "User not found" });
  }

  return response.json(user);
});

app.get("/uitje", async (request, response) => {
  const { userId } = assertAuthorization(
    request.headers.authorization as string
  );
  // ENSURE AUTHENTICATION

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

  const uitje = results.insertId;

  if (users) {
    // Insert the uitjes_users into the database where every user is a new row
    const values = users.map((user) => [uitje, user.user_id, user.amount]);

    await connection.query(
      "INSERT INTO uitje_user (uitje_id, user_id, amount) VALUES ?",
      [values]
    );
  }

  // Return the uitje
  const uitjeMapped = await getUitje(uitje);

  return response.json(uitjeMapped);
});

app.post("/auth/signup", async (request, response) => {
  const { email, password, name } = request.body;

  const hashedPassword = await hash(password, 10);

  const connection = await getConnection();
  await connection.query(
    "INSERT INTO user (email, password, name) VALUES (?, ?, ?)",
    [email, hashedPassword, name]
  );

  response.status(200).send();
});

// Allow cors

app.listen(3000, () => {
  console.log("Listen on the port 3000...");
});
