import { MongoClient, ObjectId } from "mongodb";
import express from "express";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wanderlust");
const destinationCollection = db.collection("destination");
const bookingCollection = db.collection("booking");

const verifyToken =async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
      return res.status(401).send({ msg: "Unauthorized access" });
    }
    const token = authHeader.split(" ")[1];
    
    if(!token) {
      return res.status(401).send({ msg: "Unauthorized access" });
    }

    const JWKS = createRemoteJWKSet( new URL('http://localhost:3000/api/auth/jwks'))
    const {payload} = await jwtVerify(token, JWKS);

    try {
      const { payload } = await jwtVerify(token, JWKS);
    } catch (error) {
      return res.status(500).send({ msg: "Error verifying token" });
    }









    console.log(payload);
    next();
  };


//** http://localhost:5000/add_destinations
app.post("/add_destinations", async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.get("/destinations", async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
});

app.get("/destination/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send({ result });
});

app.patch("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const UpdatedData = req.body;
  const result = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: UpdatedData },
  );
  res.json(result);
});

app.delete("/destination/:id", async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
});

app.post("/booking", async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.get("/my-bookings/:email", async (req, res) => {
  const { email } = req.params;
  const result = await bookingCollection.find({ email: email }).toArray();

  res.send(result);
});

app.delete("/my-bookings/:id", async (req, res) => {
  const { id } = req.params;

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid booking id" });
  }

  try {
    const bookingId = new ObjectId(id);
    const result = await bookingCollection.deleteOne({
      $or: [{ _id: bookingId }, { _id: id }],
    });

    if (result.deletedCount === 0) {
      console.log("Booking ID was not found:", id);
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({
      message: "Booking cancelled successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error while cancelling booking" });
  }
});

app.get("/", (req, res) => {
  res.send({ message: `server is running fint!` });
});

app.listen(PORT, () => {
  console.log(`server is runnint at: ${PORT}`);
});
