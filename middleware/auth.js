import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  // získa token z hlavičky Authorization: "Bearer TOKEN"
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "topsecrettokenkey");
    req.user = decoded; // pridáme user info do requestu
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
