import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { addOrUpdateRating, getMyRatings, getRatingsForMovie, deleteRating, getTopRated } from "../controllers/ratings.controller.js";

const router = express.Router();

router.post("/", authenticateToken, addOrUpdateRating);
router.get("/me", authenticateToken, getMyRatings);

router.get("/top", getTopRated);

router.get("/:imdb_id", getRatingsForMovie);
router.delete("/:imdb_id", authenticateToken, deleteRating);



export default router;
