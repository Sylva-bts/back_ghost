require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.get("/", (req, res) => res.send("Backend OK"));
// CORS → autoriser ton front Netlify
app.use(cors({
  origin: process.env.FRONT_URL
}));

// JSON
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/deposit.routes"));
app.use("/api", require("./routes/withdraw.routes"));
app.use("/api", require("./routes/webhook.routes"));

module.exports = app;

// When executed directly, connect to DB and start listening
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connecté"))
    .catch(err => console.error(err));

  app.listen(process.env.PORT || 3000, () => {
    console.log(`Backend lancé sur ${process.env.PORT || 3000}`);
  });
} 
