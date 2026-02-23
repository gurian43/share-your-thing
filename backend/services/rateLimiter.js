import rateLimit from 'express-rate-limit';

// Rate limiter: 30 requests per minute per IP address
export const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests from this IP address, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req, res) => {
        return req.headers['cf-connecting-ip'] || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               req.socket.remoteAddress;
    }
});