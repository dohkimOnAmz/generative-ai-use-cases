import { useMemo, useCallback, useState } from 'react';
import { getPrompter } from '../prompts';
import { MODELS, findModelByModelId } from './useModel';
import useChatApi from '../hooks/useChatApi';

const useRealtimeTranslation = () => {
  const { predict } = useChatApi();
  const { modelIds, lightModelIds } = MODELS;
  const [translating, setTranslating] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Get available models sorted by priority: Haiku > Nova Pro > Others
  const availableModels = useMemo(() => {
    const allModels = [...modelIds];

    // Sort by priority: Claude 3.5 Haiku first, then Nova Pro, then others
    return allModels.sort((a, b) => {
      const isHaikuA = a.includes('claude-3-5-haiku');
      const isHaikuB = b.includes('claude-3-5-haiku');
      const isNovaProA = a.includes('nova-pro');
      const isNovaProB = b.includes('nova-pro');

      if (isHaikuA && !isHaikuB) return -1;
      if (!isHaikuA && isHaikuB) return 1;
      if (isNovaProA && !isNovaProB) return -1;
      if (!isNovaProA && isNovaProB) return 1;

      return a.localeCompare(b);
    });
  }, [modelIds]);

  // Default model is the first one (Haiku or Nova Pro)
  const defaultModelId = useMemo(() => {
    return availableModels[0] || lightModelIds[0] || modelIds[0];
  }, [availableModels, lightModelIds, modelIds]);

  const translate = useCallback(
    async (
      segmentId: string,
      sentence: string,
      modelId: string,
      targetLanguage: string = 'Japanese'
    ): Promise<string | null> => {
      const translationKey = `${segmentId}-${modelId}`;

      if (translating[translationKey] || !sentence.trim()) {
        return null;
      }

      setTranslating((prev) => ({ ...prev, [translationKey]: true }));

      try {
        // Translate using the same mechanism as the Translation use case
        const id = '/realtime-translate';
        const prompter = getPrompter(modelId);
        const systemPrompt = prompter.systemContext(id);
        const translationPrompt = prompter.translatePrompt({
          sentence,
          language: targetLanguage,
          context: undefined,
        });
        const model = findModelByModelId(modelId);

        if (!model) {
          throw new Error(`Model not found: ${modelId}`);
        }

        const messages = [
          {
            role: 'system' as const,
            content: systemPrompt,
          },
          {
            role: 'user' as const,
            content: translationPrompt,
          },
        ];

        const translatedWithTag = await predict({
          model,
          messages,
          id,
        });

        // Remove output tags
        const translated = translatedWithTag
          .replace(/(<o>|<\/output>)/g, '')
          .trim();

        return translated;
      } catch (error) {
        console.error('Translation failed:', error);
        return null;
      } finally {
        setTranslating((prev) => {
          const updated = { ...prev };
          delete updated[translationKey];
          return updated;
        });
      }
    },
    [translating, predict]
  );

  const isTranslating = useCallback(
    (segmentId: string, modelId: string) => {
      return translating[`${segmentId}-${modelId}`] || false;
    },
    [translating]
  );

  return {
    availableModels,
    defaultModelId,
    translate,
    isTranslating,
  };
};

export default useRealtimeTranslation;
