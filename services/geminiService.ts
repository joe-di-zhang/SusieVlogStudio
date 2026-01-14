
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {
  GoogleGenAI,
  Video,
  VideoGenerationReferenceImage,
  VideoGenerationReferenceType,
} from '@google/genai';
import {GenerateVideoParams, GenerationMode, ImageFile} from '../types';

export const generateImage = async (
  prompt: string,
  aspectRatio: string = '16:9',
): Promise<ImageFile> => {
  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  // Using the high-quality image model as per requirements
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{text: prompt}],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: '1K',
      },
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error('No image generated.');
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64 = part.inlineData.data;
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: 'image/png'});
      const file = new File([blob], 'generated-image.png', {type: 'image/png'});

      return {file, base64};
    }
  }

  throw new Error('Response did not contain image data.');
};

export const generateVideo = async (
  params: GenerateVideoParams,
): Promise<{objectUrl: string; blob: Blob; uri: string; video: Video}> => {
  console.log('Starting video generation with params:', params);

  const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

  const config: any = {
    numberOfVideos: 1,
    resolution: params.resolution,
  };

  if (params.mode !== GenerationMode.EXTEND_VIDEO) {
    config.aspectRatio = params.aspectRatio;
  }

  const generateVideoPayload: any = {
    model: params.model,
    config: config,
  };

  if (params.prompt) {
    generateVideoPayload.prompt = params.prompt;
  }

  if (params.mode === GenerationMode.FRAMES_TO_VIDEO) {
    if (params.startFrame) {
      generateVideoPayload.image = {
        imageBytes: params.startFrame.base64,
        mimeType: params.startFrame.file.type,
      };
      console.log(
        `Generating with start frame: ${params.startFrame.file.name}`,
      );
    }

    const finalEndFrame = params.isLooping
      ? params.startFrame
      : params.endFrame;
    if (finalEndFrame) {
      generateVideoPayload.config.lastFrame = {
        imageBytes: finalEndFrame.base64,
        mimeType: finalEndFrame.file.type,
      };
      if (params.isLooping) {
        console.log(
          `Generating a looping video using start frame as end frame: ${finalEndFrame.file.name}`,
        );
      } else {
        console.log(`Generating with end frame: ${finalEndFrame.file.name}`);
      }
    }

    // Handle Optional Middle Frame by passing it as a Reference Image
    if (params.middleFrame) {
       console.log(`Adding middle frame as reference: ${params.middleFrame.file.name}`);
       generateVideoPayload.config.referenceImages = [{
          image: {
            imageBytes: params.middleFrame.base64,
            mimeType: params.middleFrame.file.type,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
       }];
    }

  } else if (params.mode === GenerationMode.REFERENCES_TO_VIDEO) {
    const referenceImagesPayload: VideoGenerationReferenceImage[] = [];

    if (params.referenceImages) {
      for (const img of params.referenceImages) {
        console.log(`Adding reference image: ${img.file.name}`);
        referenceImagesPayload.push({
          image: {
            imageBytes: img.base64,
            mimeType: img.file.type,
          },
          referenceType: VideoGenerationReferenceType.ASSET,
        });
      }
    }

    if (params.styleImage) {
      console.log(
        `Adding style image as a reference: ${params.styleImage.file.name}`,
      );
      referenceImagesPayload.push({
        image: {
          imageBytes: params.styleImage.base64,
          mimeType: params.styleImage.file.type,
        },
        referenceType: VideoGenerationReferenceType.STYLE,
      });
    }

    if (referenceImagesPayload.length > 0) {
      generateVideoPayload.config.referenceImages = referenceImagesPayload;
    }
  } else if (params.mode === GenerationMode.EXTEND_VIDEO) {
    if (params.inputVideoObject) {
      generateVideoPayload.video = params.inputVideoObject;
      console.log(`Generating extension from input video object.`);
    } else {
      throw new Error('An input video object is required to extend a video.');
    }
  }

  console.log('Submitting video generation request...', generateVideoPayload);
  let operation = await ai.models.generateVideos(generateVideoPayload);
  console.log('Video generation operation started:', operation);

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    // We must refresh the operation status
    operation = await ai.operations.getVideosOperation({operation: operation});
    
    // Check for errors during polling
    if (operation.error) {
      console.error("Operation Error details:", JSON.stringify(operation.error, null, 2));
      throw new Error(operation.error.message || 'Video generation operation failed during processing.');
    }
  }

  // Final check after done
  if (operation.error) {
     console.error("Operation Error details:", JSON.stringify(operation.error, null, 2));
     throw new Error(operation.error.message || 'Video generation operation failed.');
  }

  if (operation?.response) {
    const videos = operation.response.generatedVideos;

    if (!videos || videos.length === 0) {
      throw new Error('No videos were generated.');
    }

    const firstVideo = videos[0];
    if (!firstVideo?.video?.uri) {
      throw new Error('Generated video is missing a URI.');
    }
    const videoObject = firstVideo.video;

    const url = decodeURIComponent(videoObject.uri);
    console.log('Fetching video from:', url);

    const res = await fetch(`${url}&key=${process.env.API_KEY}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch video: ${res.status} ${res.statusText}`);
    }

    const videoBlob = await res.blob();
    const objectUrl = URL.createObjectURL(videoBlob);

    return {objectUrl, blob: videoBlob, uri: url, video: videoObject};
  } else {
    console.error('Operation failed without explicit error:', operation);
    throw new Error('No videos generated. The operation completed but returned no results.');
  }
};
