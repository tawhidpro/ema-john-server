const express = require('express')
const admin = require("firebase-admin");
const port = 5000;
require('dotenv').config();

const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeApp } = require('firebase-admin/app');

const app = express();
app.use(cors());
app.use(bodyParser.json());
const { getAuth } = require('firebase-admin/auth');


const { MongoClient } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qwylk.mongodb.net/bookingApp?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });



var serviceAccount = require("./configs/ema-john-ecommerce-b9d71-firebase-adminsdk-9gh99-ddf8b867c2.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


client.connect(err => {
  const bookings = client.db("bookingApp").collection("booking");
  const productsCollection = client.db("ema-john-store").collection("products");
  const ordersCollection = client.db("ema-john-store").collection("order");
  // perform actions on the collection object
  app.post('/addBooking',(req,res) =>{
     const newBooking = req.body;  
     bookings.insertOne(newBooking)
     .then(result => {
        res.send(result.acknowledged);
    })
  })

  app.post('/addProduct',(req,res) =>{
    const newProduct = req.body;  
    productsCollection.insertMany(newProduct)
    .then(result => {
       res.send(result.acknowledged);
      //  console.log(result)
   })
  // console.log(newProduct)
 })

 app.get('/products',(req,res)=>{
   productsCollection.find({}).limit(30)
   .toArray((err,document)=>{
     res.send(document)
   })
 })
 app.get('/product/:key',(req,res)=>{
   productsCollection.find({key: req.params.key})
   .toArray((err,document)=>{
     res.send(document[0])
   })
 })

 app.post('/productsByKey',(req,res)=>{
   const productskey = req.body;
   console.log(productskey);
   productsCollection.find({key: {$in : productskey}})
   .toArray((err,document)=>{
     res.send(document);
   })
 })
  
  app.get('/bookings',(req,res)=>{
    const bearer = req.headers.authorization;
    if(bearer && bearer.startsWith('Bearer ')){
      const idToken = bearer.split(' ')[1];
      console.log({idToken});

      getAuth()
      .verifyIdToken(idToken)
      .then((decodedToken) => {
        let tokenEmail = decodedToken.email;
        let queryEmail = req.query.email;
        console.log({tokenEmail,queryEmail});
        if(tokenEmail === queryEmail){
          bookings.find({userEmail: req.query.email})
          .toArray((err,document)=>{
              res.send(document);
          })
        }
        // ...
      })
      .catch((error) => {
        // Handle error
      });
    }
      // console.log(req.headers.authorization);
  })

  app.post('/addOrder',(req,res) =>{
    const order = req.body;  
    ordersCollection.insertOne(order)
    .then(result => {
       res.send(result.acknowledged);
   })
 })


});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})