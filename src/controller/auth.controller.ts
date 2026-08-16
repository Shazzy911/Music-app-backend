import { Request, Response } from "../types/file.type";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

const registerUser = async (req: Request, resp: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      resp.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      resp.status(409).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        image: null,
      },
    });

    const { password: _, ...userInfo } = user;

    resp.status(201).json({
      success: true,
      result: userInfo,
    });
    return;
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "Error Saving Information",
      error,
    });
    return;
  }
};

const logInUser = async (req: Request, resp: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      resp.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      resp.status(400).json({
        success: false,
        message: "Invalid Credentials!",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      resp.status(401).json({
        success: false,
        message: "Password did not match",
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, isAdmin: false },
      process.env.JWT_SECRET_KEY || "",
      { expiresIn: "7d" },
    );

    const { password: _, ...userInfo } = user;

    resp
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .status(200)
      .json({
        success: true,
        result: userInfo,
      });
    return;
  } catch (error) {
    resp.status(500).json({
      success: false,
      message: "User Login Failed",
      error,
    });
    return;
  }
};

const logOutUser = async (req: Request, resp: Response): Promise<void> => {
  try {
    resp
      .clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        message: "User Logout Successfully",
      });

    return;
  } catch (error) {
    resp.status(500).json({
      error,
      message: "Logout Failed",
    });
    return;
  }
};

const oauthSync = async (req: Request, res: Response) => {
  try {
    const {
      email,
      name,
      image,
      provider,
      providerAccountId,
      access_token,
      refresh_token,
    } = req.body;

    if (!email || !provider || !providerAccountId) {
      res.status(400).json({ message: "Invalid OAuth data" });
      return;
    }

    // 1. Find existing user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Create user if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          username: name,
          image,
        },
      });
    }

    // 3. Upsert account (IMPORTANT PART)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
      update: {
        access_token,
        refresh_token,
      },
      create: {
        userId: user.id,
        provider,
        providerAccountId,
        access_token,
        refresh_token,
      },
    });

    // 4. Create JWT session
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ← false on localhost
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // ← lax on localhost
      maxAge: 7 * 24 * 60 * 60 * 1000, // ← 7 days in ms (you were missing this)
    });

    res.json({ success: true, user });
    return;
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

const getMe = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};

export {
  registerUser,
  logInUser,
  logOutUser,
  oauthSync as syncOAuthUser,
  getMe,
};
