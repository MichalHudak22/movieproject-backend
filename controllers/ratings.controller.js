import { db } from "../database/db.js";

// Pridať / aktualizovať hodnotenie
export const addOrUpdateRating = async (req, res) => {
  const userId = req.user.id;
  const { imdb_id, type, rating } = req.body;

  if (!imdb_id || !type || rating == null) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // Validácia: rating musí byť číslo medzi 0 a 10
  if (typeof rating !== "number" || rating < 0 || rating > 10) {
    return res.status(400).json({ message: "Rating must be between 0 and 10" });
  }

  // Voliteľne: zaokrúhlenie na 1 desatinné miesto
  const roundedRating = Math.round(rating * 10) / 10;

  try {
    const [existing] = await db.query(
      "SELECT id FROM ratings WHERE user_id = ? AND imdb_id = ?",
      [userId, imdb_id]
    );

    if (existing.length > 0) {
      await db.query(
        "UPDATE ratings SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND imdb_id = ?",
        [roundedRating, userId, imdb_id]
      );
    } else {
      await db.query(
        "INSERT INTO ratings (user_id, imdb_id, type, rating) VALUES (?, ?, ?, ?)",
        [userId, imdb_id, type, roundedRating]
      );
    }

    res.json({ message: "Rating saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Získať hodnotenia používateľa
export const getMyRatings = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT imdb_id, type, rating, created_at, updated_at FROM ratings WHERE user_id = ?",
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Získať hodnotenia konkrétneho filmu/seriálu
export const getRatingsForMovie = async (req, res) => {
  const { imdb_id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT user_id, rating FROM ratings WHERE imdb_id = ?",
      [imdb_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/ratings/:imdb_id
export const deleteRating = async (req, res) => {
  const userId = req.user.id;
  const { imdb_id } = req.params;

  if (!imdb_id) return res.status(400).json({ message: "Missing imdb_id" });

  try {
    await db.query("DELETE FROM ratings WHERE user_id = ? AND imdb_id = ?", [userId, imdb_id]);
    res.status(200).json({ message: "Rating removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



// Získať top hodnotené filmy alebo seriály podľa všetkých používateľov
export const getTopRated = async (req, res) => {
  const { type } = req.query;

  console.log("📥 getTopRated type:", type);

  if (!type || !["movie", "series"].includes(type)) {
    return res.status(400).json({ message: "type must be movie or series" });
  }

  try {
    const [rows] = await db.query(
      `
      SELECT 
        imdb_id,
        type,
        ROUND(AVG(rating), 1) AS averageRating,
        COUNT(*) AS votes
      FROM ratings
      WHERE type = ?
      GROUP BY imdb_id, type
      ORDER BY averageRating DESC
      LIMIT 50
      `,
      [type]
    );

    console.log("✅ topRated rows:", rows);
    res.json(rows);
  } catch (err) {
    console.error("❌ getTopRated error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



