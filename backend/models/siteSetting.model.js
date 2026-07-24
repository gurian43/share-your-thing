import mongoose from 'mongoose';

export const DEFAULT_SITE_SETTINGS = {
    allowUserRegistrations: true,
    allowUserUploads: true,
    allowUserDownloads: true,
};

const siteSettingSchema = new mongoose.Schema({
    allowUserRegistrations: {
        type: Boolean,
        default: DEFAULT_SITE_SETTINGS.allowUserRegistrations,
    },
    allowUserUploads: {
        type: Boolean,
        default: DEFAULT_SITE_SETTINGS.allowUserUploads,
    },
    allowUserDownloads: {
        type: Boolean,
        default: DEFAULT_SITE_SETTINGS.allowUserDownloads,
    },
}, { timestamps: true });

const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);

export default SiteSetting;
