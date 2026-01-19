import { db } from "../database/db.js";

// GET /api/reviews?movie_id=123
export const getReviews = async (req, res) => {
  const movie_id = req.query.movie_id;
  if (!movie_id) return res.status(400).json({ error: "movie_id is required" });

  try {
    const [reviews] = await db.query(
      `SELECT r.id, r.user_id, r.movie_id, r.content, r.rating, r.created_at, u.username
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC`,
      [movie_id]
    );
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/reviews
export const addReview = async (req, res) => {
  const user_id = req.user.id; // použijeme authenticateToken middleware
  const { movie_id, content, rating } = req.body;

  if (!movie_id || !content) return res.status(400).json({ error: "movie_id and content required" });

  try {
    const [result] = await db.query(
      `INSERT INTO reviews (user_id, movie_id, content, rating)
       VALUES (?, ?, ?, ?)`,
      [user_id, movie_id, content, rating || null]
    );

    res.status(201).json({ message: "Review added", reviewId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// DELETE /api/reviews/:reviewId
export const deleteReview = async (req, res) => {
  const userId = req.user.id; // z authenticateToken middleware
  const { reviewId } = req.params;

  try {
    // najprv vyber recenziu
    const [rows] = await db.query("SELECT * FROM reviews WHERE id = ?", [reviewId]);
    if (rows.length === 0) return res.status(404).json({ error: "Review not found" });

    const review = rows[0];

    // kontrola vlastníctva
    if (review.user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    // vymaz recenziu
    await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
