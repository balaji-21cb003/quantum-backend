const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const { PythonShell } = require("python-shell");
const axios = require("axios");

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect("mongodb://localhost:27017/quantum", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true, // Add this line to fix deprecation warning
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    access: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "userdetail", timestamps: true }
);

const User = mongoose.model("User", userSchema);

// app.post("/api/execute-python", async (req, res) => {
//   try {
//     const { code } = req.body;
//     console.log("Received code:", code);

//     // Execute Python code using PythonShell
//     PythonShell.runString(code, null, (err, result) => {
//       if (err) {
//         res.status(500).json({ error: err.message });
//       } else {
//         res.status(200).json({ output: result.join("\n") });
//       }
//     });
//   } catch (error) {
//     console.error("Error executing Python code:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// Endpoint to execute Python code
app.post("/api/execute-python", async (req, res) => {
  try {
    const { code } = req.body;
    console.log("Received code:", code);

    // Get the Python executable path from environment variables
    const pythonPath = process.env.PYTHON_PATH;

    // Check if the pythonPath is set
    if (!pythonPath) {
      console.error("Python path is not set in environment variables");
      return res.status(500).json({ error: "Python path is not set" });
    }

    // Specify Python executable path and execute Python code using PythonShell
    PythonShell.runString(code, { pythonPath }, (err, result) => {
      if (err) {
        console.error("Error executing Python code:", err);
        return res.status(500).json({ error: "Error executing Python code" });
      }
      res.status(200).json({ output: result.join("\n") });
    });
  } catch (error) {
    console.error("Error executing Python code:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/user-requests", async (req, res) => {
  try {
    const requests = await User.find();
    res.json(requests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/user-requests", async (req, res) => {
  try {
    const { name, email } = req.body;
    const newUser = new User({ name, email });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error saving user to database:", error); // Log the error
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/user-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { access: true });
    res.json({ message: "User request updated successfully" });
  } catch (error) {
    console.error("Error updating user request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/user-requests/:id/deny", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { access: false });
    res.json({ message: "Access denied successfully" });
  } catch (error) {
    console.error("Error denying access:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/user-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "User request deleted successfully" });
  } catch (error) {
    console.error("Error deleting user request:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
