const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
app.set("view engine", "ejs");
app.use(express.static("views"));
const user = require("./routes/user-router");
const admin = require("./routes/admin-router");
const mongoose = require("mongoose");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require("dotenv").config();

const session = require("express-session");
const passport = require("./middlewares/passport");
const nocache = require("nocache");
app.use(nocache());
app.use(
  session({
    secret: "happy",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", user);
app.use("/admin", admin);

app.all('*', (req, res) => {
  res.render('userPages/404');
});

mongoose
  .connect("mongodb://127.0.0.1:27017/axillon")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
