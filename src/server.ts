import express, { Request, Response } from "express";
import cors from "cors";
const cookieParser = require("cookie-parser");

import { logReqResp } from "./middleware";

/// Importing Routes
import authRoute from "./routes/auth.route";
import userRoute from "./routes/user.route";
import artistRoute from "./routes/artist.route";
import albumRoute from "./routes/album.route";
import songRoute from "./routes/song.route";
import playlistRoute from "./routes/playlist.route";
import playlistSongRoute from "./routes/playlistSong.route";
import ratingRoute from "./routes/rating.route";
import subscriptionRoute from "./routes/subscription.route";
import paymentRoute from "./routes/payment.route";

const app = express();
const port = process.env.PORT || 8001;

/// MiddleWare...

const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? "").split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(cookieParser("my_secret"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logReqResp("log.txt"));
// Routes
app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/artist", artistRoute);
app.use("/album", albumRoute);
app.use("/song", songRoute);
app.use("/playlist", playlistRoute);
app.use("/playlistsong", playlistSongRoute);
app.use("/rating", ratingRoute);
app.use("/subscription", subscriptionRoute);
app.use("/payment", paymentRoute);

app.get("/", (req: Request, resp: Response) => {
  resp.send("Application is running Successfully...");
});

app.listen(port, () => {
  console.log(`Application is successfully running at port ${port}`);
});
