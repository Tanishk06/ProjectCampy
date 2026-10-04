import dotenv from "dotenv"; //Index.js is an entry (port and listening)
import app from "./app.js";
import connectDB from "./db/dbindex.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
