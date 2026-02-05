import QRCode from 'qrcode';

export const generateQRCode = async (assetId: string): Promise<string> => {
    // In a real production app, this would be a full URL like https://campus-maintenance.com/report/ASSET_ID
    // For development, we'll use the relative report path.
    const reportUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/report/${assetId}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(reportUrl);
        return qrDataUrl;
    } catch (err) {
        console.error('QR Generation Error:', err);
        throw new Error('Failed to generate QR code');
    }
};
