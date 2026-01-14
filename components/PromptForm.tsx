
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
} from '../types';
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FilmIcon,
  FramesModeIcon,
  PlusIcon,
  RectangleStackIcon,
  ReferencesModeIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TextModeIcon,
  TvIcon,
  WandIcon,
  XMarkIcon,
  DownloadIcon
} from './icons';
import ImageGeneratorDialog from './ImageGeneratorDialog';

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const modeIcons: Record<GenerationMode, React.ReactNode> = {
  [GenerationMode.TEXT_TO_VIDEO]: <TextModeIcon className="w-5 h-5" />,
  [GenerationMode.FRAMES_TO_VIDEO]: <FramesModeIcon className="w-5 h-5" />,
  [GenerationMode.REFERENCES_TO_VIDEO]: (
    <ReferencesModeIcon className="w-5 h-5" />
  ),
  [GenerationMode.EXTEND_VIDEO]: <FilmIcon className="w-5 h-5" />,
};

const fileToBase64 = <T extends {file: File; base64: string}>(
  file: File,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (base64) {
        resolve({file, base64} as T);
      } else {
        reject(new Error('Failed to read file as base64.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};
const fileToImageFile = (file: File): Promise<ImageFile> =>
  fileToBase64<ImageFile>(file);
const fileToVideoFile = (file: File): Promise<VideoFile> =>
  fileToBase64<VideoFile>(file);

const CustomSelect: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({label, value, onChange, icon, children, disabled = false}) => (
  <div>
    <label
      className={`text-xs block mb-1.5 font-medium ${
        disabled ? 'text-gray-500' : 'text-gray-400'
      }`}>
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        {icon}
      </div>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-10 pr-8 py-2.5 appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-700/50 disabled:border-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed">
        {children}
      </select>
      <ChevronDownIcon
        className={`w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${
          disabled ? 'text-gray-600' : 'text-gray-400'
        }`}
      />
    </div>
  </div>
);

const ImageUpload: React.FC<{
  onSelect: (image: ImageFile) => void;
  onRemove?: () => void;
  onGenerate?: () => void;
  image?: ImageFile | null;
  label: React.ReactNode;
  className?: string;
  canGenerate?: boolean;
}> = ({onSelect, onRemove, onGenerate, image, label, className = "w-28 h-20", canGenerate = false}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imageFile = await fileToImageFile(file);
        onSelect(imageFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (image) {
    return (
      <div className={`relative group ${className}`}>
        <img
          src={URL.createObjectURL(image.file)}
          alt="preview"
          className="w-full h-full object-cover rounded-lg shadow-inner"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove image">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-gray-700/30 hover:bg-gray-700/50 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 transition-colors group overflow-hidden`}>
       {/* Upload Click Area */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex-grow flex flex-col items-center justify-center p-2 hover:text-white"
      >
        <PlusIcon className="w-5 h-5 mb-1" />
        <span className="text-[10px] text-center leading-tight">{label}</span>
      </button>

      {/* Divider */}
      {canGenerate && onGenerate && (
        <div className="w-full h-px bg-gray-600/50" />
      )}

      {/* Generate Button Area */}
      {canGenerate && onGenerate && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onGenerate();
          }}
          className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-medium flex items-center justify-center gap-1 transition-all"
        >
          <WandIcon className="w-3 h-3" />
          <span>AI Generate</span>
        </button>
      )}
      
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

const VideoUpload: React.FC<{
  onSelect: (video: VideoFile) => void;
  onRemove?: () => void;
  video?: VideoFile | null;
  label: React.ReactNode;
}> = ({onSelect, onRemove, video, label}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const videoFile = await fileToVideoFile(file);
        onSelect(videoFile);
      } catch (error) {
        console.error('Error converting file:', error);
      }
    }
  };

  if (video) {
    return (
      <div className="relative w-48 h-28 group">
        <video
          src={URL.createObjectURL(video.file)}
          muted
          loop
          className="w-full h-full object-cover rounded-lg shadow-inner"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove video">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="w-48 h-28 bg-gray-700/50 hover:bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors text-center">
      <PlusIcon className="w-6 h-6" />
      <span className="text-xs mt-1 px-2">{label}</span>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
    </button>
  );
};

interface PromptFormProps {
  onGenerate: (params: GenerateVideoParams) => void;
  initialValues?: GenerateVideoParams | null;
}

const PromptForm: React.FC<PromptFormProps> = ({
  onGenerate,
  initialValues,
}) => {
  const [prompt, setPrompt] = useState(initialValues?.prompt ?? '');
  const [model, setModel] = useState<VeoModel>(
    initialValues?.model ?? VeoModel.VEO_FAST,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(
    initialValues?.aspectRatio ?? AspectRatio.LANDSCAPE,
  );
  const [resolution, setResolution] = useState<Resolution>(
    initialValues?.resolution ?? Resolution.P720,
  );
  const [generationMode, setGenerationMode] = useState<GenerationMode>(
    initialValues?.mode ?? GenerationMode.TEXT_TO_VIDEO,
  );
  const [startFrame, setStartFrame] = useState<ImageFile | null>(
    initialValues?.startFrame ?? null,
  );
  const [middleFrame, setMiddleFrame] = useState<ImageFile | null>(
    initialValues?.middleFrame ?? null,
  );
  const [endFrame, setEndFrame] = useState<ImageFile | null>(
    initialValues?.endFrame ?? null,
  );
  const [referenceImages, setReferenceImages] = useState<ImageFile[]>(
    initialValues?.referenceImages ?? [],
  );
  const [styleImage, setStyleImage] = useState<ImageFile | null>(
    initialValues?.styleImage ?? null,
  );
  const [inputVideo, setInputVideo] = useState<VideoFile | null>(
    initialValues?.inputVideo ?? null,
  );
  const [inputVideoObject, setInputVideoObject] = useState<Video | null>(
    initialValues?.inputVideoObject ?? null,
  );
  const [isLooping, setIsLooping] = useState(initialValues?.isLooping ?? false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  // Image Generation State
  const [isImageGenOpen, setIsImageGenOpen] = useState(false);
  const [imageGenTarget, setImageGenTarget] = useState<'start' | 'middle' | 'end' | 'ref' | 'download'>('start');


  useEffect(() => {
    if (initialValues) {
      setPrompt(initialValues.prompt ?? '');
      setModel(initialValues.model ?? VeoModel.VEO_FAST);
      setAspectRatio(initialValues.aspectRatio ?? AspectRatio.LANDSCAPE);
      setResolution(initialValues.resolution ?? Resolution.P720);
      setGenerationMode(initialValues.mode ?? GenerationMode.TEXT_TO_VIDEO);
      setStartFrame(initialValues.startFrame ?? null);
      setMiddleFrame(initialValues.middleFrame ?? null);
      setEndFrame(initialValues.endFrame ?? null);
      setReferenceImages(initialValues.referenceImages ?? []);
      setStyleImage(initialValues.styleImage ?? null);
      setInputVideo(initialValues.inputVideo ?? null);
      setInputVideoObject(initialValues.inputVideoObject ?? null);
      setIsLooping(initialValues.isLooping ?? false);
    }
  }, [initialValues]);

  useEffect(() => {
    // Rule: Extension strictly only works in 720p
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      setResolution(Resolution.P720);
    }
    // Rule: Multiple reference images mode strictly requires 'veo-3.1-generate-preview' model, '16:9' aspect ratio, and '720p' resolution.
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      setModel(VeoModel.VEO);
      setAspectRatio(AspectRatio.LANDSCAPE);
      setResolution(Resolution.P720);
    }
  }, [generationMode]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modeSelectorRef.current &&
        !modeSelectorRef.current.contains(event.target as Node)
      ) {
        setIsModeSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onGenerate({
        prompt,
        model,
        aspectRatio,
        resolution,
        mode: generationMode,
        startFrame,
        middleFrame,
        endFrame,
        referenceImages,
        styleImage,
        inputVideo,
        inputVideoObject,
        isLooping,
      });
    },
    [
      prompt,
      model,
      aspectRatio,
      resolution,
      generationMode,
      startFrame,
      middleFrame,
      endFrame,
      referenceImages,
      styleImage,
      inputVideo,
      inputVideoObject,
      onGenerate,
      isLooping,
    ],
  );

  const handleSelectMode = (mode: GenerationMode) => {
    setGenerationMode(mode);
    setIsModeSelectorOpen(false);
    // Clearing current assets to match the selected mode's requirements
    setStartFrame(null);
    setMiddleFrame(null);
    setEndFrame(null);
    setReferenceImages([]);
    setStyleImage(null);
    setInputVideo(null);
    setInputVideoObject(null);
    setIsLooping(false);
  };

  const handleOpenImageGen = (target: 'start' | 'middle' | 'end' | 'ref' | 'download') => {
    setImageGenTarget(target);
    setIsImageGenOpen(true);
  };

  const handleImageGenerated = (image: ImageFile) => {
    if (imageGenTarget === 'start') {
      setStartFrame(image);
      setIsLooping(false); // Reset looping if specific start frame set
    } else if (imageGenTarget === 'middle') {
      setMiddleFrame(image);
    } else if (imageGenTarget === 'end') {
      setEndFrame(image);
    } else if (imageGenTarget === 'ref') {
      setReferenceImages((prev) => [...prev, image]);
    } else if (imageGenTarget === 'download') {
      // Create a download link for standalone generation
      const link = document.createElement('a');
      link.href = URL.createObjectURL(image.file);
      link.download = 'generated-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const promptPlaceholder = {
    [GenerationMode.TEXT_TO_VIDEO]: 'Describe the video you want to create...',
    [GenerationMode.FRAMES_TO_VIDEO]:
      'Describe motion between start, middle, and end frames...',
    [GenerationMode.REFERENCES_TO_VIDEO]:
      'Describe a video using reference images...',
    [GenerationMode.EXTEND_VIDEO]: 'Describe what happens next (optional)...',
  }[generationMode];

  const selectableModes = [
    GenerationMode.TEXT_TO_VIDEO,
    GenerationMode.FRAMES_TO_VIDEO,
    GenerationMode.REFERENCES_TO_VIDEO,
  ];

  const totalReferences = referenceImages.length + (styleImage ? 1 : 0);

  const renderMediaUploads = () => {
    if (generationMode === GenerationMode.FRAMES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center justify-center gap-4">
            <ImageUpload
              label="Start Frame"
              image={startFrame}
              onSelect={setStartFrame}
              onRemove={() => {
                setStartFrame(null);
                setIsLooping(false);
              }}
              canGenerate
              onGenerate={() => handleOpenImageGen('start')}
            />
            {/* Middle Frame Slot - only if not looping for now, or generally available */}
            {!isLooping && (
                <ImageUpload
                label="Middle (Opt)"
                image={middleFrame}
                onSelect={setMiddleFrame}
                onRemove={() => setMiddleFrame(null)}
                canGenerate
                onGenerate={() => handleOpenImageGen('middle')}
                />
            )}
            {!isLooping && (
              <ImageUpload
                label="End Frame"
                image={endFrame}
                onSelect={setEndFrame}
                onRemove={() => setEndFrame(null)}
                canGenerate
                onGenerate={() => handleOpenImageGen('end')}
              />
            )}
          </div>
          <p className="text-[10px] text-gray-500 italic">
            Images-to-video requires at least a start frame.
          </p>
          {startFrame && !endFrame && !middleFrame && (
            <div className="mt-1 flex items-center">
              <input
                id="loop-video-checkbox"
                type="checkbox"
                checked={isLooping}
                onChange={(e) => setIsLooping(e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer"
              />
              <label
                htmlFor="loop-video-checkbox"
                className="ml-2 text-sm font-medium text-gray-300 cursor-pointer">
                Create a looping video
              </label>
            </div>
          )}
        </div>
      );
    }
    if (generationMode === GenerationMode.REFERENCES_TO_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex flex-col items-center gap-5">
          <div className="w-full">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-3 text-center">
              Content References ({referenceImages.length}/3)
            </label>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {referenceImages.map((img, index) => (
                <ImageUpload
                  key={index}
                  image={img}
                  label=""
                  onSelect={() => {}}
                  onRemove={() =>
                    setReferenceImages((imgs) => imgs.filter((_, i) => i !== index))
                  }
                />
              ))}
              {totalReferences < 3 && (
                <ImageUpload
                  label="Add Asset"
                  onSelect={(img) => setReferenceImages((imgs) => [...imgs, img])}
                  canGenerate
                  onGenerate={() => handleOpenImageGen('ref')}
                />
              )}
            </div>
          </div>
        </div>
      );
    }
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      return (
        <div className="mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 flex items-center justify-center gap-4">
          <VideoUpload
            label={
              <>
                Input Video
                <br />
                (Previous generation)
              </>
            }
            video={inputVideo}
            onSelect={setInputVideo}
            onRemove={() => {
              setInputVideo(null);
              setInputVideoObject(null);
            }}
          />
        </div>
      );
    }
    return null;
  };

  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;
  const isReferenceMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;

  let isSubmitDisabled = false;
  let tooltipText = '';

  switch (generationMode) {
    case GenerationMode.TEXT_TO_VIDEO:
      // Rule: Prompt required
      isSubmitDisabled = !prompt.trim();
      if (isSubmitDisabled) {
        tooltipText = 'Please enter a prompt.';
      }
      break;
    case GenerationMode.FRAMES_TO_VIDEO:
      // Rule: Start frame required (end frame alone not supported)
      isSubmitDisabled = !startFrame;
      if (isSubmitDisabled) {
        tooltipText = 'A start frame is required.';
      }
      break;
    case GenerationMode.REFERENCES_TO_VIDEO:
      // Rule: Prompt + At least one asset required
      const hasNoPrompt = !prompt.trim();
      const hasNoAssets = referenceImages.length === 0;
      isSubmitDisabled = hasNoPrompt || hasNoAssets;
      if (hasNoPrompt && hasNoAssets) {
        tooltipText = 'Please enter a prompt and add at least one asset.';
      } else if (hasNoPrompt) {
        tooltipText = 'Please enter a prompt.';
      } else if (hasNoAssets) {
        tooltipText = 'At least one reference asset is required.';
      }
      break;
    case GenerationMode.EXTEND_VIDEO:
      isSubmitDisabled = !inputVideoObject;
      if (isSubmitDisabled) {
        tooltipText =
          'An input video from a previous generation is required to extend.';
      }
      break;
  }

  const getImageTargetLabel = () => {
    if (imageGenTarget === 'start') return 'Start Frame';
    if (imageGenTarget === 'middle') return 'Middle Frame';
    if (imageGenTarget === 'end') return 'End Frame';
    if (imageGenTarget === 'download') return 'Image (Download)';
    return 'Asset';
  }

  return (
    <div className="relative w-full">
      {isImageGenOpen && (
        <ImageGeneratorDialog 
          onClose={() => setIsImageGenOpen(false)}
          onImageGenerated={handleImageGenerated}
          targetLabel={getImageTargetLabel()}
        />
      )}

      {isSettingsOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-3 p-4 bg-[#2c2c2e] rounded-xl border border-gray-700 shadow-2xl z-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <CustomSelect
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value as VeoModel)}
                icon={<SparklesIcon className="w-5 h-5 text-gray-400" />}
                disabled={isReferenceMode}>
                {Object.values(VeoModel).map((modelValue) => (
                  <option key={modelValue} value={modelValue}>
                    {modelValue === VeoModel.VEO ? 'High Quality (Veo 3.1)' : 'Fast (Veo 3.1)'}
                  </option>
                ))}
              </CustomSelect>
              {isReferenceMode && (
                <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter">
                  R2V is locked to High Quality
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <CustomSelect
                label="Aspect Ratio"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                icon={<RectangleStackIcon className="w-5 h-5 text-gray-400" />}
                disabled={isReferenceMode}>
                {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </CustomSelect>
              {isReferenceMode && (
                <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter">
                  R2V is locked to 16:9
                </p>
              )}
            </div>
            <div className="flex flex-col">
              <CustomSelect
                label="Resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as Resolution)}
                icon={<TvIcon className="w-5 h-5 text-gray-400" />}
                disabled={isExtendMode || isReferenceMode}>
                <option value={Resolution.P720}>720p</option>
                <option value={Resolution.P1080}>1080p</option>
                <option value={Resolution.P4K}>4K</option>
              </CustomSelect>
              {isExtendMode ? (
                <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter">
                  Extension is locked to 720p
                </p>
              ) : isReferenceMode ? (
                <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter">
                  R2V is locked to 720p
                </p>
              ) : resolution !== Resolution.P720 ? (
                <p className="text-[10px] text-amber-400 mt-1 uppercase tracking-tighter">
                  1080p/4k videos can't be extended
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="w-full">
        {renderMediaUploads()}
        <div className="flex items-end gap-2 bg-[#1f1f1f] border border-gray-600 rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500">
          <div className="relative" ref={modeSelectorRef}>
            <button
              type="button"
              onClick={() => setIsModeSelectorOpen((prev) => !prev)}
              className="flex shrink-0 items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              aria-label="Select generation mode">
              {modeIcons[generationMode]}
              <span className="font-medium text-sm whitespace-nowrap">
                {generationMode}
              </span>
            </button>
            {isModeSelectorOpen && (
              <div className="absolute bottom-full mb-2 w-60 bg-[#2c2c2e] border border-gray-600 rounded-lg shadow-xl overflow-hidden z-30">
                {selectableModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectMode(mode)}
                    className={`w-full text-left flex items-center gap-3 p-3 hover:bg-indigo-600/50 ${generationMode === mode ? 'bg-indigo-600/30 text-white' : 'text-gray-300'}`}>
                    {modeIcons[mode]}
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={promptPlaceholder}
            className="flex-grow bg-transparent focus:outline-none resize-none text-base text-gray-200 placeholder-gray-500 max-h-48 py-2"
            rows={1}
          />
          <button
            type="button"
            onClick={() => handleOpenImageGen('download')}
            className={`p-2.5 rounded-full hover:bg-indigo-900/40 text-indigo-400 hover:text-indigo-300 transition-colors`}
            aria-label="Open Image Generator"
            title="Open Image Generator Tool"
          >
            <WandIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className={`p-2.5 rounded-full hover:bg-gray-700 ${isSettingsOpen ? 'bg-gray-700 text-white' : 'text-gray-300'}`}
            aria-label="Toggle settings">
            <SlidersHorizontalIcon className="w-5 h-5" />
          </button>
          <div className="relative group">
            <button
              type="submit"
              className="p-2.5 bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
              aria-label="Generate video"
              disabled={isSubmitDisabled}>
              <ArrowRightIcon className="w-5 h-5 text-white" />
            </button>
            {isSubmitDisabled && tooltipText && (
              <div
                role="tooltip"
                className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 border border-gray-700 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {tooltipText}
              </div>
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-500 text-center mt-2 px-4 uppercase tracking-tighter">
          Base videos are ~5s. Use 'Extend' to add time. Extensions are limited to 720p.
        </p>
      </form>
    </div>
  );
};

export default PromptForm;
