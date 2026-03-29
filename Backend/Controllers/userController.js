import userModel from "../Modals/userModal.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";

//LOGIN FUNCTION
const loginUser = async (req, res) => {
    const { email, password } = req.body
    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User Doesnt Exits" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid Creds" })
        }

        const token = createToken(user._id, user.email);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}

//CREATE TOKEN

const createToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET)
}

//REGISTER FUNCTION

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: "User Already Exists" })
        }

        //VALIDATION
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please Enter a Valid Email" })
        }

        if (password.length < 0) {
            return res.json({ success: false, message: "Please Enter a Strong Password" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            username,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id, user.email);
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            }
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error" })
    }
}

// FORGOT PASSWORD (generate reset link)
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Valid email is required' });
        }

        const user = await userModel.findOne({ email });

        // Avoid user-enumeration: keep same message for unknown users
        if (!user) {
            return res.json({
                success: true,
                message: 'If this email exists, a reset link has been generated.'
            });
        }

        const resetToken = jwt.sign(
            { id: user._id, action: 'reset-password' },
            `${process.env.JWT_SECRET}${user.password}`,
            { expiresIn: '15m' }
        );

        const frontendBase = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetLink = `${String(frontendBase).replace(/\/+$/, '')}/reset-password/${resetToken}`;

        res.json({
            success: true,
            message: 'Password reset link generated successfully.',
            resetLink
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error generating reset link' });
    }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Decode first to get user id
        const decoded = jwt.decode(token);
        if (!decoded?.id) {
            return res.status(400).json({ success: false, message: 'Invalid reset token' });
        }

        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        jwt.verify(token, `${process.env.JWT_SECRET}${user.password}`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: 'Reset link is invalid or expired' });
    }
};

// CURRENT USER PROFILE
const getCurrentUser = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
};

// UPDATE CURRENT USER PROFILE (basic fields only)
const updateCurrentUser = async (req, res) => {
    try {
        const updates = {};
        if (req.body.username) updates.username = req.body.username;

        const updated = await userModel
            .findByIdAndUpdate(req.user._id, updates, { new: true })
            .select('-password');

        if (!updated) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: updated });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};

export { loginUser, registerUser, forgotPassword, resetPassword, getCurrentUser, updateCurrentUser }