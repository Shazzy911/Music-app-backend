import express from "express";
import { upload } from "../lib/multer-config";
import {
  getAllArtist,
  createArtist,
  getArtistById,
  updateArtistById,
  deleteArtistById,
} from "../controller/artist.controller";

import { createArtistImages } from "../controller/artistImage.controller";

const router = express.Router();

router.route("/").get(getAllArtist).post(upload.single("img"), createArtist);
router.post("/:artistId/images", upload.array("images", 5), createArtistImages);

router
  .route("/:id")
  .get(getArtistById)
  .put(updateArtistById)
  .delete(deleteArtistById);
export default router;
