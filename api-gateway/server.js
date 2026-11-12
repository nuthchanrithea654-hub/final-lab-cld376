
require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Microservice URLs
const REGISTRATION_URL =
  process.env.REGISTRATION_URL || "http://localhost:3001";

const LOGIN_URL =
  process.env.LOGIN_URL || "http://localhost:3002";

// Health Check
app.get("/health", (req, res) => {
  res.json({
    service: "API Gateway",
    status: "Running"
  });
});

// Forward requests to microservices
app.use(async (req, res) => {
  let target;

  if (
    req.path === "/register" ||
    req.path.startsWith("/students/")
  ) {
    target = REGISTRATION_URL;
  } else if (req.path === "/login") {
    target = LOGIN_URL;
  } else {
    return res.status(404).json({
      message: "Route not found"
    });
  }

  try {
    const config = {
      method: req.method,
      url: target + req.originalUrl,
      timeout: 10000,
      validateStatus: () => true
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      config.data = req.body;
    }

    const response = await axios(config);

    res.status(response.status).send(response.data);

  } catch (error) {
    console.error("Gateway error:", error.message);

    res.status(502).json({
      message: "Microservice unavailable"
    });
  }
});

// Start API Gateway
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API Gateway running on port ${PORT}`);
});
