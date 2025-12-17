"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const prisma_1 = __importDefault(require("../prisma/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const hashPassword = async (password) => {
    return await bcrypt_1.default.hash(password, 10);
};
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
};
const registerUser = async (req, res) => {
    try {
        console.log('Register endpoint called');
        const { email, password } = req.body;
        console.log('Received data:', { email, hasPassword: !!password });
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        const hashedPassword = await hashPassword(password);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });
        console.log('User created successfully:', user.id);
        return res.status(201).json({ message: 'User created' });
    }
    catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        console.log('Login endpoint called');
        const { email, password } = req.body;
        console.log('Received data:', { email, hasPassword: !!password });
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
            },
        });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('User found, comparing password...');
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch');
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        console.log('Password match, generating token...');
        const token = generateToken(user.id);
        console.log('Token generated successfully');
        return res.status(200).json({ token });
    }
    catch (err) {
        console.error('Login error:', err);
        console.error('Error stack:', err.stack);
        return res.status(500).json({
            error: 'Internal server error',
            message: err.message || 'Unknown error',
            code: err.code || undefined
        });
    }
};
exports.loginUser = loginUser;
//# sourceMappingURL=auth.controller.js.map