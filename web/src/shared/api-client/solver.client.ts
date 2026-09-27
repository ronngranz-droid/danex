import type { SolveMode, SolveResult, UsageStats } from '../types/solver.types';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api/v1';
  }
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export class SolverApiClient {
  static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  static async getUsageStats(): Promise<UsageStats | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/usage`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  static async solveText(
    prompt: string,
    mode: SolveMode = 'QUICK',
    language: string = 'id',
    inputSource: string = 'DESKTOP_WEB'
  ): Promise<SolveResult> {
    const res = await fetch(`${API_BASE_URL}/solve/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        mode,
        language,
        inputSource,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.explanation || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    return {
      ...data,
      id: crypto.randomUUID(),
      solveMode: mode,
      inputSource,
      timestamp: Date.now(),
    };
  }

  static async solveVision(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    prompt?: string,
    mode: SolveMode = 'QUICK',
    language: string = 'id'
  ): Promise<SolveResult> {
    // Strip data url prefix if present
    const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const res = await fetch(`${API_BASE_URL}/solve/vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: cleanBase64,
        mimeType,
        prompt: prompt || '',
        mode,
        language,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.explanation || `Vision API failed with ${res.status}`);
    }

    const data = await res.json();
    return {
      ...data,
      id: crypto.randomUUID(),
      solveMode: mode,
      inputSource: 'VISION_SCAN',
      timestamp: Date.now(),
      imageThumbnail: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`,
    };
  }
}
