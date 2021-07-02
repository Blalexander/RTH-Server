const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Estimate } = require("./models");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

const dbName = "Admin";
const dbPass = "Admin";
mongoose.connect(
  `mongodb+srv://${dbName}:${dbPass}@cluster0.qbhpb.mongodb.net/rth_development?retryWrites=true&w=majority`,
  function (err) {
    if (err) {
      console.log("Not connected to the database: " + err);
    } else {
      console.log("Successfully connected to MongoDB");
    }
  }
);

const es = Estimate()

router.get("/estimates", async (req, res) => {
  const estimates = await Estimate.find({});
  console.log(estimates);
  res.json(estimates);
  // estimates.catch(res.send("error!"))
});

router.post("/estimates", async (req, res) => {
  let insertionObj = { greeting: req.body };
  es.collection.insertOne(insertionObj, onInsert);
  function onInsert(err, docs) {
    if (err) {
      console.log("Error!", err);
    } else {
      console.info("Estimate was successfully stored.", docs.length);
      res.json("thank you for shopping with us today");
    }
  }
});

module.exports = router;
