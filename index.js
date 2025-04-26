require('dotenv').config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const ScrapData = require('./scrapData');
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

// POST route

app.post("/api/scrap/data",ScrapData)
// Correct usage
app.get("/test", (req, res) => {
    res.send("This route works fine");
  });


app.listen(process.env.PORT, () => {
    console.log("Server running on port " + process.env.PORT);
});
