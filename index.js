const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4mmlf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

async function run() {
  try {
    const allUserTaskCollection = client.db('donezoDB').collection('allUserTask');
    const allUserDataCollection = client.db('donezoDB').collection('allUserData');

    // User-related endpoints
    app.post("/allUserData", async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        const existingUser = await allUserDataCollection.findOne({ email });
        if (existingUser) {
          return res.status(200).json(existingUser);
        }
        
        const result = await allUserDataCollection.insertOne(req.body);
        const savedUser = await allUserDataCollection.findOne({ _id: result.insertedId });
        res.status(201).json(savedUser);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Task-related endpoints
    app.get('/tasks/:email', async (req, res) => {
      try {
        const { email } = req.params;
        if (!email) {
          return res.status(400).json({ error: 'Email is required' });
        }

        const tasks = await allUserTaskCollection.find({ email }).toArray();
        res.status(200).json(tasks);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/tasks', async (req, res) => {
      try {
        const { email, title, category } = req.body;
        if (!email || !title || !category) {
          return res.status(400).json({ error: 'Email, title, and category are required' });
        }

        const task = { 
          ...req.body, 
          timestamp: new Date(),
          createdAt: new Date()
        };
        const result = await allUserTaskCollection.insertOne(task);
        const savedTask = await allUserTaskCollection.findOne({ _id: result.insertedId });
        res.status(201).json(savedTask);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.patch('/tasks/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid task ID' });
        }

        const updateData = req.body;
        const result = await allUserTaskCollection.updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: { 
              ...updateData,
              updatedAt: new Date()
            } 
          }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.delete('/tasks/:id', async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid task ID' });
        }

        const result = await allUserTaskCollection.deleteOne({ _id: new ObjectId(id) });
        
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB!");
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get('/', (req, res) => res.send('Task Manager API'));
app.listen(port, () => console.log(`Server running on port: ${port}`));