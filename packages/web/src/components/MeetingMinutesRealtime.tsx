import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import ButtonCopy from './ButtonCopy';
import ButtonSendToUseCase from './ButtonSendToUseCase';
import Select from './Select';
import Switch from './Switch';
import RangeSlider from './RangeSlider';
import ExpandableField from './ExpandableField';
import Textarea from './Textarea';
import ScreenAudioToggle from './ScreenAudioToggle';
import { PiStopCircleBold, PiMicrophoneBold } from 'react-icons/pi';

interface MeetingMinutesRealtimeProps {
  /** Realtime transcript text */
  realtimeText: string;
  /** Whether there is transcript text */
  hasTranscriptText: boolean;
  /** Handler for clear action */
  onClear: () => void;
  /** Whether clear action is disabled */
  disableClear: boolean;
  /** Whether microphone execution is disabled */
  disableMicExecution: boolean;

  // Recording state
  /** Whether recording is active */
  isRecording: boolean;
  /** Handler to start transcription */
  onStartTranscription: () => void;
  /** Handler to stop microphone transcription */
  onStopMicTranscription: () => void;
  /** Handler to stop screen transcription */
  onStopScreenTranscription: () => void;

  // Screen Audio
  /** Whether screen audio is enabled */
  enableScreenAudio: boolean;
  /** Handler for screen audio toggle */
  onScreenAudioToggle: (enabled: boolean) => void;
  /** Whether screen audio is supported */
  isScreenAudioSupported: boolean;
  /** Screen audio error message */
  screenAudioError: string | null;

  // Audio recognition settings
  /** Language code */
  languageCode: string;
  /** Handler for language code change */
  onLanguageCodeChange: (code: string) => void;
  /** Language options */
  languageOptions: Array<{ value: string; label: string }>;
  /** Speaker recognition enabled */
  speakerLabel: boolean;
  /** Handler for speaker label change */
  onSpeakerLabelChange: (enabled: boolean) => void;
  /** Maximum speakers */
  maxSpeakers: number;
  /** Handler for max speakers change */
  onMaxSpeakersChange: (count: number) => void;
  /** Speaker names */
  speakers: string;
  /** Handler for speakers change */
  onSpeakersChange: (names: string) => void;

  // Textarea refs
  /** Textarea ref for scroll management */
  transcriptTextareaRef: React.RefObject<HTMLTextAreaElement>;
  /** Ref for tracking if user is at bottom */
  isAtBottomRef: React.RefObject<boolean>;
}

const MeetingMinutesRealtime: React.FC<MeetingMinutesRealtimeProps> = ({
  realtimeText,
  hasTranscriptText,
  onClear,
  disableClear,
  disableMicExecution,
  isRecording,
  onStartTranscription,
  onStopMicTranscription,
  onStopScreenTranscription,
  enableScreenAudio,
  onScreenAudioToggle,
  isScreenAudioSupported,
  screenAudioError,
  languageCode,
  onLanguageCodeChange,
  languageOptions,
  speakerLabel,
  onSpeakerLabelChange,
  maxSpeakers,
  onMaxSpeakersChange,
  speakers,
  onSpeakersChange,
  transcriptTextareaRef,
  isAtBottomRef,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Microphone Input Content */}
      <div className="mb-4">
        <div className="p-2">
          <div className="flex justify-center">
            {isRecording ? (
              <Button
                className="h-10 w-full"
                onClick={() => {
                  onStopMicTranscription();
                  onStopScreenTranscription();
                }}
                disabled={disableMicExecution}>
                <PiStopCircleBold className="mr-2 h-5 w-5" />
                {t('transcribe.stop_recording')}
              </Button>
            ) : (
              <Button
                className="h-10 w-full"
                disabled={disableMicExecution}
                onClick={() => {
                  if (!disableMicExecution) {
                    onStartTranscription();
                  }
                }}
                outlined={true}>
                <PiMicrophoneBold className="mr-2 h-5 w-5" />
                {t('transcribe.start_recording')}
              </Button>
            )}
          </div>
          <ScreenAudioToggle
            enabled={enableScreenAudio}
            onToggle={onScreenAudioToggle}
            isSupported={isScreenAudioSupported}
          />
        </div>
      </div>

      {/* Language Selection */}
      <div className="mb-4 px-2">
        <label className="mb-2 block font-bold">
          {t('meetingMinutes.language')}
        </label>
        <Select
          value={languageCode}
          onChange={onLanguageCodeChange}
          options={languageOptions}
        />
      </div>

      {/* Speaker Recognition Parameters */}
      <ExpandableField
        label={t('transcribe.detailed_parameters')}
        className="mb-4"
        notItem={true}>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Switch
            label={t('transcribe.speaker_recognition')}
            checked={speakerLabel}
            onSwitch={onSpeakerLabelChange}
          />
          {speakerLabel && (
            <RangeSlider
              className=""
              label={t('transcribe.max_speakers')}
              min={2}
              max={10}
              value={maxSpeakers}
              onChange={onMaxSpeakersChange}
              help={t('transcribe.max_speakers_help')}
            />
          )}
        </div>
        {speakerLabel && (
          <div className="mt-2">
            <Textarea
              placeholder={t('transcribe.speaker_names')}
              value={speakers}
              onChange={onSpeakersChange}
            />
          </div>
        )}
      </ExpandableField>

      {/* Screen Audio Error Display */}
      {screenAudioError && (
        <div className="mb-4 mt-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <strong>{t('meetingMinutes.screen_audio_error')}</strong>
          {t('common.colon')} {screenAudioError}
        </div>
      )}

      {/* Clear Button */}
      <div className="flex justify-end gap-3">
        <Button outlined disabled={disableClear} onClick={onClear}>
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
                text={realtimeText}
                interUseCasesKey="transcript"></ButtonCopy>
              <ButtonSendToUseCase text={realtimeText} />
            </div>
          )}
        </div>
        <textarea
          ref={transcriptTextareaRef}
          value={realtimeText}
          onScroll={(e) => {
            // Check if user is at the bottom of the textarea
            const target = e.target as HTMLTextAreaElement;
            const isAtBottom =
              Math.abs(
                target.scrollHeight - target.clientHeight - target.scrollTop
              ) < 3;
            if (isAtBottomRef.current) {
              isAtBottomRef.current = isAtBottom;
            }
          }}
          placeholder={t('transcribe.result_placeholder')}
          rows={10}
          className="min-h-96 w-full resize-none rounded border border-black/30 p-1.5 outline-none"
          readOnly
        />
      </div>
    </div>
  );
};

export default MeetingMinutesRealtime;
