const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Estimate, Template, Users, Schedules } = require("./models");
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
const tl = Template()
const us = Users()
const sch = Schedules()
let date = new Date()
let currentTime = `${date.getUTCMonth()}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}:${date.getSeconds()}`

router.get("/estimates", async (req, res) => {
  const estimates = await Estimate.find({});
  // console.log(estimates);
  res.json(estimates);
  // estimates.catch(res.send("error!"))
});

router.get("/userdata", async (req, res) => {
  console.log("req query: ", req.query)
  const userData = await Estimate.aggregate([
    {
      $match: {
        'estimate.Created By': req.query.username
      }
    }
  ])
  // console.log(userData);


  res.json(userData);
});

router.post("/estimates", async (req, res) => {
  console.log("REQUEST: ", req)
  let insertionObj = { estimate: req.body, timestamp: currentTime };
  es.collection.insertOne(insertionObj, onInsert);
  function onInsert(err, docs) {
    if (err) {
      console.log("Error!", err);
    } else {
      console.info("Estimate was successfully stored.", docs.length);
      res.json("estimate stored");
    }
  }
});

router.post("/templates", async (req, res) => {
  let insertionObj = { template: req.body };
  tl.collection.insertOne(insertionObj, onInsert);
  function onInsert(err, docs) {
    if (err) {
      console.log("Error!", err);
    } else {
      console.info("Template was successfully stored.", docs.length);
      res.json("template stored");
    }
  }
})

router.get("/templates", async (req, res) => {
  const templates = await Template.find({});
  console.log(templates);
  res.json(templates);
  // estimates.catch(res.send("error!"))
});

router.get("/users", async (req, res) => {
  let monthNum = new Date().getUTCMonth()

  const userTypes = await Users.aggregate([
    {
      $group: {
          _id: "$type",
          name: {$push: "$username"}
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ])
  // console.log(userTypes);

  const scheduleInfo = await Schedules.find({})
  // console.log(scheduleInfo)




  //Most simple solution would be to query both users and schedules and send combined response
  //Long-term solutions would have to take month num into account 

  const usersAndSchedules = {userTypes, scheduleInfo}
  // console.log(usersAndSchedules)
  res.json(usersAndSchedules);
});


router.put('/schedules', async (req, res) => {
  console.log("REQ.BODY: ", req.body)
  let detailsOb = "details." + req.body.date
  let nameOb = {"name": req.body.name, [detailsOb]: {$exists: true}}
  let details = {[detailsOb]: req.body.times}
  let options = {upsert: true, new: true, setDefaultsOnInsert: true };
  let findOptions = {_id: 0, name: 1, details: 1} 

  console.log({nameOb, details})
  try {
    const findRes = await Schedules.findOne(nameOb, findOptions)
    console.log("findRes: ", findRes)
    if(findRes != null) {
      const findAndUpdate = await Schedules.findOneAndUpdate(nameOb, details, options)
      console.log("findAndUpdate: ", findAndUpdate)
      res.json("FindAndUpdate successful1")
    }
    else {
      const findIfExists = await Schedules.findOne({"name": req.body.name}, findOptions)
      console.log("findIfExists: ", findIfExists)
      if(findIfExists != null) {
        let updateOb = {
          name: findIfExists.name,
          details: {
            [req.body.date]: req.body.times,
          }
        }
        let oldObjKeys = Object.entries(findIfExists['_doc'].details)
        console.log("oldObjKeys: ", oldObjKeys)
        oldObjKeys.forEach(eachitem => {
          console.log({eachitem}, eachitem[0], eachitem[1])
          updateOb.details[eachitem[0]] = eachitem[1]
        })
        console.log("updateOb: ", updateOb)
        const updatedetails = await Schedules.replaceOne({"name": req.body.name}, updateOb, options)
        console.log("updatedetails: ", updatedetails)
        res.json("FindIfExists successful")
      }
      else { //create new doc if doesn't exist
        const findAndUpdate = await Schedules.findOneAndUpdate(nameOb, details, options)
        console.log("findAndUpdate: ", findAndUpdate)
        res.json("FindAndUpdate successful2")
      }
    }
  } catch(err) {
      console.error(err.message);
      res.send(400).send('Server Error');
  }
});

router.put('/userprefs', async (req, res) => {
  console.log("REQ.BODY: ", req.body)
  let nameOb = {"name": req.body.name, "preferences": {$exists: true}}
  let details = {"preferences": req.body.preferences}
  let options = {upsert: true, new: true, setDefaultsOnInsert: true };
  let findOptions = {_id: 1, name: 1, preferences: 1, password: 1, type: 1} 

  console.log({nameOb, details})
  try {
    const findRes = await Users.findOne(nameOb, findOptions)
    console.log("findRes: ", findRes)
    if(findRes != null) {
      const findAndUpdate = await Users.findOneAndUpdate(nameOb, details, options)
      console.log("findAndUpdate: ", findAndUpdate)
      res.json("FindAndUpdate successful1")
    }
    else {
      const findIfExists = await Users.findOne({"username": req.body.name}, findOptions)
      console.log("findIfExists: ", findIfExists)
      if(findIfExists != null) {
        // let updateOb = {
        //   username: findIfExists.name,
        //   preferences: req.body.prefs
        // }
        let updateOb = {
          username: req.body.name,
          preferences: req.body.preferences
        }
        let oldObjKeys = Object.entries(findIfExists['_doc'])
        console.log("oldObjKeys: ", oldObjKeys)
        oldObjKeys.forEach(eachitem => {
          if(eachitem[0] == "preferences") {
            console.log("returning null")
            return null
            // eachitem[1].forEach(item => {
            //   console.log("Inner loop!", item)
            //   updateOb.preferences[eachitem[0]] = eachitem[1]
            // })
          }
          console.log("For Each Loop: ", {eachitem}, eachitem[0], eachitem[1])
          updateOb[eachitem[0]] = eachitem[1]
        })
        console.log("updateOb: ", updateOb)
        const updatedetails = await Users.replaceOne({"username": req.body.name}, updateOb, options)
        console.log("updatedetails: ", updatedetails)
        res.json("FindIfExists successful")
      }
      else { //create new doc if doesn't exist
        const findAndUpdate = await Users.findOneAndUpdate(nameOb, details, options)
        console.log("findAndUpdate: ", findAndUpdate)
        res.json("FindAndUpdate successful2")
      }
    }
  } catch(err) {
      console.error(err.message);
      res.send(400).send('Server Error');
  }
});

router.get("/routes", async (req, res) => {
  const userTypes = await Users.aggregate([
    {
      $group: {
          _id: "$type",
          name: {$push: "$username"}
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ])
  console.log(userTypes);

  const scheduleInfo = await Schedules.find({})

  const usersAndSchedules = {userTypes, scheduleInfo}
  console.log(usersAndSchedules)
  res.json(usersAndSchedules);
});

module.exports = router;
