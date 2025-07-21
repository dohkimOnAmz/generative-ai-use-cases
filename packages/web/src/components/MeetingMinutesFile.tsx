import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import ButtonCopy from './ButtonCopy';
import ButtonSendToUseCase from './ButtonSendToUseCase';
import Select from './Select';
import Switch from './Switch';
import RangeSlider from './RangeSlider';
import ExpandableField from './ExpandableField';
import Textarea from './Textarea';

interface MeetingMinutesFileProps {
  /** Handler for file change */
  onFileChange: (file: File | null) => void;
  /** File transcript text */
  fileTranscriptText: string;
  /** Whether there is transcript text */
  hasTranscriptText: boolean;
  /** Handler for clear action */
  onClear: () => void;
  /** Whether clear action is disabled */
  disableClear: boolean;
  /** Handler for speech recognition execution */
  onExecute: () => void;
  /** Whether execution is disabled */
  disableExecution: boolean;
  /** Whether processing is loading */
  loading: boolean;

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
}

const MeetingMinutesFile: React.FC<MeetingMinutesFileProps> = ({
  onFileChange,
  fileTranscriptText,
  hasTranscriptText,
  onClear,
  disableClear,
  onExecute,
  disableExecution,
  loading,
  languageCode,
  onLanguageCodeChange,
  languageOptions,
  speakerLabel,
  onSpeakerLabelChange,
  maxSpeakers,
  onMaxSpeakersChange,
  speakers,
  onSpeakersChange,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileChange(files[0]);
    }
  };

  return (
    <div>
      {/* File Upload Content */}
      <div className="mb-4">
        <div className="p-2">
          <input
            className="border-aws-font-color/20 block h-10 w-full cursor-pointer rounded-lg border
              text-sm text-gray-900 file:mr-4 file:cursor-pointer file:border-0 file:bg-gray-500
              file:px-4 file:py-2.5 file:text-white focus:outline-none"
            onChange={handleFileChange}
            aria-describedby="file_input_help"
            id="file_input"
            type="file"
            accept=".mp3, .mp4, .wav, .flac, .ogg, .amr, .webm, .m4a"
            ref={fileInputRef}></input>
          <p className="ml-0.5 mt-1 text-xs text-gray-500" id="file_input_help">
            {t('transcribe.supported_files')}
          </p>
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button outlined disabled={disableClear} onClick={onClear}>
          {t('common.clear')}
        </Button>
        <Button disabled={disableExecution} onClick={onExecute}>
          {t('meetingMinutes.speech_recognition')}
        </Button>
      </div>

      {/* Transcript Panel */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-bold">{t('meetingMinutes.transcript')}</div>
          {hasTranscriptText && (
            <div className="flex">
              <ButtonCopy
                text={fileTranscriptText}
                interUseCasesKey="transcript"></ButtonCopy>
              <ButtonSendToUseCase text={fileTranscriptText} />
            </div>
          )}
        </div>
        <textarea
          value={fileTranscriptText}
          placeholder={t('transcribe.result_placeholder')}
          rows={10}
          className="min-h-96 w-full resize-none rounded border border-black/30 p-1.5 outline-none"
          readOnly
        />
        {loading && (
          <div className="border-aws-sky size-5 animate-spin rounded-full border-4 border-t-transparent"></div>
        )}
      </div>
    </div>
  );
};

export default MeetingMinutesFile;
