import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Connection } from "mysql2/promise";
import { compare, hash } from "bcrypt";

interface User extends RowDataPacket {
  id: number;
  email: string;
  password: string;
  name: string;
}

interface UitjeUser extends RowDataPacket {
  id: number;
  uitje_id: number;
  user_id: number;
  amount: string;
  amount_paid: string;
}

interface Uitje extends RowDataPacket {
  id: number;
  title: string;
  owner_id: number;
  users: User[];
}

require("dotenv").config();

let globalConnection: Connection | undefined;

async function getConnection() {
  if (globalConnection) {
    return globalConnection;
  }

  globalConnection = await mysql.createConnection({
    database: process.env.DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 3366,
  });

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
    [email],
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

async function getUser(id: number) {
  const connection = await getConnection();

  const [users] = await connection.query<User[]>(
    "SELECT id, email, name FROM user WHERE id = ?",
    [id],
  );

  return users[0];
}

async function getUitje(id: number) {
  const connection = await getConnection();

  const [uitje] = await connection.query<Uitje[]>(
    "SELECT id, title, owner_id FROM uitje WHERE id = ?",
    [id],
  );

  const [users] = await connection.query<UitjeUser[]>(
    "SELECT id, uitje_id, user_id, amount, amount_paid FROM uitje_user WHERE uitje_id = ?",
    [uitje[0].id],
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

app.get("/uitje", async (request, response) => {
  const { userId } = assertAuthorization(
    request.headers.authorization as string,
  );
  // ENSURE AUTHENTICATION

  // Fetch the uitjes from the database
  const connection = await getConnection();
  const [ids] = await connection.query<Pick<Uitje, "constructor" | "id">[]>(
    "SELECT id FROM uitje",
  );

  // Fetch the full uitjes from the database
  const uitjesPromises = ids.map((uitje) => getUitje(uitje.id));
  const uitjesFull = await Promise.all(uitjesPromises);

  return response.json(uitjesFull);
});

app.post("/uitje", async (request, response) => {
  // ENSURE AUTHENTICATION
  const user = 1;

  // Fetch title and users from the request
  const { title, users } = request.body as {
    title: string;
    users: Array<{ user_id: number; amount: number }>;
  };

  const connection = await getConnection();

  const [results] = await connection.query<ResultSetHeader>(
    "INSERT INTO uitje (title,owner_id) VALUES (?, ?)",
    [title, user],
  );

  // Insert the uitjes_users into the database where every user is a new row
  const uitje = results.insertId;
  const values = users.map((user) => [uitje, user.user_id, user.amount]);

  await connection.query(
    "INSERT INTO uitje_user (uitje_id, user_id, amount) VALUES ?",
    [values],
  );

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
    [email, hashedPassword, name],
  );

  response.status(200).send();
});

app.get("/auth/verify", async (request, response) => {
  try {
    assertAuthorization(request.headers.authorization as string);
    return response.status(200).send();
  } catch (error) {
    return response.status(401).send();
  }
});

// Allow cors

app.listen(3000, () => {
  console.log("Listen on the port 3000...");
});
