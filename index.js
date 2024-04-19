const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wwcicg7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });

    const userCollection = client.db("ShilaHotelDB").collection("users");
    const roomCollection = client.db("ShilaHotelDB").collection("rooms");
    const bookingCollection = client.db("ShilaHotelDB").collection("bookings");

    // jwt apis related routes
    app.post("/jwt", async (req, res) => {
      const user = req.body;

      // generate token
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRECT, {
        expiresIn: "24h",
      });

      res.send({ token });
    });

    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        res.status(401).send({ message: "unauthorized access" });
      }

      const token = req.headers.authorization.split(" ")[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRECT, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // verify token after verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // verify admin
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);

      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }

      res.send({ admin });
    });

    // users collection apis routes
    app.get("/users", verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const userData = req.body;

      const query = { email: userData.email };
      const existsEmail = await userCollection.findOne(query);
      if (existsEmail) {
        return res.send({ message: "user already in exists" });
      }

      const result = await userCollection.insertOne(userData);
      res.send(result);
    });

    app.patch(
      "/users/admin/:id",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };

        const updatedDoc = {
          $set: {
            role: "admin",
          },
        };

        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      }
    );

    app.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // rooms collections apis routes
    app.get("/rooms", async (req, res) => {
      const result = await roomCollection.find().toArray();
      res.send(result);
    });

    app.get("/rooms/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomCollection.findOne(query);
      res.send(result);
    });

    // bookings collection apis route
    app.get("/bookings", verifyToken, async (req, res) => {
      const email = req.query.email;

      const query = { email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", verifyToken, async (req, res) => {
      const bookingItem = req.body;

      const query = { room_id: bookingItem?.room_id };
      const existsBookings = await bookingCollection.findOne(query);
      if (existsBookings) {
        return res.send({ message: "bookings already exists" });
      }

      console.log(query, existsBookings);

      const result = await bookingCollection.insertOne(bookingItem);
      res.send(result);
    });

    app.delete("/bookings/:id", verifyToken, async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running...");
});

app.listen(port, () => {
  console.log(`server is running successfully at http://localhost:${port}`);
});
