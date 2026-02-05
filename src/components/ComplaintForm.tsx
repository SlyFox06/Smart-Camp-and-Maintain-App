import { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Video, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';
import type { Asset } from '../types';
import { classifySeverity, getCurrentLocation, isValidImageFile, isValidVideoFile, formatFileSize } from '../utils/helpers';

interface ComplaintFormProps {
    onClose: () => void;
    prefilledAssetId?: string;
}

const ComplaintForm = ({ onClose, prefilledAssetId }: ComplaintFormProps) => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [assetId, setAssetId] = useState(prefilledAssetId || '');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<File[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const response = await api.get('/assets');
                setAssets(response.data);
            } catch (err) {
                console.error('Failed to fetch assets', err);
            }
        };
        fetchAssets();
    }, []);

    const selectedAsset = assets.find(a => a.id === assetId);
    const predictedSeverity = title && description ? classifySeverity(title, description) : null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validImages = files.filter(isValidImageFile);

        if (validImages.length !== files.length) {
            setError('Some files were not valid images');
        }

        setImages(prev => [...prev, ...validImages].slice(0, 5)); // Max 5 images
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (isValidVideoFile(file)) {
                setVideo(file);
                setError('');
            } else {
                setError('Invalid video format. Please upload MP4, WebM, or OGG');
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const getLocation = async () => {
        try {
            const loc = await getCurrentLocation();
            setLocation(loc);
            setError('');
        } catch (err) {
            setError('Unable to get location. Please enable location services.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!assetId) {
            setError('Please select an asset');
            return;
        }

        if (!title || !description) {
            setError('Please fill in all required fields');
        }

        if (images.length === 0) {
            setError('Please upload at least one image');
            return;
        }

        setIsSubmitting(true);

        try {
            // For now, we simulate image upload to Cloudinary and just send placeholder URLs
            // In a real app, we'd use a FormData object or upload images first
            const imageUrls = images.map((_, i) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=img${i + Date.now()}`);

            await api.post('/complaints', {
                assetId,
                title,
                description,
                severity: predictedSeverity || 'medium',
                images: imageUrls,
                video: video ? 'https://example.com/video.mp4' : null,
                location
            });

            alert('Complaint submitted successfully! 🎉');
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card-light max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-lg p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">New Complaint</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Asset Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Asset <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={assetId}
                            onChange={(e) => setAssetId(e.target.value)}
                            className="input-field-light"
                            required
                        >
                            <option value="">Choose an asset...</option>
                            {assets.map(asset => (
                                <option key={asset.id} value={asset.id}>
                                    {asset.name} - {asset.building} {asset.room}
                                </option>
                            ))}
                        </select>
                        {selectedAsset && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    <strong>Location:</strong> {selectedAsset.building}, Floor {selectedAsset.floor}, Room {selectedAsset.room}
                                </p>
                                <p className="text-sm text-blue-900">
                                    <strong>Type:</strong> {selectedAsset.type.replace('_', ' ').toUpperCase()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Issue Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Projector not displaying properly"
                            className="input-field-light"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the issue in detail..."
                            rows={4}
                            className="input-field-light resize-none"
                            required
                        />
                    </div>

                    {/* AI Severity Prediction */}
                    {predictedSeverity && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                <p className="text-sm font-semibold text-purple-900">AI Severity Prediction</p>
                            </div>
                            <p className="text-sm text-purple-700">
                                Based on your description, this issue is classified as{' '}
                                <strong className="uppercase">{predictedSeverity}</strong> priority
                            </p>
                        </div>
                    )}

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Images <span className="text-red-500">*</span> (Max 5)
                        </label>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            disabled={images.length >= 5}
                        >
                            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Click to upload images</p>
                            <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                        </button>

                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Upload ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(image.size)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video Upload (Optional) */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Video (Optional)
                        </label>
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            disabled={!!video}
                        >
                            <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Click to upload video</p>
                            <p className="text-sm text-gray-400 mt-1">MP4, WebM up to 50MB</p>
                        </button>

                        {video && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Video className="w-8 h-8 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{video.name}</p>
                                        <p className="text-xs text-gray-500">{formatFileSize(video.size)}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setVideo(null)}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Location
                        </label>
                        <button
                            type="button"
                            onClick={getLocation}
                            className="btn-secondary w-full flex items-center justify-center gap-2"
                        >
                            <MapPin className="w-5 h-5" />
                            {location ? 'Location Captured ✓' : 'Capture Current Location'}
                        </button>
                        {location && (
                            <p className="text-sm text-green-600 mt-2">
                                📍 Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="loading-spinner inline-block mr-2"></div>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 inline mr-2" />
                                    Submit Complaint
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ComplaintForm;
