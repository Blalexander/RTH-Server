const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Estimate, Users, Schedules } = require("./models");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();


const dbName = "Admin";
const dbPass = "Admin";
mongoose.connect(
  `mongodb+srv://${dbName}:${dbPass}@cluster0.qbhpb.mongodb.net/rth_development?retryWrites=true&w=majority`,
  function (err) {
    if (err) {
      console.log("Not connected to the detailsbase: " + err);
    } else {
      console.log("Successfully connected to MongoDB");
    }
  }
);

const es = Estimate()
const us = Users()
const sch = Schedules()


router.get("/estimates", async (req, res) => {
  const estimates = await Estimate.find({});
  console.log(estimates);
  res.json(estimates);
  // estimates.catch(res.send("error!"))
});

router.post("/estimates", async (req, res) => {
  let insertionObj = { estimate: req.body };
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
  console.log(userTypes);

  const scheduleInfo = await Schedules.find({})
  // console.log(scheduleInfo)




  //Most simple solution would be to query both users and schedules and send combined response
  //Long-term solutions would have to take month num into account 

  const usersAndSchedules = {userTypes, scheduleInfo}
  console.log(usersAndSchedules)
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
      }
      else { //create new doc if doesn't exist
        const findAndUpdate = await Schedules.findOneAndUpdate(nameOb, details, options)
        console.log("findAndUpdate: ", findAndUpdate)
      }
    }


    // await Schedules.findOneAndUpdate(nameOb, details, options)
    // .then(result => {
    //   if(result){
    //     console.log("success!", result)
    //   }
    //   else {
    //     console.log("couldn't do it")
    //   }
    //   return result
    // })


  } catch(err) {
      console.error(err.message);
      // res.send(400).send('Server Error');
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
