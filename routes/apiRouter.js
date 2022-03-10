const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Estimate, Template, Catalog, Users, Schedules, Locations, Messages } = require("./models");
const bodyParser = require("body-parser");
const { ResumeToken } = require("mongodb");
const jsonParser = bodyParser.json();
// const assert = require('assert');
// const allSettled = require('promise.allsettled');
// const Promise = require('es6-shim');


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
const ca = Catalog()
const us = Users()
const sch = Schedules()
const lo = Locations()
const me = Messages()
let date = new Date()
let currentTime = () =>`${date.getUTCMonth()+1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}:${date.getSeconds()}`

router.get("/estimates", async (req, res) => {
  const estimates = await Estimate.find({});
  // console.log(estimates);
  res.json(estimates);
  // estimates.catch(res.send("error!"))
});

router.get("/estimate", async (req, res) => {
  const esti = await Estimate.aggregate([
    {
      $match: {
        '_id': mongoose.Types.ObjectId(req.query.s)
      }
    }
  ])
  res.json(esti);
});

router.get("/accounts", async (req, res) => {
  const accounts = await Users.aggregate([
    {
      $sort: {
        'privileges': 1
      }
    }
  ]);

  res.json(accounts);
});

router.get("/catalog", async (req, res) => {
  const catalog = await Catalog.find({});

  res.json(catalog);
});

router.post("/catalogitem", async (req, res) => {
  console.log("Catalog item requested: ", req)
  const catalogitem = await Catalog.aggregate([
    {
      $match: {
        'item': req.body.product
      }
    }
  ]).catch(err => res.json(err))
  res.json(catalogitem);
});

router.put("/catalog", async (req, res) => {
  let query = {"_id": mongoose.Types.ObjectId(req.body.id)}
  let update
  let options = { returnNewDocument: true, upsert: true}

  if(req.body.intent === "edit product") {
    // let updateTarget = "template." + req.body.category + req.body.item + req.body.field
    update = {
      "$set": {
        "category": req.body.category, "item": req.body.item, "cost": req.body.cost, "stock": req.body.stock
      }
    }

    return ca.collection.findOneAndUpdate(query, update, options)
  }
  else if(req.body.intent === "update stock") {
    // let updateTarget = "template." + req.body.category + req.body.item + req.body.field
    update = {
      "$set": {
        "category": req.body.category, "item": req.body.item, "cost": req.body.cost, "stock": req.body.stock, "last restock": currentTime()
      }
    }

    return ca.collection.findOneAndUpdate(query, update, options)
  }
  else if(req.body.intent === "create") {
    let insertionObj = {"category": req.body.category, "item": req.body.item, "cost": req.body.cost, "stock": req.body.stock, "last restock": currentTime(), "created at": currentTime()};
    ca.collection.insertOne(insertionObj, onInsert);
    function onInsert(err) {
      if (err) {
        console.log("Error!", err);
      } else {
        console.info("Item was successfully stored.");
        res.json("item stored");
      }
    }
  }
  else if(req.body.intent === "delete") {
    // update = {
    //   "$set": {
    //     "category": req.body.category, "item": req.body.item, "cost": req.body.cost, "stock": req.body.stock
    //   }
    // }

    return ca.collection.findOneAndDelete(query)
  }

  // return tl.collection.findOneAndUpdate(query, update, options)
})

router.get("/userdata", async (req, res) => {
  console.log("req query: ", req.query)
  // const userData = await Estimate.aggregate([
  //   {
  //     $match: {
  //       'estimate.Created By': req.query.username
  //     }
  //   }
  // ])
  const oldOrders = await Estimate.aggregate([
      {
        $addFields: {
          convertedDate: { $toDate: "$timestamp" }
        }
      },
      {
        $sort: {
          "convertedDate": 1 
        }
      },
      {
        $limit : 10
      }
  ])

  const trackedOrders = await Estimate.aggregate([
    {
      $match: {
        'estimate.Tracked': 'tracked'
      }
    }
  ])

  let dateToMatch = 'details.' + `${date.getUTCMonth()+1}/${date.getDate()}`
  console.log("DATE TO MATCH: ", dateToMatch)
  const whosWorking = await Schedules.aggregate([
    {
      $match: {
        [dateToMatch]: {$exists: true} 
      }
    }
  ])

  const allMessages = await Messages.find({});

  const userTypes = await Users.aggregate([
    {
      $group: {
          _id: "$type",
          name: {$push: "$username"},
          id: {$push: "$_id"},
          background: {$push: "$background"}
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ])

  const catalog = await Catalog.aggregate([
    {
      $addFields: {
        convertedDate: { $toDate: "$created at" }
      }
    },
    {
      $sort: {
        "convertedDate": -1 
      }
    },
    {
      $limit : 10
    }
  ]);

  let userAndMessages = {oldOrders, trackedOrders, whosWorking, allMessages, userTypes, catalog}

  res.json(userAndMessages);
});





router.get("/nameidmap", async (req, res) => {
  console.log("req query: ", req.query)
  const userTypes = await Users.aggregate([
    {
      $group: {
          _id: "$type",
          name: {$push: "$username"},
          id: {$push: "$_id"},
          background: {$push: "$background"}
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ])

  res.json(userTypes);
});

router.get("/username", async (req, res) => {
  console.log("req query: ", req.query)
  const userData = await Users.aggregate([
    {
      $match: {
        '_id': mongoose.Types.ObjectId(req.query.id)
      }
    }
  ])

  res.json(userData[0].username);
});

router.get("/reports", async (req, res) => {
  console.log("req query: ", req.query)
  const paymentData = await Estimate.aggregate([
    // {
    //   $group:   {
    //     _id:  {
    //         credit: "$estimate.Payment.credit",
    //         dedit: "$estimate.Payment.dedit",
    //         cash: "$estimate.Payment.cash",
    //         check: "$estimate.Payment.check"
    //     },
    //     count: {$sum:1}
    //   }
    // },
    {
      $group:   {
        _id: "payments",
        "credit": {
          $push: "$estimate.Payment.credit"
        },
        "web": {
          $push: "$estimate.Payment.web"
        },
        "cash": {
          $push: "$estimate.Payment.cash"
        },
        "check": {
          $push: "$estimate.Payment.check"
        },
        creditRev: {$sum: "$estimate.Payment.credit"},
        webRev: {$sum: "$estimate.Payment.web"},
        cashRev: {$sum: "$estimate.Payment.cash"},
        checkRev: {$sum: "$estimate.Payment.check"},
        count: {$sum: "$credit"}
      }
    }
  ])

  const cartData = await Estimate.aggregate([
    {
      $project:   {
        _id:  "$_id",
        "carts": {$objectToArray: "$estimate.Cart"},
        "payments": {$objectToArray: "$estimate.Payment"},
        count: {$sum:1}
      }
    },
  ])

  const dataForReports = {paymentData, cartData}

  res.json(dataForReports);
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////
// project: {
//   _id: "$_id",
//   "cart": {$objectToArray: "$estimate.Cart"}
// }
// group: {
//   _id: {
//     name: "$_id",
//     thecart: "$cart"
//   },

// }
// unwind: {
//   path: "$_id.thecart",
//   preserveNullAndEmptyArrays: true
// }
// group: {
//   _id: "$_id.name",
//   names: {$push: "$_id.thecart.k"},
//   totalsdue: {$push: "$_id.thecart.v.total"},
//   totalspaid: {
//     $addToSet: "$_id.thecart.v"
//   },
// }
// unwind: {
//   path: "$totalspaid"
// }
// project: {
//   totalspaid: 1,
//   checker: {
//         $eq: [{$type: "$totalspaid"}, "string"]
//   },
//   denom: {
//       $cond: {
//         if: {
//         $eq: [{$type: "$totalspaid"}, "string"]
//         },
//         then: "$totalspaid",
//         else: "$$REMOVE"
//       }
//   },
//   numer: {
//     $cond: {
//       if: {
//       $eq: [{$type: "$totalspaid"}, "object"]
//       },
//       then: "$totalspaid.total",
//       else: "$$REMOVE"
//     }
//   }
// }
// project: {
//   denom: 1,
//   numer: 1
// }
// group: {
//   _id: {
//     name: "$_id",
//     denominators: {$toDouble: "$denom"}
//   },
//   numerator: {$push: "$numer"},
//   sumNumerator: {$sum: "$numer"},
//   denominator: {$addToSet: {$toDouble: "$denom"}},
// }
// project: {
//   _id: 1,
//   numerator: 1,
//   // sumTotal: {$divide: ["$numerator", 5]}
// }
////////////////////////////////////////////////////////////////////////////////////////////////////////////



router.put('/userassignments', async (req, res) => {
  console.log("REQ.BODY: ", req.body)
  let query = {"_id": mongoose.Types.ObjectId(req.body.id)}
  let saveField = "assignments." + req.body.field
  let update1 = {
    "$push": { 
      "assignments": {"value": req.body.value, "time": currentTime(), "by": req.body.by} 
    }
  }

  us.collection.findOneAndUpdate(query, update1)
  res.json("Assignment updated!")
})



router.post("/estimates", async (req, res) => {
  console.log("REQUEST: ", req)
  let insertionObj = { estimate: req.body, timestamp: currentTime(), changelog: [] };
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

router.put("/estimates", async (req, res) => {
  console.log("ESTIMATE UPDATE REQUEST: ", req.body)

  let query = {"_id": mongoose.Types.ObjectId(req.body.id)}
  let valToInsert 
  switch(req.body.field) {
    case("Payment"): {
      valToInsert = req.body.paymentType + " $" + req.body.value
      break;
    }
    case("Stage Update"): {
      valToInsert = req.body.value
      break;
    }
    case("Edit"): {
      console.log("LINEKEY VAL: ", req.body.value)
      valToInsert = req.body.linekey + ": " + req.body.value.name
      break;
    }
    default: {
      res.json("Error finding specified document.", req.body)
      break;
    }
  }
  let update1 = {
    "$push": { 
      "changelog": {[req.body.field]: {"value": valToInsert, "time": currentTime(), "by": req.body.by} }
    }
  }

  let update2
  if(req.body.field == "Stage Update") {   
    let pointer = req.body.value.search("Stage")
    let value = req.body.value.substring(pointer)
    let method = req.body.value.substring(0, pointer-1)
    update2 = {
      "$set": {
        "estimate.Stage": {"value": value, "method": method}
      }
    }
  }
  else if(req.body.field == "Payment") {
    let lineFinder = "estimate.Payment." + [req.body.paymentType]
    let amountPaid = req.body.value + req.body.previousValue
    update2 = {
      "$set": {
        [lineFinder]: amountPaid
      }
    }
  }
  else if(req.body.field == "Edit") {
    let lineFinder = req.body.storeName === undefined ? "estimate." + req.body.linekey : "estimate." + req.body.linekey + "." + req.body.storeName
    update2 = {
      "$set": {
        [lineFinder]: req.body.value
      }
    }
  }
  else {
    update2 = {
      "$set": {
        "estimate.Tracked": req.body.value
      }
    }
  }
  let options2 = { returnNewDocument: true}

  es.collection.findOneAndUpdate(query, update1)
  return es.collection.findOneAndUpdate(query, update2, options2)

  .then(updatedDocument => {
    if(updatedDocument) {
      res.json(updatedDocument)
    } else {
      res.json("No document matches the provided query.")
    }
    return updatedDocument
  })
  .catch(err => res.json(`Failed to find and update document: ${err}`))
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

router.get("/tax", async (req, res) => {
  const returnItem = await axios
  .get(
    `https://services.maps.cdtfa.ca.gov/api/taxrate/GetRateByAddress?address=9036 winnetka ave&city=northridge&zip=91324`,
  ).then(res => {
    return res.data.taxRateInfo[0].rate
  }).catch(err => res.json(err))
  res.json(returnItem)
})

router.get("/routes", async (req, res) => {
  const userTypes = await Users.aggregate([
    {
      $group: {
          _id: "$type",
          name: {$push: "$username"},
          id: {$push: "$_id"}
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ])

  const scheduleInfo = await Schedules.find({})

  let estimateInfo = await Estimate.find({})
  let failedCoords = []
  let coordData = await Promise.allSettled(estimateInfo.map(async eachEst => {
    eachEst = JSON.parse(JSON.stringify(eachEst))

    if(eachEst.estimate.Coords == undefined) {
      let searchString = `${eachEst.estimate["Address"]}, ${eachEst.estimate["City"]} ${eachEst.estimate["State"]}`
      let idToAmend = eachEst._id
      console.log("Search String: ", searchString, "ID: ", idToAmend)
      const returnItem = await axios
      .get(
        `http://api.positionstack.com/v1/forward?access_key=a627f58146067a79ccc486ba7dd1be39&query=${searchString}`,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      ).then(res => {
        if(res.data.data[0].latitude == undefined || res.data.data[0].longitude == undefined) {
          failedCoords.push(searchString)
        }
        else {
          console.log("MAP RESPONSE: ", {"lat": res.data.data[0].latitude, "long": res.data.data[0].longitude}, res.data)
          eachEst.estimate['latitude'] = res.data.data[0].latitude
          eachEst.estimate['longitude'] = res.data.data[0].longitude
          let query = {"_id": mongoose.Types.ObjectId(idToAmend)}
          let update = {
            "$set": {
              "estimate.Coords": {"lat": res.data.data[0].latitude, "long": res.data.data[0].longitude}
            }
          }
          let options = { returnNewDocument: true}
        
          return es.collection.findOneAndUpdate(query, update, options)
          // return (eachEst)
        }
      }).catch(err => res.json(`Failed to find map coords: ${err}`))
      return(returnItem)
    }
    else {
      return eachEst
    }
  }))
  

  console.log("FAILED COORDS: ", failedCoords)
  let backupCoords = await Promise.all(failedCoords.map(async eachCoord => {
    console.log("Search String for Backup: ", eachCoord)
    const returnItem = await axios
    .get(
      `http://api.positionstack.com/v1/forward?access_key=a627f58146067a79ccc486ba7dd1be39&query=${eachCoord}&limit=1`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    ).then(async res => {
      console.log("Backup: ", eachCoord)
      console.log("BACKUP MAP RESPONSE: ", {"lat": res.data.data[0].latitude, "long": res.data.data[0].longitude}, res.data)
      eachEst.estimate['latitude'] = res.data.data[0].latitude
      eachEst.estimate['longitude'] = res.data.data[0].longitude
      return (eachEst)
    // })
    }).catch(err => res.json(`Failed to find backup map coords: ${err}`))
    return(returnItem)
  }))

  const accounts = await Users.aggregate([
    {
      $match: {
        'type': 'driver'
      }
    },
    {
      $project: {
        'background': 1,
        'assignments': 1,
        'confirms': 1
      }
    }
  ]);

  const dataForRoutes = {userTypes, scheduleInfo, coordData, backupCoords, accounts}
  // console.log(dataForRoutes)
  res.json(dataForRoutes);
});

router.get("/petinfo", async (req, res) => {
  const petInfo = await Estimate.aggregate([
    {
      $match: {
        '_id': mongoose.Types.ObjectId(req.query.p)
      }
    },
    {
      $project: {
        'estimate.Pet Name': 1
      }
    }
  ]).then(theInfo => {
    res.json(theInfo)
  }).catch(err => {
    res.json(err)
  })

  // res.json(petInfo)
})

router.put("/routes", async (req, res) => {
  let idToAmend = "614bbbccfe250b003407ba59"

  const returnItem = await axios
  .get(
    `http://api.positionstack.com/v1/forward?access_key=a627f58146067a79ccc486ba7dd1be39&query=1253 Bishops Rd, Los Angeles CA`,
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  ).then(res => {
    if(res.data.data[0].latitude == undefined || res.data.data[0].longitude == undefined) {
      console.log("did not work.")
    }
    else {
      console.log("MAP RESPONSE: ", {"lat": res.data.data[0].latitude, "long": res.data.data[0].longitude}, res.data)
      // eachEst.estimate['latitude'] = res.data.data[0].latitude
      // eachEst.estimate['longitude'] = res.data.data[0].longitude
      let query = {"_id": mongoose.Types.ObjectId(idToAmend)}
      let update = {
        "$set": {
          "estimate.Coords": {"lat": res.data.data[0].latitude, "long": res.data.data[0].longitude}
        }
      }
    
      return es.collection.findOneAndUpdate(query, update)
    }
  }).catch(err => res.json(`Failed to find map coords: ${err}`))
  return(returnItem)

  // let query = {"_id": mongoose.Types.ObjectId(idToAmend)}
  // let update = {
  //   "$set": {
  //     "estimate.Coords": {"lat": res.data.data[0].latitude, "long": res.data.data[0].longitude}
  //   }
  // }

  // return es.collection.findOneAndUpdate(query, update)
  // .then(updatedDocument => {
  //   if(updatedDocument) {
  //     res.json(updatedDocument)
  //   } else {
  //     res.json("No document matches the provided query.")
  //   }
  //   return updatedDocument
  // })
  // .catch(err => res.json(`Failed to find and update document: ${err}`))
})

router.get("/onelocation", async (req, res) => {
  // console.log("REQ QUERY: ", req, req.query)
  const locationInfo = await Locations.aggregate([
    {
      $match: {
        'userId': req.query.id
      }
    }
  ])
    
  if(locationInfo.length > 0) {
    console.log("LOC INFO: ", locationInfo)
    let searchString = `${locationInfo[0].locations[0].lat}, ${locationInfo[0].locations[0].long}`
    console.log("Driver location search string: ", searchString)
    const locationData = await axios
    .get(
      `http://api.positionstack.com/v1/reverse?access_key=a627f58146067a79ccc486ba7dd1be39&query=${searchString}&limit=1`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
      ).then(res => {
        if(res.statusText === "OK") {       
            console.log("RES FOR DRIVER LOCATION: ", res.data)
          // console.log("ADDITIONAL RES INFO: ", res.data, res.statusText, res.statusText === "OK")
          // res = res.json()

          // let place = res.data.data[0].neighbourhood == null ? res.data.data[0].locality : res.data.data[0].neighbourhood
          // return place

        }
        else {
          // throw new Error(res.statusText);
          throw new Error(res.statusText, res);
        }
        return res
      })
      .then(parseRes => {
        console.log("PARSED RES: ", parseRes.data)
        let place = parseRes.data.data[0].neighbourhood == null ? parseRes.data.data[0].locality : parseRes.data.data[0].neighbourhood
        // return place
        res.json(place)
      }).catch(err => res.json(`Failed to find map coords: ${err}`))
      // res.json(locationData);
      locationData
      
  }
  else {
    res.json("No location information for this user.");
  }
});




router.get("/locations", async (req, res) => {

  //eventually this has to be simplified down to just do one at a time and utilize proper front end redundancy
  //when location data is being saved, automatically make call to positionstack and return name

  //idk about those upper two lines but this request is making a bunch of calls to positionstack everytime, look into caching the data and only updating if it changed relative to X minutes ago or whatever
  const locationInfo = await Locations.find({})
  console.log(locationInfo)

  let locationData = await Promise.all(locationInfo.map(async every => {
    console.log("EVERY: ", every)
    every = JSON.parse(JSON.stringify(every))
    let searchString = `${every.locations[0].lat}, ${every.locations[0].long}`
    console.log("Driver Location Search String: ", searchString)
    const returnItem = await axios
    .get(
      `http://api.positionstack.com/v1/reverse?access_key=a627f58146067a79ccc486ba7dd1be39&query=${searchString}&limit=1`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    ).then(res => {
      console.log("RES FOR DRIVER LOCATIONS: ", res.data)
      let place = {
        [every.userId]: res.data.data[0].neighbourhood == null ? res.data.data[0].locality : res.data.data[0].neighbourhood,
        "lat": every.locations[0].lat,
        "long": every.locations[0].long
      }
      return place
    }).catch(err => res.json(`Failed to find map coords: ${err}`))
    return(returnItem)
  }))
  console.log("LOCATION DATA: ", locationData)

  res.json(locationData); //could the issue be this is doing a res.json by default and if it errors it is also providing one?
});



router.get("/schedules", async (req, res) => {
  const userTypes = await Users.aggregate([
    {
      $group: {
          _id: "$type",
          name: {$push: "$username"},
          id: {$push: "$_id"},
          background: {$push: "$background"}
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ])

  const scheduleInfo = await Schedules.find({})

  const dataForRoutes = {userTypes, scheduleInfo}
  // console.log(dataForRoutes)
  res.json(dataForRoutes);
});


router.put('/schedules', async (req, res) => { //NEED to make schedules also use ID and NOT just name
  console.log("REQ.BODY: ", req.body)
  let detailsOb = "details." + req.body.date
  let nameOb = {"userId": req.body.userId, [detailsOb]: {$exists: true}}
  let details = {[detailsOb]: req.body.times}
  let options = {upsert: true, new: true, setDefaultsOnInsert: true };
  let findOptions = {_id: 0, userId: 1, details: 1} 


  if(req.body.times === "clear") {
    let update = {
      "$unset": {[detailsOb]: ""}
    }
    const clearRes = await Schedules.findOneAndUpdate(nameOb, update)
    console.log("findAndDelete: ", clearRes)
    res.json("FindAndDelete successful")
  }
  else {
    console.log({nameOb, details})
    try {
      const findRes = await Schedules.findOne(nameOb, findOptions)
      console.log("findRes: ", findRes)
      if(findRes != null) {
        const findAndUpdate = await Schedules.findOneAndUpdate(nameOb, details, options)
        console.log("findAndUpdate: ", findAndUpdate)
        res.json("FindAndUpdate successful")
      }
      else {
        const findIfExists = await Schedules.findOne({"userId": req.body.userId}, findOptions)
        console.log("findIfExists: ", findIfExists)
        if(findIfExists != null) {
          let updateOb = {
            userId: findIfExists.userId,
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
          const updatedetails = await Schedules.replaceOne({"userId": req.body.userId}, updateOb, options)
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
  }
});

router.put('/userprefs', async (req, res) => {
  console.log("REQ.BODY: ", req.body)
  let nameOb = {"name": req.body.name, "preferences": {$exists: true}}
  let details = {"preferences": req.body.preferences}
  let options = {upsert: true, new: true, setDefaultsOnInsert: true };
  let findOptions = {_id: 1, name: 1, preferences: 1, password: 1, type: 1, background: 1} 

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

router.post("/messages", async (req, res) => {
  console.log("MESSAGE REQUEST: ", req.body)
  let insertionObj = { author: req.body.author, message: req.body.content, at: req.body.at, timestamp: currentTime() };
  me.collection.insertOne(insertionObj, onInsert);
  function onInsert(err, docs) {
    if (err) {
      console.log("Error!", err);
    } else {
      console.info("Message was successfully stored.", docs.length);
      res.json(insertionObj);
    }
  }
});

router.get("/messages", async (req, res) => {
  const allMessages = await Messages.find({});
  // console.log(estimates);
  res.json(allMessages);
  // estimates.catch(res.send("error!"))
});

module.exports = router;
