import express from "express";
import { getReviews, addReview, deleteReview } from "../controllers/reviews.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import { profanityFilter } from "../middleware/profanityFilter.js";

const router = express.Router();

// get all reviews for a movie
router.get("/", getReviews);

// add review (user must be authenticated + profanity filter)
router.post("/", authenticateToken, profanityFilter, addReview);

// delete review (user must be authenticated)
router.delete("/:reviewId", authenticateToken, deleteReview);

export default router;
