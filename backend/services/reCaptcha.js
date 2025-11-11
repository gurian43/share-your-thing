const captchaVerifyResponse = async (token, ip) => {
    const res = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            secret: process.env.CAPTCHA_PRIVATE_SECRET,
            response: token,
            remoteip: ip
        })
    });

    return res.json();
}

export const verifyCaptcha = async (token, ip) => {

    if (!token) {
        return { code: 400, success: false, message: 'Captcha token is required' };
    }

    const captchaVerifyData = await captchaVerifyResponse(token, ip);

    if (!captchaVerifyData.success) {
        return { code: 422, success: false, message: 'Captcha verification failed' };
    } else {
        return { code: 200, success: true, message: 'Captcha verified' };
    }
}