require('dotenv').config();
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

dns.setDefaultResultOrder('ipv4first');

// ── Config ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb+srv://Forever_Task:Forever_Task_2026@forevertask.bfswoul.mongodb.net/TaskFlowDB?retryWrites=true&w=majority';

// ── MongoDB Setup ───────────────────────────────────────
let collection;

const dbReady = (async () => {
    const client = new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 30000,
        family: 4,
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    const db = client.db('TaskFlowDB');
    collection = db.collection('tasks');
    console.log('MongoDB connected ✅');
})();

// ── Express App ─────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/check', async (_req, res) => {
    try {
        await dbReady;
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false });
    }
});

// Get all tasks
app.get('/api/tasks', async (_req, res) => {
    try {
        await dbReady;
        const tasks = await collection.find({}).sort({ position: 1 }).toArray();
        res.json(tasks.map((t) => ({ ...t, _id: t._id.toString() })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to load tasks' });
    }
});

// Add a task
app.post('/api/tasks', async (req, res) => {
    try {
        await dbReady;
        const doc = {
            name: req.body.name,
            stage: req.body.stage,
            parent: req.body.parent || null,
            urgent: false,
            position: Date.now(),
            created: new Date(),
        };
        const result = await collection.insertOne(doc);
        res.json({ id: result.insertedId.toString() });
    } catch (e) {
        res.status(500).json({ error: 'Failed to add task' });
    }
});

// Bulk-update multiple tasks (must be above /:id route)
app.put('/api/tasks/multiple', async (req, res) => {
    try {
        await dbReady;
        const updates = req.body.updates || [];
        const bulkOps = updates.map((u) => ({
            updateOne: {
                filter: { _id: new ObjectId(u.id) },
                update: { $set: u.changes },
            },
        }));
        if (bulkOps.length > 0) await collection.bulkWrite(bulkOps);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update multiple tasks' });
    }
});

// Update a single task
app.put('/api/tasks/:id', async (req, res) => {
    try {
        await dbReady;
        const result = await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body.updates }
        );
        res.json({ success: result.modifiedCount > 0 });
    } catch (e) {
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Delete a task + its subtasks
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await dbReady;
        await collection.deleteMany({
            $or: [
                { _id: new ObjectId(req.params.id) },
                { parent: req.params.id },
            ],
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// ── Start ───────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
