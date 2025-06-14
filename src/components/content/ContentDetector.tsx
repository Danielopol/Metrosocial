import React, { useState } from 'react';
import { useContent } from '../../context/ContentContext';
import { useOnline } from '../../context/OnlineContext';
import { ContentType } from '../../types';
import { Chrome, Instagram, Youtube, Music, FileText, BookOpen, Plus, X } from 'lucide-react';

const ContentDetector: React.FC = () => {
  const { toggleContentDetection, isContentDetectionEnabled, detectContent } = useContent();
  const { isOnline } = useOnline();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customContent, setCustomContent] = useState({
    title: '',
    description: '',
    url: '',
    contentType: 'web' as ContentType,
    sourceName: '',
  });

  const contentTypes: { type: ContentType; icon: React.ReactNode; label: string }[] = [
    { type: 'web', icon: <Chrome size={24} />, label: 'Web' },
    { type: 'social', icon: <Instagram size={24} />, label: 'Social' },
    { type: 'video', icon: <Youtube size={24} />, label: 'Video' },
    { type: 'music', icon: <Music size={24} />, label: 'Music' },
    { type: 'news', icon: <BookOpen size={24} />, label: 'News' },
    { type: 'document', icon: <FileText size={24} />, label: 'Document' },
  ];

  // If user is offline, don't render the component
  if (!isOnline) {
    return null;
  }

  const handleCustomContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomContent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Call the detectContent function with the custom content
    detectContent(customContent.contentType, customContent);
    // Reset form and hide it
    setCustomContent({
      title: '',
      description: '',
      url: '',
      contentType: 'web',
      sourceName: '',
    });
    setShowCustomForm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Content Sharing</h2>
        <div className="flex items-center">
          <span className="mr-2 text-sm">
            {isContentDetectionEnabled ? 'Sharing' : 'Not Sharing'}
          </span>
          <div
            className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer ${
              isContentDetectionEnabled ? 'bg-green-400' : 'bg-gray-300'
            }`}
            onClick={toggleContentDetection}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                isContentDetectionEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </div>
        </div>
      </div>

      {isContentDetectionEnabled && !showCustomForm && (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Choose a content type to share or add your own custom content
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {contentTypes.map((content) => (
              <button
                key={content.type}
                className="flex flex-col items-center justify-center p-3 bg-gray-100 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={() => detectContent(content.type)}
              >
                <div className="text-blue-500 mb-1">{content.icon}</div>
                <span className="text-xs">{content.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setShowCustomForm(true)}
            >
              <Plus size={16} className="mr-1" />
              <span>Custom Content</span>
            </button>
          </div>
        </>
      )}

      {isContentDetectionEnabled && showCustomForm && (
        <div className="flex flex-col h-full min-h-0">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Share what you're browsing</h3>
            <button 
              className="text-gray-500 hover:text-gray-700" 
              onClick={() => setShowCustomForm(false)}
            >
              Cancel
            </button>
          </div>
          
          <form onSubmit={handleCustomContentSubmit} className="flex flex-col flex-grow min-h-0">
            <div className="flex-grow overflow-y-auto pr-1 min-h-0">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  name="contentType"
                  value={customContent.contentType}
                  onChange={handleCustomContentChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  {contentTypes.map(content => (
                    <option key={content.type} value={content.type}>
                      {content.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={customContent.title}
                  onChange={handleCustomContentChange}
                  placeholder="e.g., My X Feed"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={customContent.description}
                  onChange={handleCustomContentChange}
                  placeholder="e.g., Browsing latest tech news on X"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={2}
                  required
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL (optional)</label>
                <input
                  type="url"
                  name="url"
                  value={customContent.url}
                  onChange={handleCustomContentChange}
                  placeholder="e.g., https://x.com/home"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
                <input
                  type="text"
                  name="sourceName"
                  value={customContent.sourceName}
                  onChange={handleCustomContentChange}
                  placeholder="e.g., X (Twitter)"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 shrink-0">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Share Content
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContentDetector; 