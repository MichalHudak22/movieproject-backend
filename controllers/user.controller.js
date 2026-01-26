import { db } from "../database/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from "../utils/mailer.js";


export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // hash hesla
    const hashedPassword = await bcrypt.hash(password, 10);

    // vygenerovať nový verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    console.log("Generated verification token:", verificationToken);

    // kontrola, či email už existuje
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (existing.length > 0) {
      const user = existing[0];

      if (user.is_verified) {
        // už overený používateľ – nemožno registrovať
        return res.status(400).json({ message: "Email already registered" });
      } else {
        // neoverený používateľ – prepíš údaje a token
        await db.query(
          "UPDATE users SET username = ?, password_hash = ?, verification_token = ? WHERE email = ?",
          [username, hashedPassword, verificationToken, email]
        );
      }
    } else {
      // nový používateľ – vlož do DB
      await db.query(
        "INSERT INTO users (username, email, password_hash, verification_token) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, verificationToken]
      );
    }

    // URL pre overenie → **smeruje priamo na backend**
    // URL pre overenie → **smeruje priamo na backend**
    const verificationUrl = `${process.env.API_URL}/api/auth/verify?token=${verificationToken}`;
    console.log("Verification URL sent:", verificationUrl);


    await sendVerificationEmail(email, username, verificationUrl);

    res.status(201).json({
      message: "User registered successfully. Check your email to verify account.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    // rollback pri chybe
    try {
      await db.query("DELETE FROM users WHERE email = ?", [email]);
    } catch (delErr) {
      console.error("Failed to rollback user:", delErr);
    }

    res.status(500).json({ message: "Server error" });
  }
};


export const verifyUser = async (req, res) => {
  const { token } = req.query;

  // Používame backendovú env premennú, nie NEXT_PUBLIC_*
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  if (!token) return res.redirect(`${frontendUrl}/login?verified=0`);

  try {
    const [rows] = await db.query(
      "SELECT id, is_verified FROM users WHERE verification_token = ?",
      [token]
    );

    if (rows.length === 0) {
      return res.redirect(`${frontendUrl}/login?verified=0`);
    }

    const user = rows[0];

    if (!user.is_verified) {
      await db.query(
        "UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?",
        [user.id]
      );
    }

    return res.redirect(`${frontendUrl}/login?verified=1`);
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    return res.redirect(`${frontendUrl}/login?verified=0`);
  }
};






// login endpoint
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ message: "Invalid credentials" });

    const user = rows[0];

    if (!user.is_verified) {
      return res.status(403).json({ message: "Please verify your email before logging in" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // vytvor JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "topsecrettokenkey",
      { expiresIn: "3h" } // presne 2 minúty
    );



    // POSLI TOKEN + USER FRONTENDU
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};




// ziska user name a email
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // authenticateToken middleware pridá req.user
    const [rows] = await db.query(
      "SELECT username, email FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(rows[0]); // vrátime username a email
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// delete user 
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; // authenticateToken middleware pridá req.user

    // Vymazanie všetkých hodnotení používateľa
    await db.query("DELETE FROM ratings WHERE user_id = ?", [userId]);

    // Vymazanie samotného účtu
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("DELETE ACCOUNT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
