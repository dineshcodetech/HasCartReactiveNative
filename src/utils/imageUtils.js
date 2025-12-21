/**
 * Image URL Utilities
 * Simply converts Google Drive share links to direct image URLs
 */

/**
 * Extracts Google Drive file ID from share URL
 */
export function extractGoogleDriveFileId(url) {
    if (!url) return null;

    // Format: /file/d/{fileId}/
    if (url.includes('/file/d/')) {
        const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    // Format: ?id={fileId}
    if (url.includes('id=')) {
        const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    // Format: /d/{fileId}
    if (url.includes('/d/')) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    }

    return null;
}

/**
 * Checks if URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url) {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('googleusercontent.com');
}

/**
 * Converts Google Drive share URL to direct image URL
 * 
 * Input:  https://drive.google.com/file/d/ABC123/view?usp=sharing
 * Output: https://drive.google.com/thumbnail?id=ABC123&sz=w800
 */
export function getOptimizedImageUrl(url, options = {}) {
    const { width = 800 } = options;

    if (!url) return 'https://via.placeholder.com/600x300?text=No+Image';

    // If it's a Google Drive URL, convert to thumbnail format
    if (isGoogleDriveUrl(url)) {
        const fileId = extractGoogleDriveFileId(url);
        if (fileId) {
            return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
        }
    }

    // Return as-is for other URLs
    return url;
}

/**
 * For React Native Image component - returns { uri: "..." }
 */
export function getOptimizedImageSource(url, width = 800) {
    return { uri: getOptimizedImageUrl(url, { width }) };
}

export default { extractGoogleDriveFileId, isGoogleDriveUrl, getOptimizedImageUrl, getOptimizedImageSource };
