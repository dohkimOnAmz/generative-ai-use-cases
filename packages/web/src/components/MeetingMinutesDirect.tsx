import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import queryString from 'query-string';
import Button from './Button';
import ButtonCopy from './ButtonCopy';
import ButtonSendToUseCase from './ButtonSendToUseCase';
import MeetingMinutesGeneration from './MeetingMinutesGeneration';
import useMeetingMinutes, {
  MeetingMinutesStyle,
} from '../hooks/useMeetingMinutes';
import { MODELS } from '../hooks/useModel';

interface MeetingMinutesDirectProps {}

const MeetingMinutesDirect: React.FC<MeetingMinutesDirectProps> = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Internal state management
  const [directInputText, setDirectInputText] = useState('');
  const [minutesStyle, setMinutesStyle] = useState<MeetingMinutesStyle>('faq');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generationFrequency, setGenerationFrequency] = useState(5);
  const [autoGenerateSessionTimestamp, setAutoGenerateSessionTimestamp] =
    useState<number | null>(null);
  const [generatedMinutes, setGeneratedMinutes] = useState('');
  const [, setLastProcessedTranscript] = useState('');
  const [lastGeneratedTime, setLastGeneratedTime] = useState<Date | null>(null);

  // Model selection
  const { modelIds: availableModels, modelDisplayName } = MODELS;
  const [modelId, setModelId] = useState(availableModels[0] || '');

  // Meeting minutes hook
  const {
    loading: minutesLoading,
    generateMinutes,
    clearMinutes,
  } = useMeetingMinutes(
    minutesStyle,
    customPrompt,
    autoGenerateSessionTimestamp,
    setGeneratedMinutes,
    setLastProcessedTranscript,
    setLastGeneratedTime
  );

  // Handle text change
  const handleDirectInputChange = useCallback((text: string) => {
    setDirectInputText(text);
  }, []);

  // Text existence check
  const hasTranscriptText = useMemo(() => {
    return directInputText.trim() !== '';
  }, [directInputText]);

  // Clear function
  const handleClear = useCallback(() => {
    setDirectInputText('');
  }, []);

  // Manual generation handler
  const handleManualGeneration = useCallback(() => {
    if (
      minutesStyle === 'custom' &&
      (!customPrompt || customPrompt.trim() === '')
    ) {
      toast.error(t('meetingMinutes.custom_prompt_placeholder'));
      return;
    }

    if (hasTranscriptText && !minutesLoading) {
      generateMinutes(directInputText, modelId, (status) => {
        if (status === 'success') {
          toast.success(t('meetingMinutes.generation_success'));
        } else if (status === 'error') {
          toast.error(t('meetingMinutes.generation_error'));
        }
      });
    }
  }, [
    hasTranscriptText,
    directInputText,
    minutesLoading,
    modelId,
    generateMinutes,
    t,
    minutesStyle,
    customPrompt,
  ]);

  // Clear minutes handler
  const handleClearMinutes = useCallback(() => {
    clearMinutes();
  }, [clearMinutes]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Left Column - Direct Input */}
      <div>
        {/* Direct Input Content */}
        <div className="mb-4">
          <div className="p-2">
            <p className="mb-2 text-sm text-gray-600">
              {t('transcribe.direct_input_instruction')}
            </p>
          </div>
        </div>

        {/* Clear Button */}
        <div className="flex justify-end gap-3">
          <Button outlined disabled={!hasTranscriptText} onClick={handleClear}>
            {t('common.clear')}
          </Button>
        </div>

        {/* Transcript Panel */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-bold">{t('meetingMinutes.transcript')}</div>
            {hasTranscriptText && (
              <div className="flex">
                <ButtonCopy
                  text={directInputText}
                  interUseCasesKey="transcript"></ButtonCopy>
                <ButtonSendToUseCase text={directInputText} />
              </div>
            )}
          </div>
          <textarea
            value={directInputText}
            onChange={(e) => handleDirectInputChange(e.target.value)}
            placeholder={t('transcribe.direct_input_placeholder')}
            rows={10}
            className="min-h-96 w-full resize-none rounded border border-black/30 p-1.5 outline-none"
          />
        </div>
      </div>

      {/* Right Column - Minutes Generation */}
      <div>
        <MeetingMinutesGeneration
          minutesStyle={minutesStyle}
          onMinutesStyleChange={setMinutesStyle}
          modelId={modelId}
          onModelChange={setModelId}
          availableModels={availableModels}
          modelDisplayName={modelDisplayName}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          autoGenerate={autoGenerate}
          onAutoGenerateChange={setAutoGenerate}
          onAutoGenerateSessionTimestampChange={setAutoGenerateSessionTimestamp}
          generationFrequency={generationFrequency}
          onGenerationFrequencyChange={setGenerationFrequency}
          countdownSeconds={0}
          hasTranscriptText={hasTranscriptText}
          minutesLoading={minutesLoading}
          onManualGeneration={handleManualGeneration}
          onClearMinutes={handleClearMinutes}
          generatedMinutes={generatedMinutes}
          lastGeneratedTime={lastGeneratedTime}
          navigate={navigate}
          queryString={queryString}
        />
      </div>
    </div>
  );
};

export default MeetingMinutesDirect;
