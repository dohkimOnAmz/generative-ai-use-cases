import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import ButtonCopy from './ButtonCopy';
import ButtonIcon from './ButtonIcon';
import Select from './Select';
import Switch from './Switch';
import Textarea from './Textarea';
import Markdown from './Markdown';
import { PiPencilLine } from 'react-icons/pi';
import { MeetingMinutesStyle } from '../hooks/useMeetingMinutes';

interface MeetingMinutesGenerationProps {
  /** Meeting minutes style */
  minutesStyle: MeetingMinutesStyle;
  /** Handler for minutes style change */
  onMinutesStyleChange: (style: MeetingMinutesStyle) => void;
  /** Selected model ID */
  modelId: string;
  /** Handler for model change */
  onModelChange: (modelId: string) => void;
  /** Available model options */
  availableModels: string[];
  /** Function to get model display name */
  modelDisplayName: (id: string) => string;
  /** Custom prompt text */
  customPrompt: string;
  /** Handler for custom prompt change */
  onCustomPromptChange: (prompt: string) => void;
  /** Auto-generation enabled state */
  autoGenerate: boolean;
  /** Handler for auto-generation toggle */
  onAutoGenerateChange: (enabled: boolean) => void;
  /** Handler for session timestamp change */
  onAutoGenerateSessionTimestampChange: (timestamp: number | null) => void;
  /** Generation frequency in minutes */
  generationFrequency: number;
  /** Handler for frequency change */
  onGenerationFrequencyChange: (frequency: number) => void;
  /** Countdown seconds remaining */
  countdownSeconds: number;
  /** Whether transcript text exists */
  hasTranscriptText: boolean;
  /** Whether minutes generation is loading */
  minutesLoading: boolean;
  /** Handler for manual generation */
  onManualGeneration: () => void;
  /** Handler for clearing minutes */
  onClearMinutes: () => void;
  /** Generated minutes text */
  generatedMinutes: string;
  /** Last generation time */
  lastGeneratedTime: Date | null;
  /** Navigation function */
  navigate: (path: string) => void;
  /** Query string utility */
  queryString: { stringify: (obj: Record<string, unknown>) => string };
}

const MeetingMinutesGeneration: React.FC<MeetingMinutesGenerationProps> = ({
  minutesStyle,
  onMinutesStyleChange,
  modelId,
  onModelChange,
  availableModels,
  modelDisplayName,
  customPrompt,
  onCustomPromptChange,
  autoGenerate,
  onAutoGenerateChange,
  onAutoGenerateSessionTimestampChange,
  generationFrequency,
  onGenerationFrequencyChange,
  countdownSeconds,
  hasTranscriptText,
  minutesLoading,
  onManualGeneration,
  onClearMinutes,
  generatedMinutes,
  lastGeneratedTime,
  navigate,
  queryString,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Meeting Minutes Configuration */}
      <div className="mb-4">
        <div className="mb-4">
          <label className="mb-2 block font-bold">
            {t('meetingMinutes.style')}
          </label>
          <Select
            value={minutesStyle}
            onChange={(value) =>
              onMinutesStyleChange(value as typeof minutesStyle)
            }
            options={[
              {
                value: 'faq',
                label: t('meetingMinutes.style_faq'),
              },
              {
                value: 'newspaper',
                label: t('meetingMinutes.style_newspaper'),
              },
              {
                value: 'transcription',
                label: t('meetingMinutes.style_transcription'),
              },
              {
                value: 'custom',
                label: t('meetingMinutes.style_custom'),
              },
            ]}
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block font-bold">
            {t('meetingMinutes.model')}
          </label>
          <Select
            value={modelId}
            onChange={onModelChange}
            options={availableModels.map((id: string) => ({
              value: id,
              label: modelDisplayName(id),
            }))}
          />
        </div>

        {/* Show custom prompt textarea when custom style is selected */}
        {minutesStyle === 'custom' && (
          <div className="mb-4">
            <Textarea
              label={t('meetingMinutes.custom_prompt')}
              value={customPrompt}
              onChange={onCustomPromptChange}
              placeholder={t('meetingMinutes.custom_prompt_placeholder')}
              rows={4}
            />
          </div>
        )}

        {/* Auto-generation controls */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Switch
              label={t('meetingMinutes.auto_generate')}
              checked={autoGenerate}
              onSwitch={(checked) => {
                onAutoGenerateChange(checked);
                if (checked) {
                  onAutoGenerateSessionTimestampChange(Date.now());
                } else {
                  onAutoGenerateSessionTimestampChange(null);
                }
              }}
            />
            {autoGenerate && countdownSeconds > 0 && (
              <div className="text-sm text-gray-600">
                {t('meetingMinutes.next_generation_in')}
                {Math.floor(countdownSeconds / 60)}
                {t('common.colon')}
                {(countdownSeconds % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
        {autoGenerate && (
          <div className="mb-4">
            <Select
              label={t('meetingMinutes.frequency')}
              value={generationFrequency.toString()}
              onChange={(value) => onGenerationFrequencyChange(parseInt(value))}
              options={[
                {
                  value: '1',
                  label: t('meetingMinutes.frequency_1min'),
                },
                {
                  value: '5',
                  label: t('meetingMinutes.frequency_5min'),
                },
                {
                  value: '10',
                  label: t('meetingMinutes.frequency_10min'),
                },
              ]}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button outlined onClick={onClearMinutes}>
            {t('common.clear')}
          </Button>
          <Button
            onClick={onManualGeneration}
            disabled={
              !hasTranscriptText ||
              minutesLoading ||
              (minutesStyle === 'custom' &&
                (!customPrompt || customPrompt.trim() === ''))
            }>
            {t('meetingMinutes.generate')}
          </Button>
        </div>
      </div>

      {/* Generated Minutes Panel */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-bold">
              {t('meetingMinutes.generated_minutes')}
            </div>
            {lastGeneratedTime && (
              <div className="text-sm text-gray-500">
                {t('meetingMinutes.last_generated', {
                  time: lastGeneratedTime.toLocaleTimeString(),
                })}
              </div>
            )}
          </div>
          {generatedMinutes.trim() !== '' && (
            <div className="flex gap-2">
              <ButtonCopy text={generatedMinutes} interUseCasesKey="minutes" />
              <ButtonIcon
                onClick={() => {
                  navigate(
                    `/writer?${queryString.stringify({ sentence: generatedMinutes })}`
                  );
                }}
                title={t('navigation.writing')}>
                <PiPencilLine />
              </ButtonIcon>
            </div>
          )}
        </div>
        <div className="min-h-96 rounded border border-black/30 p-1.5">
          <Markdown>{generatedMinutes}</Markdown>
          {!minutesLoading && generatedMinutes === '' && (
            <div className="text-gray-500">
              {t('meetingMinutes.minutes_placeholder')}
            </div>
          )}
        </div>
        {minutesLoading && (
          <div className="flex items-center gap-2">
            <div className="border-aws-sky size-5 animate-spin rounded-full border-4 border-t-transparent"></div>
            <span className="text-sm text-gray-600">
              {t('meetingMinutes.generating')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingMinutesGeneration;
