const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken")
require("dotenv").config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();


app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.n72f5gi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


app.get("/", (req, res) => {
    res.send("Server is running")
})

const verifyJWT = async(req,res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader){
        return res.status(401).send({message: "unauthorized access"})
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) =>{
        if(err){
            return res.status(401).send({ message: "unauthorized access" })
        }
        req.decoded = decoded;
        next()
    })
}

const server = async() => {
    try {
        const Products = client.db("mongoCrudDb").collection("products");
        const Orders = client.db("mongoCrudDb").collection("orders");

        app.post("/jwt", async(req,res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN)
            res.send({token})
        })

        app.get("/products", async(req, res) => {
            const query = {}
            const cursor = Products.find(query);
            const products = await cursor.toArray();
            res.send(products)
        })
        app.get("/products/:id", verifyJWT, async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const product = await Products.findOne(query);
            res.send(product)
        })

        app.post("/products", verifyJWT, async(req, res) => {
            const data = req.body;
            const product = await Products.insertOne(data)
            res.send(product)
        })

        app.post("/orders", verifyJWT, async(req, res) => {
            const data = req.body;
            const order = await Orders.insertOne(data)
            res.send(order)
        })

        app.get("/orders/:id", verifyJWT, async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await Orders.findOne(query);
            res.send(order)
        })

        app.get("/orders", verifyJWT, async(req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email){
                return res.status(401).send({ message: "unauthorized access" })
            }
            let query = {}
            if (req.query.email){
                query = {
                    email: req.query.email
                }
            }
            const cursor =  Orders.find(query)
            const orders =  await cursor.toArray()
            res.send(orders)
        })

        app.put("/orders/:id", verifyJWT, async(req, res) => {
            const order = req.body;
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const option = { upsert: true };
            const updatedOrder = {
                $set: {
                    name: order.name,
                    email: order.email,
                    phone: order.phone
                }
            }
            const result = await Orders.updateOne(query, updatedOrder, option);
            res.send(result)
        })

        app.delete("/orders/:id", verifyJWT, async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const order = await Orders.deleteOne(query);
            res.send(order)
        })

    }
    finally{

    }
}
server().catch((error) => console.log(error)) 

app.listen(5000, () => console.log("Mongo crud db server is running"))