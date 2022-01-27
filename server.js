// require("dotenv").config();


const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');

app.use(morgan('common'));

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({origin: "*"}));

const apiRoute = require("./routes/apiRouter");
app.use("/api", apiRoute);

const { router: usersRouter } = require('./users');
app.use("/users", usersRouter);

const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');
app.use('/auth', authRouter);

passport.use(localStrategy);
passport.use(jwtStrategy);
const jwtAuth = passport.authenticate('jwt', { session: false });

// const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.json({ok: true});
});

const { PORT } = require("./config");
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));






const path = require('path');
const OAuthClient = require('intuit-oauth');
const bodyParser = require('body-parser');
// const ngrok = process.env.NGROK_ENABLED === 'true' ? require('ngrok') : null;

/**
 * Configure View and Handlebars
 */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.engine('html', require('ejs').renderFile);

app.set('view engine', 'html');
app.use(bodyParser.json());

const urlencodedParser = bodyParser.urlencoded({ extended: false });

/**
 * App Variables
 * @type {null}
 */
let oauth2_token_json = null;
let redirectUri = '';

/**
 * Instantiate new Client
 * @type {OAuthClient}
 */

let oauthClient = null;

// app.get('/authUri', urlencodedParser, function (req, res) {
//   oauthClient = new OAuthClient({
//     clientId: 'ABm4IChJWiZjVNEGakr4oxGZVCrVkxI4XZ9O7cfEozK3q7XES5',
//     clientSecret: 'fwMwHuEXtF417MjdzbzZOC6M6TMVKY2Q7jNkQcSb',
//     environment: 'sandbox',
//     redirectUri: 'https://rth-server.azurewebsites.net/callback',
//   });

//   const authUri = oauthClient.authorizeUri({
//     scope: [OAuthClient.scopes.Accounting],
//     state: 'intuit-test',
//   });
//   res.send(authUri);
// });

// /**
//  * Handle the callback to extract the `Auth Code` and exchange them for `Bearer-Tokens`
//  */
//  app.get('/callback', function (req, res) {
//   oauthClient
//     .createToken(req.url)
//     .then(function (authResponse) {
//       oauth2_token_json = JSON.stringify(authResponse.getJson(), null, 2);
//     })
//     .catch(function (e) {
//       console.error(e);
//     });

//   res.send('');
// });

/**
 * Display the token : CAUTION : JUST for sample purposes
 */
app.get('/retrieveToken', function (req, res) {
  res.send(oauth2_token_json);
});

app.get('/getCompanyInfo', function (req, res) {
  const companyID = oauthClient.getToken().realmId;

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/companyinfo/${companyID}` })
    .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
    });
});

app.get('/getProfitLoss', function (req, res) {
  const companyID = oauthClient.getToken().realmId;

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/reports/ProfitAndLoss?minorversion=14`, method: 'GET', headers: {'Content-Type': 'application/text'}  })
    .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
    });
});

app.get('/getOrderInfo', function (req, res) {
  const companyID = oauthClient.getToken().realmId;

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/query?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/text'}, body: 'select * from invoice' })
    .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
      res.status(501).json({code: 501, message: e});
    });
});

app.get('/getEstimateInfoSingle', function (req, res) {
  const companyID = oauthClient.getToken().realmId;

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/estimate/148?minorversion=14` })
    .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
    });
});

app.post('/getEstimateInfo', function (req, res) {
  const companyID = oauthClient.getToken().realmId;

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/query?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/text'}, body: 'select * from estimate' })
    .then(function (authResponse) {
      console.log(`The response for API call is :${JSON.stringify(authResponse)}`);
      res.send(JSON.parse(authResponse.text()));
    })
    .catch(function (e) {
      console.error(e);
      res.status(501).json({code: 501, message: e});
    });
});

app.post('/createEstimate', function (req, res) {
  const companyID = oauthClient.getToken().realmId;

  let estimateToSend = {
    "Line": [],
    "TxnTaxDetail": {
      "TotalTax": 0
    },
    "CustomerRef": {
      "value": "3",
      "name": req.body["Owner Name"]
    },
    "CustomerMemo": {
      "value": "Thank you for your business and have a great day!"
    },
    "TotalAmt": 31.5,
    "ApplyTaxAfterDiscount": false,
    "PrintStatus": "NeedToPrint",
    "EmailStatus": "NotSet",
    "BillEmail": {
      "Address": req.body["Email"]
    }
  }

  let i = 1
  let runningTotal = 0
  let itemId
  for(let eachItem in req.body) {
    console.log("Each Item: ", eachItem, req.body[eachItem])
    if(Array.isArray(req.body[eachItem])) {
      console.log("Is Array? ", eachItem)
      if(eachItem == "Urn") {
        itemId = 19
      }
      else if(eachItem == "Paw Print Options") {
        itemId = 20
      }
      else if(eachItem == "Jewelry/Keychain") {
        itemId = 21
      }
      else if(eachItem == "Cremation Service") {
        itemId = 21
      }
      else if(eachItem == "Nose Print") {
        itemId = 21
      }
      else {
        itemId
      }
      req.body[eachItem].forEach(item => {
        console.log("IT IS: ", item, i, itemId)
        let l = item.length
        let ind = item.indexOf("$") + 1
        let itemCost = parseInt(item.slice(-(l - ind)))
        console.log({itemCost, runningTotal})
        let itemName = item.slice(0, ind-2)
        let insertObject1 = {
          "LineNum": i,
          "Description": itemName,
          "Amount": itemCost,
          "DetailType": "SalesItemLineDetail",
          "SalesItemLineDetail": {
            "ItemRef": {
              "value": itemId,
              "name": eachItem
            },
            "UnitPrice": itemCost,
            "Qty": 1,
            "TaxCodeRef": {
              "value": "NON"
            }
          }
        }
        let insertObject2 = {
          "Amount": itemCost,
          "DetailType": "SubTotalLineDetail",
          "SubTotalLineDetail": {}
        }
        estimateToSend["Line"].push(insertObject1)
        estimateToSend["Line"].push(insertObject2)
        runningTotal += itemCost
        i++
      })
    }
    estimateToSend["TotalAmt"] = runningTotal
  }

  console.log(estimateToSend)

  let estimateToSend1 = {
    "Line": [
      {
        "Id": "1",
        "LineNum": 1,
        "Description": "Pest Services",
        "Amount": 75.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "10",
            "name": "Pest"
          },
          "UnitPrice": 75,
          "Qty": 1,
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      },
      {
        "Amount": 75.0,
        "DetailType": "SubTotalLineDetail",
        "SubTotalLineDetail": {}
      },
      {
        "Amount": 3,
        "DetailType": "DiscountLineDetail",
        "DiscountLineDetail": {
          "PercentBased": true,
          "DiscountPercent": 10,
          "DiscountAccountRef": {
            "value": "86",
            "name": "Discounts given"
          }
        }
      },
      {
        "Id": "1",
        "LineNum": 2,
        "Description": "Specialty Urn",
        "Amount": 5.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "10",
            "name": "Pest Control"
          },
          "UnitPrice": 5,
          "Qty": 1,
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      },
      {
        "Amount": 5.0,
        "DetailType": "SubTotalLineDetail",
        "SubTotalLineDetail": {}
      }
    ],
    "TxnTaxDetail": {
      "TotalTax": 0
    },
    "CustomerRef": {
      "value": "3",
      "name": req.body["Owner Name"]
    },
    "CustomerMemo": {
      "value": "Thank you for your business and have a great day!"
    },
    "TotalAmt": 31.5,
    "ApplyTaxAfterDiscount": false,
    "PrintStatus": "NeedToPrint",
    "EmailStatus": "NotSet",
    "BillEmail": {
      "Address": req.body["Email"]
    }
  }


  let testAuthRes 

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/query?query=select * from Customer Where DisplayName = '${req.body["Owner Name"]}'&minorversion=14`, method: 'GET' })
    .then(function (authResponse) {
      console.log(`The response for API call for Customer Query is :${JSON.stringify(authResponse)}`);
      // res.send(JSON.parse(authResponse.text()));
      // let readableRes = JSON.parse(authResponse.text())
      testAuthRes = authResponse
      if(testAuthRes.json.QueryResponse.Customer != undefined) {
        // estimateToSend.CustomerRef.value = readableRes.Customer[0].Id
        return makeCall(testAuthRes.json.QueryResponse.Customer[0].Id)
      }
      else {
        return createCustomer(req.body["Owner Name"])
      }
    })
    .catch(function (e) {
      console.error(e);
      res.status(501).json({code: 501, message: e, where: "During initial Customer Query", why: testAuthRes.json});
    });

  function createCustomer(newName) {
    let createCustObj = {
      "DisplayName": newName
    }
    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/customer?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(createCustObj) })
      .then(function (authResponse) {
        console.log(`The response for API call for Create Customer is :${JSON.stringify(authResponse)}`);
        // let readableRes = JSON.parse(authResponse.text())
        let callObj = authResponse.json.QueryResponse == undefined ? authResponse.json : authResponse.json.QueryResponse
        if(callObj.Customer[0] == undefined){
          return makeCall(callObj.Customer.Id)
        }
        else {
          return makeCall(callObj.Customer[0].Id)
        }
      })
      .catch(function (e) {
        console.error(e);
        res.status(501).json({code: 501, message: e, where: "During Create Customer", why: createCustObj});
      });
  }

  function makeCall(newId) {
    estimateToSend.CustomerRef.value = newId
    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/estimate?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(estimateToSend) })
      .then(function (authResponse) {
        console.log(`The response for API call for Create Estimate is :${JSON.stringify(authResponse)}`);
        res.send(JSON.parse(authResponse.text()));
      })
      .catch(function (e) {
        console.error(e);
        res.status(501).json({code: 501, message: e, where: "During Make Call"});
      });
  }
});

app.post('/createEstimate2', function (req, res) {
  const companyID = oauthClient.getToken().realmId;
  let estimateToSend = {
    "Line": [
      {
        "Id": "1",
        "LineNum": 1,
        "Description": "Pest Services",
        "Amount": 75.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "10",
            "name": "Pest"
          },
          "UnitPrice": 75,
          "Qty": 1,
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      },
      {
        "Amount": 75.0,
        "DetailType": "SubTotalLineDetail",
        "SubTotalLineDetail": {}
      },
      {
        "Amount": 3,
        "DetailType": "DiscountLineDetail",
        "DiscountLineDetail": {
          "PercentBased": true,
          "DiscountPercent": 10,
          "DiscountAccountRef": {
            "value": "86",
            "name": "Discounts given"
          }
        }
      },
      {
        "Id": "1",
        "LineNum": 2,
        "Description": "Specialty Urn",
        "Amount": 5.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "10",
            "name": "Pest Control"
          },
          "UnitPrice": 5,
          "Qty": 1,
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      },
      {
        "Amount": 5.0,
        "DetailType": "SubTotalLineDetail",
        "SubTotalLineDetail": {}
      }
    ],
    "TxnTaxDetail": {
      "TotalTax": 0
    },
    "CustomerRef": {
      "value": "3",
      "name": req.body["Owner Name"]
    },
    "CustomerMemo": {
      "value": "Thank you for your business and have a great day!"
    },
    "TotalAmt": 31.5,
    "ApplyTaxAfterDiscount": false,
    "PrintStatus": "NeedToPrint",
    "EmailStatus": "NotSet",
    "BillEmail": {
      "Address": req.body["Email"]
    }
  }


  //NEED:
  //Customer Name
  //Customer ID
  //Customer Email
  //Purchased Items

  let testAuthRes 

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/query?query=select * from Customer Where DisplayName = '${req.body["Owner Name"]}'&minorversion=14`, method: 'GET' })
    .then(function (authResponse) {
      console.log(`The response for API call for Initial Query is :${JSON.stringify(authResponse)}`);
      // res.send(JSON.parse(authResponse.text()));
      // let readableRes = JSON.parse(authResponse.text())
      testAuthRes = authResponse
      if(testAuthRes.json.QueryResponse.Customer != undefined) {
        // estimateToSend.CustomerRef.value = readableRes.Customer[0].Id
        return makeCall(testAuthRes.json.QueryResponse.Customer[0].Id)
      }
      else {
        return createCustomer(req.body["Owner Name"])
      }
    })
    .then(newRes => {
      res.send(newRes)
    })
    .catch(function (e) {
      console.error(e);
      res.status(501).json({code: 501, message: e, where: "During initial Customer Query", why: testAuthRes.json});
    });

  function createCustomer(newName) {
    let createCustObj = {
      "DisplayName": newName
    }
    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/customer?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(createCustObj) })
      .then(function (authResponse) {
        console.log(`The response for API call for Create Customer is :${JSON.stringify(authResponse)}`);
        // let readableRes = JSON.parse(authResponse.text())
        res.send(authResponse.json.QueryResponse)
        // return makeCall(authResponse.json.QueryResponse.Customer[0].Id)
        //ADD ID to customerObj
        //RE-SEND initial call
      })
      .catch(function (e) {
        console.error(e);
        res.status(501).json({code: 501, message: e, where: "During Create Customer", why: req.body["Owner Name"]});
      });
  }


  //MAKE customer object
  //SEND initial call
  function makeCall(newId) {
    estimateToSend.CustomerRef.value = newId
    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/estimate?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(estimateToSend) })
      .then(function (authResponse) {
        console.log(`The response for API call for Create Estimate is :${JSON.stringify(authResponse)}`);
        res.send(JSON.parse(authResponse.text()));
      })
      .catch(function (e) {
        console.error(e);
        res.status(501).json({code: 501, message: e, where: "During Make Call"});
      });
  }
});

app.post('/createEstimate1', function (req, res) {
  const companyID = oauthClient.getToken().realmId;
  let estimateToSend = {
    "Line": [
      {
        "Id": "1",
        "LineNum": 1,
        "Description": "Pest Services",
        "Amount": 75.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "10",
            "name": "Pest"
          },
          "UnitPrice": 75,
          "Qty": 1,
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      },
      {
        "Amount": 75.0,
        "DetailType": "SubTotalLineDetail",
        "SubTotalLineDetail": {}
      },
      {
        "Amount": 3,
        "DetailType": "DiscountLineDetail",
        "DiscountLineDetail": {
          "PercentBased": true,
          "DiscountPercent": 10,
          "DiscountAccountRef": {
            "value": "86",
            "name": "Discounts given"
          }
        }
      },
      {
        "Id": "1",
        "LineNum": 2,
        "Description": "Specialty Urn",
        "Amount": 5.0,
        "DetailType": "SalesItemLineDetail",
        "SalesItemLineDetail": {
          "ItemRef": {
            "value": "10",
            "name": "Pest Control"
          },
          "UnitPrice": 5,
          "Qty": 1,
          "TaxCodeRef": {
            "value": "NON"
          }
        }
      },
      {
        "Amount": 5.0,
        "DetailType": "SubTotalLineDetail",
        "SubTotalLineDetail": {}
      }
    ],
    "TxnTaxDetail": {
      "TotalTax": 0
    },
    "CustomerRef": {
      "value": "3",
      "name": req.body["Owner Name"]
    },
    "CustomerMemo": {
      "value": "Thank you for your business and have a great day!"
    },
    "TotalAmt": 31.5,
    "ApplyTaxAfterDiscount": false,
    "PrintStatus": "NeedToPrint",
    "EmailStatus": "NotSet",
    "BillEmail": {
      "Address": req.body["Email"]
    }
  }


  //NEED:
  //Customer Name
  //Customer ID
  //Customer Email
  //Purchased Items

  let testAuthRes 

  const url =
    oauthClient.environment == 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/query?query=select * from Customer Where DisplayName = '${req.body["Owner Name"]}'&minorversion=14`, method: 'GET' })
    .then(function (authResponse) {
      console.log(`The response for API call for Initial Query is :${JSON.stringify(authResponse)}`);
      // res.send(JSON.parse(authResponse.text()));
      // let readableRes = JSON.parse(authResponse.text())
      testAuthRes = authResponse
      if(testAuthRes.json.QueryResponse.Customer != undefined) {
        // estimateToSend.CustomerRef.value = readableRes.Customer[0].Id
        return makeCall(testAuthRes.json.QueryResponse.Customer[0].Id)
      }
      else {
        return createCustomer(req.body["Owner Name"])
      }
    })
    .then(newRes => {
      res.send(`It got to the second part of Initial Customer Query. ${newRes}`)
    })
    .catch(function (e) {
      console.error(e);
      res.status(501).json({code: 501, message: e, where: "During initial Customer Query", why: testAuthRes.json.QueryResponse});
    });

  function createCustomer(newName) {
    let createCustObj = {
      "DisplayName": newName
    }
    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/customer?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(createCustObj) })
      .then(function (authResponse) {
        console.log(`The response for API call for Create Customer is :${authResponse.json}`);
        // let readableRes = JSON.parse(authResponse.text())
        return makeCall(authResponse.json.QueryResponse.Customer[0].Id)
        //ADD ID to customerObj
        //RE-SEND initial call
      })
      .catch(function (e) {
        console.error(e);
        res.status(501).json({code: 501, message: e, where: "During Create Customer", why: req.body["Owner Name"]});
      });
  }


  //MAKE customer object
  //SEND initial call
  function makeCall(newId) {
    estimateToSend.CustomerRef.value = newId
    oauthClient
      .makeApiCall({ url: `${url}v3/company/${companyID}/estimate?minorversion=14`, method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(estimateToSend) })
      .then(function (authResponse) {
        console.log(`The response for API call for Create Estimate is :${JSON.stringify(authResponse)}`);
        res.send(JSON.parse(authResponse.text()));
      })
      .catch(function (e) {
        console.error(e);
        res.status(501).json({code: 501, message: e, where: "During Make Call"});
      });
  }
});

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://Admin:Admin@cluster0.qbhpb.mongodb.net/rth_development?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const collection = client.db("rth_development").collection("devel_coll");
  // const cursor = collection.find({})
  // console.log(cursor)
  // perform actions on the collection object

  client.close();
});

// app.get('/test', async (req, res) => {
//   const resObj = await client.db("rth_development").collection("devel_coll").find({}).then(res.json(resObj))
// })

app.post('/test', (req, res) => {
  console.log(req.body, req.query)
  const requiredFields = ['name', 'borough', 'cuisine'];
  // for (let i=0; i<requiredFields.length; i++) {
  //   const field = requiredFields[i];
  //   if (!(field in req.body)) {
  //     const message = `Missing \`${field}\` in request body`
  //     console.error(message);
  //     return res.status(400).send(message);
  //   }
  // }
  const collection = client.db("rth_development").collection("devel_coll");
  let insertionObj = {greeting: req.body};
  collection.insertOne(insertionObj, onInsert);
  function onInsert(err, docs) {
    if (err) {
      console.log("Error!", err);
    } else {
      console.info("Estimate was successfully stored.", docs.length);
      res.json("thank you for shopping with us today")
    }
  }
  // Restaurant
  //   .create({
  //     name: req.query.name,
  //     borough: req.query.borough,
  //     cuisine: req.query.cuisine,
  //     grades: req.query.grades,
  //     address: req.query.address})
  //   .then(
  //     restaurant => res.status(201).json(restaurant.serialize()))
  //   .catch(err => {
  //     console.error(err);
  //     res.status(500).json({message: 'Internal server error'});
  //   });
});

// const cors = require('cors');
const {CLIENT_ORIGIN} = require('./config');

// app.use(
//     cors({
//         origin: CLIENT_ORIGIN
//     })
// );

const router = express.Router();
router.use(cors({origin: '*'}))

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json,Authorization,authorization');
  if (req.method === "OPTIONS") {
    return res.send(204);
  }
  next();
});




module.exports = router;