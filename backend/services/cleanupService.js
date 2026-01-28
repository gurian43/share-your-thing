import fs from 'fs';
import path from 'path';

const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run every hour
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupAbandonedUploads = async () => {
    try {
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        
        if (!fs.existsSync(uploadsRoot)) {
            return;
        }

        const userDirs = await fs.promises.readdir(uploadsRoot, { withFileTypes: true });

        for (const userDir of userDirs) {
            if (!userDir.isDirectory()) continue;

            const userPath = path.join(uploadsRoot, userDir.name);
            const tempPath = path.join(userPath, '.temp');

            // skip if no temp
            if (!fs.existsSync(tempPath)) continue;

            const uploadDirs = await fs.promises.readdir(tempPath, { withFileTypes: true });

            for (const uploadDir of uploadDirs) {
                if (!uploadDir.isDirectory()) continue;

                const uploadPath = path.join(tempPath, uploadDir.name);

                try {
                    // get directory stats
                    const stats = await fs.promises.stat(uploadPath);
                    const age = Date.now() - stats.mtime.getTime();

                    // delete if older than 24h
                    if (age > MAX_AGE_MS) {
                        console.log(`Cleaning up abandoned upload: ${uploadPath} (age: ${Math.round(age / (60 * 60 * 1000))}h)`);

                        // Delete all chunks
                        const files = await fs.promises.readdir(uploadPath);
                        for (const file of files) {
                            await fs.promises.unlink(path.join(uploadPath, file));
                        }
                    }
                } catch (err) {
                    console.error(`Error cleaning up ${uploadPath}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error('Error in cleanup service:', err);
    }
};

export const startCleanupService = () => {
    console.log('Starting temp file cleanup service');

    cleanupAbandonedUploads();

    setInterval(cleanupAbandonedUploads, CLEANUP_INTERVAL);
};
