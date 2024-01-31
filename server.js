const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json());

mongoose.connect(
  "mongodb+srv://mayank:mayank@cluster0.dxu2r.mongodb.net/taskManager",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});
// Define MongoDB models (Task, SubTask, User)

const taskSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  due_date: { type: Date, required: true },
  priority: { type: Number, required: true },
  status: {
    type: String,
    enum: ["TODO", "IN_PROGRESS", "DONE"],
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  deleted_at: Date,
});

const Task = mongoose.model("Task", taskSchema);

const subTaskSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  status: { type: Number, enum: [0, 1], default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  deleted_at: Date,
});

const SubTask = mongoose.model("SubTask", subTaskSchema);

const userSchema = new mongoose.Schema({
  phone_number: { type: String, required: true },
  priority: { type: Number, enum: [0, 1, 2], required: true },
});

const User = mongoose.model("User", userSchema);

// Define APIs
// Implement JWT authentication middleware

// POST method to create a new user
app.post("/api/users", async (req, res) => {
  try {
    // Extract data from the request body
    const { phone_number, priority } = req.body;

    // Create a new user instance
    const newUser = new User({
      phone_number,
      priority,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Send a successful response
    res.status(201).json({
      message: "User created successfully",
      user: savedUser,
    });
  } catch (error) {
    // Handle errors and send an error response
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, "687wyiehiuhi@hhgshydg$usgy", (err, user) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
}

// 1. Create task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, due_date, user_id } = req.body;

    const newTask = new Task({
      user_id,
      title,
      description,
      due_date,
      priority: 0,
      status: "TODO",
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 2. Create subtask
app.post("/api/subtasks", async (req, res) => {
  try {
    const { task_id } = req.body;
    const newSubTask = new SubTask({ task_id });
    await newSubTask.save();
    res.status(201).json(newSubTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 3. Get all user tasks
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    // Implement pagination and filtering based on priority, due date, etc.
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 4. Get all user subtasks
app.get("/api/subtasks", authenticateToken, async (req, res) => {
  try {
    const { task_id } = req.query;
    const query = task_id ? { task_id } : {};
    const subtasks = await SubTask.find(query);
    res.status(200).json(subtasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 5. Update task
app.patch("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { due_date, status } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { due_date, status },
      { new: true }
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 6. Update subtask
app.patch("/api/subtasks/:id", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedSubTask = await SubTask.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(updatedSubTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 7. Delete task (soft deletion)
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    res.status(200).json(deletedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 8. Delete subtask (soft deletion)
app.delete("/api/subtasks/:id", authenticateToken, async (req, res) => {
  try {
    const deletedSubTask = await SubTask.findByIdAndUpdate(
      req.params.id,
      { deleted_at: new Date() },
      { new: true }
    );
    res.status(200).json(deletedSubTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


///////////////////////
////////////////////////
// Twilio configuration
const accountSid = 'your-twilio-account-sid';
const authToken = 'your-twilio-auth-token';
const twilioClient = new twilio(accountSid, authToken);

// Function to perform voice calling
async function performVoiceCall(userPhoneNumber) {
  try {
    // Use Twilio to initiate a voice call
    await twilioClient.calls.create({
      to: userPhoneNumber,
      from: 'your-twilio-phone-number',
      url: 'http://your-webhook-url', // replace with your actual webhook URL
      method: 'GET',
    });

    console.log(`Voice call initiated to ${userPhoneNumber}`);
  } catch (error) {
    console.error(`Error initiating voice call: ${error.message}`);
  }
}

// Cron job to check and initiate voice calls
cron.schedule('0 0 * * *', async () => {
  try {
    const tasks = await Task.find({ status: 'TODO', due_date: { $lt: new Date() } })
      .sort({ priority: 1 }); // Sort tasks by priority ascending

    for (const task of tasks) {
      const user = await User.findById(task.user_id);
      if (user) {
        // Check if the user has a valid phone number
        if (user.phone_number) {
          // Perform voice call
          await performVoiceCall(user.phone_number);
        }
      }
    }
  } catch (error) {
    console.error(`Error in cron job: ${error.message}`);
  }
});
////////////////////////
///////////////////////

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
