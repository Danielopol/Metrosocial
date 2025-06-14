import React, { useState, useRef } from 'react';
import { Camera, XCircle, Check } from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { useOnline } from '../../context/OnlineContext';

const ScreenshotSharing: React.FC = () => {
  const { detectContent } = useContent();
  const { isOnline } = useOnline();
  const [showCapture, setShowCapture] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceName, setSourceName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOnline) return null;

  const handleScreenshotClick = () => {
    setShowCapture(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read the image file as a data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setCapturedImage(null);
    setTitle('');
    setDescription('');
    setSourceName('');
    setShowCapture(false);
  };

  const handleShare = () => {
    if (!capturedImage || !title || !description || !sourceName) return;

    // Share the captured content
    detectContent('web', {
      title,
      description,
      url: '',
      sourceName,
      screenshotData: capturedImage,
    });

    // Reset the form
    handleCancel();
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="mb-4">
      {!showCapture ? (
        <button
          className="w-full flex items-center justify-center p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          onClick={handleScreenshotClick}
        >
          <Camera size={20} className="mr-2" />
          <span>Capture & Share What You're Browsing</span>
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Share Screenshot</h3>
            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
              <XCircle size={20} />
            </button>
          </div>

          {!capturedImage ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer" onClick={triggerFileInput}>
              <Camera size={48} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 mb-1">Take a screenshot of what you're browsing</p>
              <p className="text-gray-400 text-sm mb-4">Then click here to upload it</p>
              
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                Select Screenshot
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              
              <p className="text-xs text-gray-400 mt-4">
                Tip: Use your system's screenshot tool (Win+Shift+S, PrintScreen, 
                or Cmd+Shift+4) to capture what you're viewing
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={capturedImage} alt="Screenshot" className="w-full h-auto" />
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., My X Feed"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Tech news on X"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={2}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="e.g., X (Twitter)"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
                  disabled={!title || !description || !sourceName}
                >
                  <Check size={16} className="mr-1" />
                  Share
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenshotSharing; 