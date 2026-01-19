// controllers/leaderboard.controller.js
import { db } from "../database/db.js";

// Funkcia na priradenie hodnosti podľa počtu hlasov
function getRank(votes) {
  if (votes >= 40) return "👑 Cinema Legend";
  if (votes >= 20) return "⭐ Movie Master";
  if (votes >= 10) return "🎥 Movie Analyst";
  if (votes >= 5) return "🍿 Cinema Explorer";
  return "🎬 Movie Rookie";
}

// GET /api/leaderboard?type=all|movie|series
export const getLeaderboard = async (req, res) => {
  const type = req.query.type || "all";
  console.log("===== Leaderboard Request =====");
  console.log("Requested type:", type);

  // Dynamické ORDER BY podľa typu
  let orderBy;
  if (type === "movie") orderBy = "movie_votes";
  else if (type === "series") orderBy = "series_votes";
  else orderBy = "movie_votes + series_votes";

  const sql = `
    SELECT u.id, u.username,
      COALESCE(SUM(CASE WHEN r.type = 'movie' THEN 1 ELSE 0 END), 0) AS movie_votes,
      COALESCE(SUM(CASE WHEN r.type = 'series' THEN 1 ELSE 0 END), 0) AS series_votes
    FROM users u
    LEFT JOIN ratings r ON r.user_id = u.id
    GROUP BY u.id, u.username
    ORDER BY ${orderBy} DESC
    LIMIT 10;
  `;

  console.log("SQL query to execute:\n", sql);

  try {
    const [results] = await db.query(sql); // async/await
    console.log("✅ Query results:", results);

    const leaderboard = results.map((user) => {
      let votes;
      if (type === "movie") votes = user.movie_votes;
      else if (type === "series") votes = user.series_votes;
      else votes = Number(user.movie_votes) + Number(user.series_votes);

      console.log(
        `User ${user.username} => movie_votes: ${user.movie_votes}, series_votes: ${user.series_votes}, counted votes: ${votes}`
      );

      return {
        id: user.id,
        username: user.username,
        votes_count: Number(votes),
        rank: getRank(Number(votes)),
      };
    });

    console.log("Final leaderboard:", leaderboard);
    res.json(leaderboard);
  } catch (err) {
    console.error("❌ Leaderboard query error:", err);
    res.status(500).json({ error: err.message });
  }
};
