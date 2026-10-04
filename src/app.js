import express from "express"; //App.js contains all express code
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//basic config
app.use(express.json({ limit: "16kb" })); //"If a request contains JSON, parse it so my JavaScript code can use it."
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // does the same job as express.json but fo rurl encoded data
app.use(express.static("public")); //"Files inside the public folder can be served directly to the browser."
app.use(cookieParser());
//cors configs
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
    credentials: true, //This allows the browser to include credentials in cross-origin requests, such as cookies.
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], //This tells CORS which HTTP methods are allowed.
    allowedHeaders: ["Content - Type", "Authorization"], //"Requests from the allowed origins may use these HTTP headers."
  }),
);

import { router } from "./routes/healthCheckRouter.js";
import authRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js"

app.use("/api/v1/healthcheck", router);
app.use("/api/v1/auth", authRouter); //Whenever a request starts with /api/v1/auth, send it to authRouter. Ex - fetch("http://localhost:3000/api/v1/auth/register"
app.use("/api/v1/projects" , projectRouter)

app.get("/", (req, res) => {
  res.send("Welcome to ProjectCamp");
});

export default app;
