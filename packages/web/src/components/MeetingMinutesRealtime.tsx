import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import queryString from 'query-string';
import { LanguageCode } from '@aws-sdk/client-transcribe-streaming';
import { Transcript } from 'generative-ai-use-cases';
import Button from './Button';
import ButtonCopy from './ButtonCopy';
import ButtonSendToUseCase from './ButtonSendToUseCase';
import Select from './Select';
import Switch from './Switch';
import RangeSlider from './RangeSlider';
import ExpandableField from './ExpandableField';
import Textarea from './Textarea';
import ScreenAudioToggle from './ScreenAudioToggle';
import MeetingMinutesGeneration from './MeetingMinutesGeneration';
import { PiStopCircleBold, PiMicrophoneBold } from 'react-icons/pi';
import useMicrophone from '../hooks/useMicrophone';
import useScreenAudio from '../hooks/useScreenAudio';
import useMeetingMinutes, {
  MeetingMinutesStyle,
} from '../hooks/useMeetingMinutes';
import { MODELS } from '../hooks/useModel';

// Real-time transcript segment for chronological integration
interface RealtimeSegment {
  resultId: string;
  source: 'microphone' | 'screen';
  startTime: number;
  endTime: number;
  isPartial: boolean;
  transcripts: Transcript[];
}

interface MeetingMinutesRealtimeProps {}

const MeetingMinutesRealtime: React.FC<MeetingMinutesRealtimeProps> = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const transcriptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldGenerateRef = useRef<boolean>(false);

  // Microphone and screen audio hooks
  const {
    startTranscription: startMicTranscription,
    stopTranscription: stopMicTranscription,
    recording: micRecording,
    clearTranscripts: clearMicTranscripts,
    rawTranscripts: micRawTranscripts,
  } = useMicrophone();

  const {
    prepareScreenCapture,
    startTranscriptionWithStream,
    stopTranscription: stopScreenTranscription,
    recording: screenRecording,
    clearTranscripts: clearScreenTranscripts,
    isSupported: isScreenAudioSupported,
    error: screenAudioError,
    rawTranscripts: screenRawTranscripts,
  } = useScreenAudio();

  // Internal state management
  const [languageCode, setLanguageCode] = useState('auto');
  const [speakerLabel, setSpeakerLabel] = useState(false);
  const [maxSpeakers, setMaxSpeakers] = useState(4);
  const [speakers, setSpeakers] = useState('');
  const [enableScreenAudio, setEnableScreenAudio] = useState(false);
  const [realtimeSegments, setRealtimeSegments] = useState<RealtimeSegment[]>(
    []
  );
  const [minutesStyle, setMinutesStyle] = useState<MeetingMinutesStyle>('faq');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generationFrequency, setGenerationFrequency] = useState(5);
  const [autoGenerateSessionTimestamp, setAutoGenerateSessionTimestamp] =
    useState<number | null>(null);
  const [generatedMinutes, setGeneratedMinutes] = useState('');
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  const [lastGeneratedTime, setLastGeneratedTime] = useState<Date | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

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

  // Language options
  const languageOptions = useMemo(
    () => [
      { value: 'auto', label: t('meetingMinutes.language_auto') },
      { value: 'ja-JP', label: t('meetingMinutes.language_japanese') },
      { value: 'en-US', label: t('meetingMinutes.language_english') },
      { value: 'zh-CN', label: t('meetingMinutes.language_chinese') },
      { value: 'ko-KR', label: t('meetingMinutes.language_korean') },
      { value: 'th-TH', label: t('meetingMinutes.language_thai') },
      { value: 'vi-VN', label: t('meetingMinutes.language_vietnamese') },
    ],
    [t]
  );

  // Speaker mapping
  const speakerMapping = useMemo(() => {
    return Object.fromEntries(
      speakers.split(',').map((speaker, idx) => [`spk_${idx}`, speaker.trim()])
    );
  }, [speakers]);

  // Map i18n language to transcription language
  const getTranscriptionLanguageFromSettings = useCallback(
    (settingsLang: string): string => {
      const langMapping: { [key: string]: string } = {
        ja: 'ja-JP',
        en: 'en-US',
        zh: 'zh-CN',
        ko: 'ko-KR',
        th: 'th-TH',
        vi: 'vi-VN',
      };
      return langMapping[settingsLang] || 'auto';
    },
    []
  );

  // Set language from settings on mount
  useEffect(() => {
    if (i18n.resolvedLanguage && languageCode === 'auto') {
      const mappedLang = getTranscriptionLanguageFromSettings(
        i18n.resolvedLanguage
      );
      if (mappedLang !== 'auto') {
        setLanguageCode(mappedLang);
      }
    }
  }, [
    i18n.resolvedLanguage,
    languageCode,
    getTranscriptionLanguageFromSettings,
  ]);

  // Helper function to format time in MM:SS format
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Real-time text output
  const realtimeText: string = useMemo(() => {
    const sortedSegments = [...realtimeSegments].sort(
      (a, b) => a.startTime - b.startTime
    );

    return sortedSegments
      .map((segment) => {
        const timeStr = `[${formatTime(segment.startTime)}]`;
        const partialIndicator = segment.isPartial ? ' (...)' : '';

        return segment.transcripts
          .map((transcript) => {
            const speakerLabel = transcript.speakerLabel
              ? `${speakerMapping[transcript.speakerLabel] || transcript.speakerLabel}: `
              : '';
            return `${timeStr} ${speakerLabel}${transcript.transcript}${partialIndicator}`;
          })
          .join('\n');
      })
      .join('\n');
  }, [realtimeSegments, speakerMapping, formatTime]);

  // Auto scroll to bottom when transcript updates if user was at bottom
  useEffect(() => {
    if (
      transcriptTextareaRef.current &&
      isAtBottomRef.current &&
      realtimeText
    ) {
      setTimeout(() => {
        if (transcriptTextareaRef.current) {
          transcriptTextareaRef.current.scrollTop =
            transcriptTextareaRef.current.scrollHeight;
        }
      }, 10);
    }
  }, [realtimeText]);

  // Text existence check
  const hasTranscriptText = useMemo(() => {
    return realtimeText.trim() !== '';
  }, [realtimeText]);

  // Real-time integration of raw transcripts
  const updateRealtimeSegments = useCallback((newSegment: RealtimeSegment) => {
    setRealtimeSegments((prev) => {
      const existingIndex = prev.findIndex(
        (seg) =>
          seg.resultId === newSegment.resultId &&
          seg.source === newSegment.source
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newSegment;
        return updated;
      } else {
        return [...prev, newSegment];
      }
    });
  }, []);

  // Process microphone raw transcripts
  useEffect(() => {
    if (micRawTranscripts && micRawTranscripts.length > 0) {
      const latestSegment = micRawTranscripts[micRawTranscripts.length - 1];
      const segment: RealtimeSegment = {
        resultId: latestSegment.resultId,
        source: 'microphone',
        startTime: latestSegment.startTime,
        endTime: latestSegment.endTime,
        isPartial: latestSegment.isPartial,
        transcripts: latestSegment.transcripts,
      };
      updateRealtimeSegments(segment);
    }
  }, [micRawTranscripts, updateRealtimeSegments]);

  // Process screen audio raw transcripts
  useEffect(() => {
    if (
      enableScreenAudio &&
      screenRawTranscripts &&
      screenRawTranscripts.length > 0
    ) {
      const latestSegment =
        screenRawTranscripts[screenRawTranscripts.length - 1];
      const segment: RealtimeSegment = {
        resultId: latestSegment.resultId,
        source: 'screen',
        startTime: latestSegment.startTime,
        endTime: latestSegment.endTime,
        isPartial: latestSegment.isPartial,
        transcripts: latestSegment.transcripts,
      };
      updateRealtimeSegments(segment);
    }
  }, [screenRawTranscripts, enableScreenAudio, updateRealtimeSegments]);

  // Recording states
  const isRecording = micRecording || screenRecording;

  // Clear function
  const handleClear = useCallback(() => {
    setRealtimeSegments([]);
    stopMicTranscription();
    stopScreenTranscription();
    clearMicTranscripts();
    clearScreenTranscripts();
  }, [
    stopMicTranscription,
    stopScreenTranscription,
    clearMicTranscripts,
    clearScreenTranscripts,
  ]);

  // Start transcription
  const onClickExecStartTranscription = useCallback(async () => {
    setRealtimeSegments([]);
    clearMicTranscripts();
    clearScreenTranscripts();

    const langCode =
      languageCode === 'auto' ? undefined : (languageCode as LanguageCode);

    try {
      let screenStream: MediaStream | null = null;
      if (enableScreenAudio && isScreenAudioSupported) {
        screenStream = await prepareScreenCapture();
      }

      if (screenStream) {
        startTranscriptionWithStream(screenStream, langCode, speakerLabel);
      }
      startMicTranscription(langCode, speakerLabel);
    } catch (error) {
      console.error('Failed to start synchronized recording:', error);
      startMicTranscription(langCode, speakerLabel);
    }
  }, [
    languageCode,
    speakerLabel,
    startMicTranscription,
    enableScreenAudio,
    isScreenAudioSupported,
    prepareScreenCapture,
    startTranscriptionWithStream,
    clearMicTranscripts,
    clearScreenTranscripts,
  ]);

  // Watch for generation signal and trigger generation
  useEffect(() => {
    if (
      shouldGenerateRef.current &&
      autoGenerate &&
      realtimeText.trim() !== ''
    ) {
      if (realtimeText !== lastProcessedTranscript && !minutesLoading) {
        shouldGenerateRef.current = false;
        generateMinutes(realtimeText, modelId, (status) => {
          if (status === 'success') {
            toast.success(t('meetingMinutes.generation_success'));
          } else if (status === 'error') {
            toast.error(t('meetingMinutes.generation_error'));
          }
        });
      } else {
        shouldGenerateRef.current = false;
      }
    }
  }, [
    countdownSeconds,
    autoGenerate,
    realtimeText,
    lastProcessedTranscript,
    minutesLoading,
    generateMinutes,
    modelId,
    t,
  ]);

  // Auto-generation countdown setup
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!autoGenerate || generationFrequency <= 0) {
      setCountdownSeconds(0);
      return;
    }

    const totalSeconds = generationFrequency * 60;
    setCountdownSeconds(totalSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          shouldGenerateRef.current = true;
          return totalSeconds;
        }
        return newValue;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [autoGenerate, generationFrequency]);

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
      generateMinutes(realtimeText, modelId, (status) => {
        if (status === 'success') {
          toast.success(t('meetingMinutes.generation_success'));
        } else if (status === 'error') {
          toast.error(t('meetingMinutes.generation_error'));
        }
      });
    }
  }, [
    hasTranscriptText,
    realtimeText,
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
      {/* Left Column - Microphone Input */}
      <div>
        {/* Microphone Input Content */}
        <div className="mb-4">
          <div className="p-2">
            <div className="flex justify-center">
              {isRecording ? (
                <Button
                  className="h-10 w-full"
                  onClick={() => {
                    stopMicTranscription();
                    stopScreenTranscription();
                  }}>
                  <PiStopCircleBold className="mr-2 h-5 w-5" />
                  {t('transcribe.stop_recording')}
                </Button>
              ) : (
                <Button
                  className="h-10 w-full"
                  onClick={onClickExecStartTranscription}
                  outlined={true}>
                  <PiMicrophoneBold className="mr-2 h-5 w-5" />
                  {t('transcribe.start_recording')}
                </Button>
              )}
            </div>
            <ScreenAudioToggle
              enabled={enableScreenAudio}
              onToggle={setEnableScreenAudio}
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
            onChange={setLanguageCode}
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
              onSwitch={setSpeakerLabel}
            />
            {speakerLabel && (
              <RangeSlider
                className=""
                label={t('transcribe.max_speakers')}
                min={2}
                max={10}
                value={maxSpeakers}
                onChange={setMaxSpeakers}
                help={t('transcribe.max_speakers_help')}
              />
            )}
          </div>
          {speakerLabel && (
            <div className="mt-2">
              <Textarea
                placeholder={t('transcribe.speaker_names')}
                value={speakers}
                onChange={setSpeakers}
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
          <Button
            outlined
            disabled={!hasTranscriptText && !isRecording}
            onClick={handleClear}>
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
          countdownSeconds={countdownSeconds}
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

export default MeetingMinutesRealtime;
