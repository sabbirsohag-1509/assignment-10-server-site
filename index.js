const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mycluster.eyaxb6h.mongodb.net/?appName=myCluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const myDB = client.db("homeNest");
    const propertiesCollection = myDB.collection("properties");

    //POST
    app.post("/properties", async (req, res) => {
      const newProperty = req.body;
      const result = await propertiesCollection.insertOne(newProperty);
      res.send(result);
    });

    //GET
    app.get("/properties", async (req, res) => {
      const result = await propertiesCollection.find().toArray();
      res.send(result);
    });

    //GET latest-6 properties
    app.get("/latest-properties", async (req, res) => {
      const result = await propertiesCollection
        .find()
        .sort({ postedDate: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    //FindONe
    app.get("/propertyDetails/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertiesCollection.findOne(query);
      res.send(result);
    });

    //get by email
    app.get("/my-properties", async (req, res) => {
      const email = req.query.email;
      const result = await propertiesCollection
        .find({ userEmail: email })
        .toArray();
      res.send(result);
    });

    //Patch
    app.patch("/properties/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProperty = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          ...updatedProperty,
        },
      };
      const options = {};
      const result = await propertiesCollection.updateOne(
        query,
        update,
        options
      );
      res.send(result);
    });

    //Delete
    app.delete("/properties/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertiesCollection.deleteOne(query);
      res.send(result);
    });

    //search api
    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      if (search_text) {
        const result = await propertiesCollection
          .find({ propertyName: { $regex: search_text, $options: "i" } })
          .toArray();
        res.send(result);
      } else {
        const result = await propertiesCollection.find().limit(6).toArray();
        res.send(result);
      }
    });

    // Sort API
    app.get("/sort-properties", async (req, res) => {
      try {
        const sort = req.query.sort;
        const limit = parseInt(req.query.limit) || 6; // default: 6 ta data
        let sortStage = {};

        // Sorting logic
        if (sort === "priceLow") sortStage = { numericPrice: 1 };
        else if (sort === "priceHigh") sortStage = { numericPrice: -1 };
        else if (sort === "dateNew") sortStage = { postedDate: -1 };
        else if (sort === "dateOld") sortStage = { postedDate: 1 };

        // Aggregate pipeline
        const result = await propertiesCollection
          .aggregate([
            {
              $addFields: {
                numericPrice: { $toDouble: "$price" },
              },
            },
            {
              $sort: sortStage,
            },
            {
              $limit: limit,
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Sort API error:", error);
        res.status(500).send({ message: "Server Error", error });
      }
    });







    

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
