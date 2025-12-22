require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.get("/", (req, res) => res.send("Backend OK"));
// CORS → autoriser ton front Netlify
app.use(cors({
  origin: process.env.FRONT_URL
}));

// JSON
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connecté"))
.catch(err => console.error(err));

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api", require("./routes/deposit.routes"));
app.use("/api", require("./routes/withdraw.routes"));
app.use("/api", require("./routes/webhook.routes"));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Backend lancé sur ${process.env.PORT || 3000}`);
});
