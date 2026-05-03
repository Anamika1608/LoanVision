import { Router } from "express";

import { registerSchema, loginSchema } from "src/controller/auth/authSchema";
import { registerUser, authUser, getUserByEmail } from "src/controller/auth/authController";
import { validateRequest } from "src/middleware/validateRequest";

const router = Router();

router.route("/register").post(validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, phone } = req.body;
    await registerUser(firstName, lastName, email, password.trim(), confirmPassword.trim(), phone);

    const newUser = await getUserByEmail(email);
    req.session.userId = newUser.id;
    req.session.email = newUser.email;
    req.session.role = newUser.role;
    req.session.save();

    return res.status(201).json({
      message: "Signup successful!",
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.route("/login").post(validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userByEmail = await authUser(email, password);

    req.session.userId = userByEmail.id;
    req.session.email = userByEmail.email;
    req.session.role = userByEmail.role;
    req.session.save();

    return res.status(200).json({
      message: "Login Successful!",
      user: {
        id: userByEmail.id,
        firstName: userByEmail.firstName,
        lastName: userByEmail.lastName,
        email: userByEmail.email,
        role: userByEmail.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.route("/me").get(async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(200).json({ authenticated: false, user: null });
  }
  const userRecord = await getUserByEmail(req.session.email!);
  if (!userRecord) {
    return res.status(200).json({ authenticated: false, user: null });
  }
  return res.status(200).json({
    authenticated: true,
    user: {
      id: userRecord.id,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      email: userRecord.email,
      role: userRecord.role,
    },
  });
});

router.route("/logout").post(async (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out" });
  });
});

export default router;
