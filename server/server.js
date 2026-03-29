require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const Contact = require("./models/Contact");

const app = express();
const PORT = process.env.PORT || 5001;

app.disable("x-powered-by");
app.set("trust proxy", 1);

// ---------- Allowed origins ----------
const allowedOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ---------- Security middleware ----------
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow non-browser tools and same-machine testing without origin header
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed for this origin"));
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);

app.use(express.json({ limit: "20kb" }));

// ---------- Rate limiters ----------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many contact requests. Please try again later." }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." }
});

app.use(generalLimiter);

// ---------- MongoDB ----------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));

// ---------- Helpers ----------
const createToken = (username) => {
  return jwt.sign({ username }, process.env.JWT_SECRET, {
    expiresIn: "1d"
  });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized. Invalid or expired token."
    });
  }
};

const sanitizeInput = (value) => {
  return String(value || "").trim();
};

// ---------- Health route ----------
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running"
  });
});

// ---------- Contact route ----------
app.post("/send-message", contactLimiter, async (req, res) => {
  const name = sanitizeInput(req.body.name);
  const email = sanitizeInput(req.body.email);
  const subject = sanitizeInput(req.body.subject);
  const message = sanitizeInput(req.body.message);

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (name.length > 100 || email.length > 150 || subject.length > 150 || message.length > 3000) {
    return res.status(400).json({ message: "Input is too long." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  try {
    const newContact = new Contact({
      name,
      email,
      subject,
      message
    });

    await newContact.save();

  /*  const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const ownerMail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <h3>New Contact Form Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `
    };

    const userMail = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Message Received Successfully",
      html: `
        <h3>Thank you for contacting me, ${name}!</h3>
        <p>Your message has been received successfully.</p>
        <p>I will get back to you soon.</p>
      `
    };

    await transporter.sendMail(ownerMail);
    await transporter.sendMail(userMail);
*/
    return res.status(200).json({
      message: "Message sent successfully and saved to database!"
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      message: "Failed to send message."
    });
  }
});

// ---------- Admin login ----------
app.post("/api/admin/login", loginLimiter, async (req, res) => {
  try {
    const username = sanitizeInput(req.body.username);
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const token = createToken(username);

    return res.status(200).json({
      message: "Login successful",
      token
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      message: "Server error during login"
    });
  }
});

// ---------- Protected message list ----------
app.get("/api/messages", verifyToken, async (req, res) => {
  try {
    const search = sanitizeInput(req.query.search);
    const status = sanitizeInput(req.query.status || "all");

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    if (status === "read") {
      query.isRead = true;
    } else if (status === "unread") {
      query.isRead = false;
    }

    const messages = await Contact.find(query).sort({ createdAt: -1 });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Fetch messages error:", error);
    return res.status(500).json({
      message: "Failed to fetch messages"
    });
  }
});

// ---------- Mark read/unread ----------
app.patch("/api/messages/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isRead = Boolean(req.body.isRead);

    const updatedMessage = await Contact.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    return res.status(200).json({
      message: "Message updated successfully",
      updatedMessage
    });
  } catch (error) {
    console.error("Update read status error:", error);
    return res.status(500).json({
      message: "Failed to update message status"
    });
  }
});

// ---------- Delete message ----------
app.delete("/api/messages/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMessage = await Contact.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    return res.status(200).json({
      message: "Message deleted successfully"
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).json({
      message: "Failed to delete message"
    });
  }
});

// ---------- Global error handler ----------
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      message: "CORS blocked this request."
    });
  }

  console.error("Unhandled server error:", err);
  return res.status(500).json({
    message: "Something went wrong on the server."
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});