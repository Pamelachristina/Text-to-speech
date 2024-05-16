const express = require("express");
const { Pool } = require("pg");
const { Resemble } = require("@resemble/node");
const Bottleneck = require("bottleneck");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

// Database setup
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
app.use(express.json());
app.use(require("cors")());

// Resemble.ai setup
Resemble.setApiKey(process.env.RESEMBLE_TOKEN);

// Bottleneck rate limiter setup
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 25, // 40 requests per second
});

// Function to handle creation of clips via Resemble.ai
const createClip = async (projectUuid, text, voiceUuid) => {
  return await Resemble.v2.clips.createAsync(projectUuid, {
    body: text,
    voice_uuid: voiceUuid,
    callback_url: "http://localhost:3001/synthesize",
  });
};

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Route to save synthesized text and audio URL to PostgreSQL
app.post("/saveText", authenticateJWT, async (req, res) => {
  const { text, audioUrl } = req.body;
  const userId = req.user.userId; // Get user ID from authenticated user
  try {
    const query =
      "INSERT INTO conversions (user_id, text, audio_url) VALUES ($1, $2, $3)";
    await pool.query(query, [userId, text, audioUrl]);
    res.status(201).send("Text and audio URL saved!");
  } catch (error) {
    console.error("Failed to save text and audio URL:", error);
    res.status(500).send("Failed to save text and audio URL");
  }
});

// Route to clear conversion history for a user
app.delete("/clearHistory", authenticateJWT, async (req, res) => {
  const userId = req.user.userId;
  try {
    await pool.query("DELETE FROM conversions WHERE user_id = $1", [userId]);
    res.status(200).send({ message: "History cleared successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to clear history", error });
  }
});

// Route to save conversion history for a user
app.post("/saveHistory", authenticateJWT, async (req, res) => {
  const userId = req.user.userId;
  const { history } = req.body;
  try {
    const insertPromises = history.map((item) =>
      pool.query(
        "INSERT INTO conversions (user_id, text, audio_url) VALUES ($1, $2, $3)",
        [userId, item.text, item.audio_url]
      )
    );
    await Promise.all(insertPromises);
    res.status(200).send({ message: "History saved successfully" });
  } catch (error) {
    res.status(500).send({ message: "Failed to save history", error });
  }
});

// User registration
app.post("/register", async (req, res) => {
  console.log("Received registration request", req.body);
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const query = "INSERT INTO users (username, password) VALUES ($1, $2)";
    await pool.query(query, [username, hashedPassword]);
    res.status(201).send("User registered successfully!");
  } catch (error) {
    console.error("Failed to register user:", error);
    res.status(500).send("Failed to register user");
  }
});

// User login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE username = $1";
    const result = await pool.query(query, [username]);
    const user = result.rows[0];

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user.id }, jwtSecret, {
        expiresIn: "1h",
      });
      res.json({ token });
    } else {
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    console.error("Failed to login user:", error);
    res.status(500).send("Failed to login user");
  }
});

// Route to get user information
app.get("/user", authenticateJWT, async (req, res) => {
  try {
    const query = "SELECT username FROM users WHERE id = $1";
    const result = await pool.query(query, [req.user.userId]);
    const user = result.rows[0];
    res.json(user);
  } catch (error) {
    console.error("Failed to retrieve user information:", error);
    res.status(500).send("Failed to retrieve user information");
  }
});

// Example protected route
app.get("/protected", authenticateJWT, (req, res) => {
  res.send("This is a protected route");
});

// Route to retrieve all text conversions
app.get("/getTexts", authenticateJWT, async (req, res) => {
  try {
    const query =
      "SELECT * FROM conversions WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await pool.query(query, [req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve texts:", error);
    res.status(500).send("Failed to retrieve texts");
  }
});

// Route to handle synthesis requests and store results
app.post("/synthesize", authenticateJWT, async (req, res) => {
  const { text } = req.body;
  const projectUuid = "8ef4ae02";
  const voiceUuid = "0fb16196";

  try {
    const response = await limiter.schedule(() =>
      createClip(projectUuid, text, voiceUuid)
    );

    if (
      response &&
      response.success &&
      response.item &&
      response.item.audio_src
    ) {
      // Save to PostgreSQL
      const saveTextQuery =
        "INSERT INTO conversions (user_id, text, audio_url) VALUES ($1, $2, $3)";
      await pool.query(saveTextQuery, [
        req.user.userId,
        text,
        response.item.audio_src,
      ]);

      res.json({ audioUrl: response.item.audio_src });
    } else {
      console.error("Unexpected response structure or API error:", response);
      res
        .status(500)
        .send("Failed to retrieve audio URL from the API response");
    }
  } catch (error) {
    console.error("Error synthesizing voice:", error);
    res.status(500).send("Failed to synthesize speech");
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
