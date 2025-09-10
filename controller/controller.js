import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  getAdminAuthInstance,
  getAdminFirestoreInstance,
} from "../dbConnection/connection.js";

const JWT_SECRET = process.env.JWT_SECRET || "abcdefgh";

// User validation function
const validateUser = (userData) => {
  const { firstName, lastName, email, password, confirmPassword } = userData;
  const errors = [];

  // Trim firstName before validation to avoid whitespace issues
  const trimmedFirstName = firstName ? firstName.trim() : "";

  console.log(
    "Validating firstName:",
    JSON.stringify(firstName),
    "trimmed:",
    JSON.stringify(trimmedFirstName)
  );

  if (
    !trimmedFirstName ||
    trimmedFirstName.length < 3 ||
    trimmedFirstName.length > 30
  ) {
    errors.push("First name must be between 3-30 characters");
  }

  if (!lastName || lastName.length < 3 || lastName.length > 30) {
    errors.push("Last name must be between 3-30 characters");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Enter a valid email address");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (!confirmPassword || password !== confirmPassword) {
    errors.push("Passwords do not match");
  }

  return errors;
};

export const userSignUp = async function (req, res, next) {
  try {
    // Log the entire req.body to debug missing fields
    console.log("Request body:", req.body);

    const { firstName, lastName, email, password, confirmPassword } = req.body;

    console.log("Running sign up");

    // Validate user data
    const validationErrors = validateUser({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const adminDb = getAdminFirestoreInstance();
    console.log("Firestore instance obtained:", !!adminDb);

    // Check if user already exists
    const usersRef = adminDb.collection("users");
    console.log("Users collection reference obtained:", !!usersRef);

    const querySnapshot = await usersRef
      .where("email", "==", email.toLowerCase().trim())
      .get();
    console.log("Query snapshot obtained:", !!querySnapshot);

    if (!querySnapshot.empty) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashPass = await bcrypt.hash(password, 5);
    console.log("Password hashed");

    // Create user document
    const userData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password: hashPass,
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add user to Firestore
    const docRef = await usersRef.add(userData);
    console.log("User created with ID: ", docRef.id);

    res.status(201).json({
      message: "Sign up successful",
      userId: docRef.id,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    next(error);
  }
};

export const UserSignIn = async function (req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const adminDb = getAdminFirestoreInstance();

    // Find user by email
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef
      .where("email", "==", email.toLowerCase().trim())
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({
        message: "No user found with this email",
      });
    }

    // Get user data
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    console.log("User found:", userData.email);

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (isPasswordValid) {
      console.log("Login successful for user ID:" + userId);

      const token = jwt.sign(
        {
          id: userId,
          email: userData.email,
          role: userData.role || "user",
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        })
        .status(200)
        .json({
          success: true,
          message: "Login successful",
          token: token,
          user: {
            id: userId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role,
          },
        });
    } else {
      res.status(403).json({
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Sign in error:", error);
    next(error);
  }
};

export const getUserProfile = async function (req, res, next) {
  try {
    const token = req.cookies.token;
    console.log("Token received in getUserProfile:", token);

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("Decoded token in getUserProfile:", decoded);
      const userId = decoded.id;

      const adminDb = getAdminFirestoreInstance();

      // Get user from Firestore
      const userDoc = await adminDb.collection("users").doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = userDoc.data();

      // Remove password from response
      const { password, ...userWithoutPassword } = userData;

      res.status(200).json({
        success: true,
        message: "Valid token",
        user: {
          id: userId,
          ...userWithoutPassword,
        },
      });
    } catch (error) {
      console.error("Get profile token verification error:", error);
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      next(error);
    }
  } catch (error) {
    console.error("Get profile error:", error);
    next(error);
  }
};

export const userLogout = async function (req, res, next) {
  try {
    res
  clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  })
      .status(200)
      .json({
        success: true,
        message: "Logout successful",
      });
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
};

export const forgotPassword = async function (req, res, next) {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Email, newPassword, and confirmPassword are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    const adminDb = getAdminFirestoreInstance();

    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef
      .where("email", "==", email.toLowerCase().trim())
      .get();

    if (querySnapshot.empty) {
      return res.status(404).json({
        message: "No user found with this email",
      });
    }

    const userDoc = querySnapshot.docs[0];
    const hashPass = await bcrypt.hash(newPassword, 5);

    await userDoc.ref.update({
      password: hashPass,
      updatedAt: new Date(),
    });

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    next(error);
  }
};
