import { MongoClient } from "mongodb";
import express from "express";
import "dotenv/config";
import cors from "cors";

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

//** http://localhost:5000/add_destinations
app.post("/add_destinations", async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  console.log(result);
  res.send(result);
});

app.get(("/destinations"), async(req,res) =>{
  const result = await destinationCollection.find().toArray()
  res.send(result)
})

app.get("/", (req, res) => {
  res.send({ message: `server is running fint!` });
});

app.listen(PORT, () => {
  console.log(`server is runnint at: ${PORT}`);
});
