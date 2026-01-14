
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { ImageFile } from '../types';
import { WandIcon, XMarkIcon, ChevronDownIcon, SparklesIcon } from './icons';

interface ImageGeneratorDialogProps {
  onClose: () => void;
  onImageGenerated: (image: ImageFile) => void;
  targetLabel: string;
}

const STYLES = [
  { value: '', label: 'None (Default)' },
  { value: 'Photorealistic, highly detailed', label: 'Photorealistic' },
  { value: 'Cinematic, movie scene', label: 'Cinematic' },
  { value: 'Anime style, studio ghibli', label: 'Anime' },
  { value: '3D Render, unreal engine 5', label: '3D Render' },
  { value: 'Cyberpunk, futuristic', label: 'Cyberpunk' },
  { value: 'Vintage, 1980s film grain', label: 'Vintage' },
  { value: 'Oil painting, textured', label: 'Oil Painting' },
  { value: 'Watercolor, soft edges', label: 'Watercolor' },
];

const LIGHTING = [
  { value: '', label: 'None (Default)' },
  { value: 'Natural light, soft shadows', label: 'Natural Light' },
  { value: 'Cinematic lighting, dramatic', label: 'Cinematic Lighting' },
  { value: 'Golden hour, warm', label: 'Golden Hour' },
  { value: 'Neon lights, vibrant', label: 'Neon' },
  { value: 'Dark and moody, low key', label: 'Dark & Moody' },
  { value: 'Vibrant, high saturation', label: 'Vibrant' },
  { value: 'Black and white, monochrome', label: 'Black & White' },
];

const ImageGeneratorDialog: React.FC<ImageGeneratorDialogProps> = ({ onClose, onImageGenerated, targetLabel }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [style, setStyle] = useState('');
  const [lighting, setLighting] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    // Construct the final prompt with style modifiers
    let finalPrompt = prompt;
    const modifiers = [];
    if (style) modifiers.push(style);
    if (lighting) modifiers.push(lighting);
    
    if (modifiers.length > 0) {
      finalPrompt = `${modifiers.join(', ')}. ${prompt}`;
    }

    try {
      const imageFile = await generateImage(finalPrompt, aspectRatio);
      onImageGenerated(imageFile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1f1f1f] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#2c2c2e]">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <WandIcon className="w-5 h-5 text-indigo-400" />
            Generate {targetLabel}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Style
              </label>
              <div className="relative">
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-[#2c2c2e] border border-gray-600 rounded-lg pl-3 pr-8 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                >
                  {STYLES.map((s) => (
                    <option key={s.label} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Lighting / Color
              </label>
              <div className="relative">
                <select
                  value={lighting}
                  onChange={(e) => setLighting(e.target.value)}
                  className="w-full bg-[#2c2c2e] border border-gray-600 rounded-lg pl-3 pr-8 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
                >
                   {LIGHTING.map((l) => (
                    <option key={l.label} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Image Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the scene in detail..."
              className="w-full bg-[#2c2c2e] border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-28"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Aspect Ratio
            </label>
            <div className="relative">
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-[#2c2c2e] border border-gray-600 rounded-lg pl-3 pr-10 py-2.5 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none text-white text-sm"
              >
                <option value="16:9">Landscape (16:9)</option>
                <option value="9:16">Portrait (9:16)</option>
                <option value="1:1">Square (1:1)</option>
                <option value="4:3">Standard (4:3)</option>
                <option value="3:4">Vertical (3:4)</option>
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Art...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Generate
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ImageGeneratorDialog;
