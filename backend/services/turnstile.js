const captchaVerifyResponse = async (token, ip) => {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: ip || ''
        })
    });

    return res.json();
};

export const verifyCaptcha = async (token, ip) => {
    if (!process.env.TURNSTILE_SECRET_KEY) {
        return { code: 500, success: false, message: 'Captcha secret is not configured' };
    }

    if (!token) {
        return { code: 400, success: false, message: 'Captcha token is required' };
    }

    const captchaVerifyData = await captchaVerifyResponse(token, ip);

    if (!captchaVerifyData.success) {
        return { code: 422, success: false, message: 'Captcha verification failed' };
    }

    return { code: 200, success: true, message: 'Captcha verified' };
};