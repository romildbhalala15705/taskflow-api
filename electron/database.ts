import { MongoClient, ObjectId } from 'mongodb';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const uri = "mongodb+srv://Forever_Task:Forever_Task_2026@forevertask.bfswoul.mongodb.net/TaskFlowDB?retryWrites=true&w=majority";

let client: MongoClient;
let db: any;
let collection: any;
let dbReady: Promise<void>;

async function initDB() {
    try {
        client = new MongoClient(uri, {
            serverSelectionTimeoutMS: 30000,
            family: 4
        });

        await client.connect();
        await client.db("admin").command({ ping: 1 });

        db = client.db("TaskFlowDB");
        collection = db.collection("tasks");

        console.log("DB READY ✅");
    } catch (err) {
        console.error("Mongo Error:", err);
        throw err;
    }
}

// start connection immediately
dbReady = initDB();

export function registerDbIpcHandlers(ipcMain: any) {
    ipcMain.handle('db:check', async () => {
        try {
            await dbReady;
            return true;
        } catch (e: any) {
            console.error(e);
            return false;
        }
    });

    ipcMain.handle('db:loadTasks', async () => {
        try {
            await dbReady;
            const tasks = await collection.find({}).sort({ position: 1 }).toArray();
            return tasks.map((t: any) => ({ ...t, _id: t._id.toString() }));
        } catch (e: any) {
            console.error(e);
            return [];
        }
    });

    ipcMain.handle('db:addTask', async (_: any, data: any) => {
        try {
            await dbReady;
            const doc = {
                name: data.name,
                stage: data.stage,
                parent: data.parent || null,
                urgent: false,
                position: Date.now(),
                created: new Date()
            };
            const result = await collection.insertOne(doc);
            return { id: result.insertedId.toString() };
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    });

    ipcMain.handle('db:updateTask', async (_: any, args: any) => {
        try {
            await dbReady;
            const { id, updates } = args;
            const result = await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updates }
            );
            return result.modifiedCount > 0;
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    });

    ipcMain.handle('db:deleteTask', async (_: any, id: string) => {
        try {
            await dbReady;
            await collection.deleteMany({
                $or: [
                    { _id: new ObjectId(id) },
                    { parent: id }
                ]
            });
            return true;
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    });

    ipcMain.handle('db:updateMultiple', async (_: any, updates: any[]) => {
        try {
            await dbReady;
            const bulkOps = updates.map((update: any) => ({
                updateOne: {
                    filter: { _id: new ObjectId(update.id) },
                    update: { $set: update.changes }
                }
            }));

            if (bulkOps.length > 0) {
                await collection.bulkWrite(bulkOps);
            }
            return true;
        } catch (e: any) {
            console.error(e);
            throw e;
        }
    });
}

// Mobile Express API
export async function initMobileApi() {
    const express = (await import('express')).default;
    const cors = (await import('cors')).default;
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/api/check', async (_req: any, res: any) => {
        try {
            await dbReady;
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ success: false });
        }
    });

    app.get('/api/tasks', async (_req: any, res: any) => {
        try {
            await dbReady;
            const tasks = await collection.find({}).sort({ position: 1 }).toArray();
            res.json(tasks.map((t: any) => ({ ...t, _id: t._id.toString() })));
        } catch (e) {
            res.status(500).json({ error: 'Failed to load tasks' });
        }
    });

    app.post('/api/tasks', async (req: any, res: any) => {
        try {
            await dbReady;
            const doc = {
                name: req.body.name,
                stage: req.body.stage,
                parent: req.body.parent || null,
                urgent: false,
                position: Date.now(),
                created: new Date()
            };
            const result = await collection.insertOne(doc);
            res.json({ id: result.insertedId.toString() });
        } catch (e) {
            res.status(500).json({ error: 'Failed to add task' });
        }
    });

    app.put('/api/tasks/multiple', async (req: any, res: any) => {
        try {
            await dbReady;
            const updates = req.body.updates || [];
            const bulkOps = updates.map((update: any) => ({
                updateOne: {
                    filter: { _id: new ObjectId(update.id) },
                    update: { $set: update.changes }
                }
            }));
            if (bulkOps.length > 0) {
                await collection.bulkWrite(bulkOps);
            }
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Failed to update multiple tasks' });
        }
    });

    app.put('/api/tasks/:id', async (req: any, res: any) => {
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

    app.delete('/api/tasks/:id', async (req: any, res: any) => {
        try {
            await dbReady;
            await collection.deleteMany({
                $or: [
                    { _id: new ObjectId(req.params.id) },
                    { parent: req.params.id }
                ]
            });
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: 'Failed to delete task' });
        }
    });

    app.listen(5175, '0.0.0.0', () => {
        console.log('Mobile API running on port 5175');
    });
}
