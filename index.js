const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()

const port = 5000;
const app = express();
app.use(bodyParser.json());
app.use(cors());

var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.yetxo.mongodb.net:27017,cluster0-shard-00-01.yetxo.mongodb.net:27017,cluster0-shard-00-02.yetxo.mongodb.net:27017/${process.env.DB_NAME}?ssl=true&replicaSet=atlas-8altey-shard-0&authSource=admin&retryWrites=true&w=majority`;


var serviceAccount = require("./configs/burj-al-arab-4c327-firebase-adminsdk-av6kt-66bbbb1ef7.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.DB_URL
});

MongoClient.connect(uri, { useUnifiedTopology: true }, function (err, client) {
    const bookings = client.db("BurjAlArab").collection("Bookings");
    app.post("/addBooking", (req, res) => {
        const newBook = req.body;
        bookings.insertOne(newBook)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail === queryEmail) {
                        bookings.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send('unauthorized access');
                    }
                }).catch(function (error) {
                    res.status(401).send('unauthorized access');
                });
        }
        else {
            res.status(401).send('unauthorized access');
        }
    })

});
app.listen(port);