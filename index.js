const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 4000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log(`server is running...`);
});

app.listen(port, () => {
  console.log(`Server is running successfully at http://localhost:${port}`);
});
