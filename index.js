const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()

const port = 5000;
const admin = require("firebase-admin");
const app = express();

app.use(cors());
app.use(express.json());

var serviceAccount = require("./configs/burj-al-arab-8012e-firebase-adminsdk-r09yf-86f56bf2df.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.t1m6g.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  console.log(err);
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      console.log({ idToken });
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);
          if ((tokenEmail == queryEmail)) {
            bookings
              .find({ email: queryEmail })
              .toArray((err, documents) => {
                // console.log(documents)
                res.status(200).send(documents);
              });
          }
          else {
            res.status(401).send('un-authorized access')
          }
         
        })
        .catch((err) => {
          res.status(401).send('un-authorized access')
        });
    }
    else {
      res.status(401).send('un-authorized access')
    }
    
  });
});

app.listen(port);
