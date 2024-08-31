// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const job = require("./cron");

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(
  "mongodb+srv://poojarydeepak15:yashmith@cluster0.0rohejj.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});
job.start();
// Journal Entry Schema
const journalEntrySchema = new mongoose.Schema({
  date: {
    type: Date,
    unique: true, // Ensure that each date has only one entry
    required: true,
  },
  note: {
    type: String,
    required: true,
  },
});

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

// Routes

// Get note by date
app.get("/journal/:date", async (req, res) => {
  const { date } = req.params;
  console.log(date);
  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1); // Move to the next day to create a date range

    const entry = await JournalEntry.findOne({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    });

    if (!entry) {
      return res.status(404).json({ message: "No entry found for this date" });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new note
app.post("/journal", async (req, res) => {
  const { date, note } = req.body;
  try {
    const newEntry = new JournalEntry({ date: new Date(date), note });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a note by date
app.put("/journal/:date", async (req, res) => {
  const { date } = req.params;
  const { note } = req.body;

  try {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1); // Move to the next day to create a date range

    const updatedEntry = await JournalEntry.findOneAndUpdate(
      {
        date: {
          $gte: startDate,
          $lt: endDate,
        },
      },
      { note },
      { new: true, runValidators: true }
    );

    if (!updatedEntry) {
      return res.status(404).json({ message: "No entry found for this date" });
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a note by date
app.delete("/journal/:date", async (req, res) => {
  const { date } = req.params;
  try {
    const deletedEntry = await JournalEntry.findOneAndDelete({
      date: new Date(date),
    });
    if (!deletedEntry) {
      return res.status(404).json({ message: "No entry found for this date" });
    }
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
