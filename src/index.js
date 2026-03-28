import express from "express";
import { config } from "./configs/config.js";
import router from "./router.js";
import cors from "cors"
// import "./features/2d_result/cron_job.js";


const app = express();


const allowedOrigins = ["*"];

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  console.log("Hello world")
  res.json("This is testing")
})
app.use("/api/v1", router);
app.get("/test", (req, res) => {
  console.log("Uploads : ", req.params)
  res.send("KO kO")
})

console.log("App.JS port : ", config.PORT)


const PORT = config.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});