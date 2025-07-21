import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react';
import { create } from 'zustand';
import Card from '../components/Card';
import useTranscribe from '../hooks/useTranscribe';
import useMicrophone from '../hooks/useMicrophone';
import useScreenAudio from '../hooks/useScreenAudio';
import useMeetingMinutes from '../hooks/useMeetingMinutes';
import { MODELS } from '../hooks/useModel';
import { PiMicrophoneBold, PiPencilLine, PiPaperclip } from 'react-icons/pi';
import MeetingMinutesGeneration from '../components/MeetingMinutesGeneration';
import MeetingMinutesRealtime from '../components/MeetingMinutesRealtime';
import MeetingMinutesDirect from '../components/MeetingMinutesDirect';
import MeetingMinutesFile from '../components/MeetingMinutesFile';
import { Transcript } from 'generative-ai-use-cases';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import queryString from 'query-string';
import { MeetingMinutesStyle } from '../hooks/useMeetingMinutes';
import { LanguageCode } from '@aws-sdk/client-transcribe-streaming';
import { InputMethod } from '../types/MeetingMinutesTypes';

// Real-time transcript segment for chronological integration
interface RealtimeSegment {
  resultId: string;
  source: 'microphone' | 'screen';
  startTime: number;
  endTime: number;
  isPartial: boolean;
  transcripts: Transcript[];
}

type StateType = {
  content: Transcript[];
  setContent: (c: Transcript[]) => void;
  speakerLabel: boolean;
  setSpeakerLabel: (b: boolean) => void;
  maxSpeakers: number;
  setMaxSpeakers: (n: number) => void;
  speakers: string;
  setSpeakers: (s: string) => void;
  generatedMinutes: string;
  setGeneratedMinutes: (s: string) => void;
  lastProcessedTranscript: string;
  setLastProcessedTranscript: (s: string) => void;
  lastGeneratedTime: Date | null;
  setLastGeneratedTime: (d: Date | null) => void;
  minutesStyle: MeetingMinutesStyle;
  setMinutesStyle: (s: MeetingMinutesStyle) => void;
  autoGenerate: boolean;
  setAutoGenerate: (b: boolean) => void;
  generationFrequency: number;
  setGenerationFrequency: (n: number) => void;
  customPrompt: string;
  setCustomPrompt: (s: string) => void;
  autoGenerateSessionTimestamp: number | null;
  setAutoGenerateSessionTimestamp: (timestamp: number | null) => void;
  languageCode: string;
  setLanguageCode: (s: string) => void;
};

const useMeetingMinutesState = create<StateType>((set) => {
  return {
    content: [],
    speakerLabel: false, // Disabled by default per requirements
    maxSpeakers: 4, // Reasonable default for meetings
    speakers: '',
    generatedMinutes: '',
    lastProcessedTranscript: '',
    lastGeneratedTime: null,
    minutesStyle: 'faq' as MeetingMinutesStyle,
    autoGenerate: false,
    generationFrequency: 5,
    customPrompt: '',
    autoGenerateSessionTimestamp: null,
    languageCode: 'auto', // Default to auto-detection
    setContent: (s: Transcript[]) => {
      set(() => ({
        content: s,
      }));
    },
    setSpeakerLabel: (b: boolean) => {
      set(() => ({
        speakerLabel: b,
      }));
    },
    setMaxSpeakers: (n: number) => {
      set(() => ({
        maxSpeakers: n,
      }));
    },
    setSpeakers: (s: string) => {
      set(() => ({
        speakers: s,
      }));
    },
    setGeneratedMinutes: (s: string) => {
      set(() => ({
        generatedMinutes: s,
      }));
    },
    setLastProcessedTranscript: (s: string) => {
      set(() => ({
        lastProcessedTranscript: s,
      }));
    },
    setLastGeneratedTime: (d: Date | null) => {
      set(() => ({
        lastGeneratedTime: d,
      }));
    },
    setMinutesStyle: (s: MeetingMinutesStyle) => {
      set(() => ({
        minutesStyle: s,
      }));
    },
    setAutoGenerate: (b: boolean) => {
      set(() => ({
        autoGenerate: b,
      }));
    },
    setGenerationFrequency: (n: number) => {
      set(() => ({
        generationFrequency: n,
      }));
    },
    setCustomPrompt: (s: string) => {
      set(() => ({
        customPrompt: s,
      }));
    },
    setAutoGenerateSessionTimestamp: (timestamp: number | null) => {
      set(() => ({
        autoGenerateSessionTimestamp: timestamp,
      }));
    },
    setLanguageCode: (s: string) => {
      set(() => ({
        languageCode: s,
      }));
    },
  };
});

const MeetingMinutesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { loading, transcriptData, file, setFile, transcribe, clear } =
    useTranscribe();
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
  const {
    speakerLabel,
    setSpeakerLabel,
    maxSpeakers,
    setMaxSpeakers,
    speakers,
    setSpeakers,
    generatedMinutes,
    setGeneratedMinutes,
    lastProcessedTranscript,
    setLastProcessedTranscript,
    lastGeneratedTime,
    setLastGeneratedTime,
    minutesStyle,
    setMinutesStyle,
    autoGenerate,
    setAutoGenerate,
    generationFrequency,
    setGenerationFrequency,
    customPrompt,
    setCustomPrompt,
    autoGenerateSessionTimestamp,
    setAutoGenerateSessionTimestamp,
    languageCode,
    setLanguageCode,
  } = useMeetingMinutesState();
  const ref = useRef<HTMLInputElement>(null);
  const transcriptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldGenerateRef = useRef<boolean>(false);
  const isAtBottomRef = useRef<boolean>(true);

  // Countdown state for auto-generation timer
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Screen Audio enable/disable state
  const [enableScreenAudio, setEnableScreenAudio] = useState(false);

  // Input method selection state
  const [inputMethod, setInputMethod] = useState<InputMethod>('microphone');

  // Direct input text state
  const [directInputText, setDirectInputText] = useState('');

  // File upload transcript text state
  const [fileTranscriptText, setFileTranscriptText] = useState('');

  // Real-time segments management
  const [realtimeSegments, setRealtimeSegments] = useState<RealtimeSegment[]>(
    []
  );

  // Language options for transcription
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

  // Map i18n language to transcription language, fallback to auto if not supported
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
    setLanguageCode,
    getTranscriptionLanguageFromSettings,
  ]);

  // Model selection state
  const { modelIds: availableModels, modelDisplayName } = MODELS;
  const [modelId, setModelId] = useState(availableModels[0] || '');

  // Meeting minutes specific hook with external state
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

  const speakerMapping = useMemo(() => {
    return Object.fromEntries(
      speakers.split(',').map((speaker, idx) => [`spk_${idx}`, speaker.trim()])
    );
  }, [speakers]);

  // Helper function to format time in MM:SS format
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Real-time text output
  const realtimeText: string = useMemo(() => {
    // Sort segments by start time (chronological order)
    // Show both partial and finalized segments for real-time display
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
      // Small delay to ensure content is rendered
      setTimeout(() => {
        if (transcriptTextareaRef.current) {
          transcriptTextareaRef.current.scrollTop =
            transcriptTextareaRef.current.scrollHeight;
        }
      }, 10);
    }
  }, [realtimeText]);

  // Current transcript text based on input method
  const currentTranscriptText = useMemo(() => {
    switch (inputMethod) {
      case 'direct':
        return directInputText;
      case 'file':
        return fileTranscriptText;
      default:
        return realtimeText;
    }
  }, [inputMethod, directInputText, fileTranscriptText, realtimeText]);

  // Text existence check
  const hasTranscriptText = useMemo(() => {
    return currentTranscriptText.trim() !== '';
  }, [currentTranscriptText]);

  useEffect(() => {
    if (transcriptData && transcriptData.transcripts) {
      // Convert file upload transcripts to simple text format
      const fileText = transcriptData.transcripts
        .map((transcript) => {
          const speakerLabel = transcript.speakerLabel
            ? `${speakerMapping[transcript.speakerLabel] || transcript.speakerLabel}: `
            : '';
          return `${speakerLabel}${transcript.transcript}`;
        })
        .join('\n');

      setFileTranscriptText(fileText);
    }
  }, [transcriptData, speakerMapping]);

  // Real-time integration of raw transcripts
  const updateRealtimeSegments = useCallback((newSegment: RealtimeSegment) => {
    setRealtimeSegments((prev) => {
      const existingIndex = prev.findIndex(
        (seg) =>
          seg.resultId === newSegment.resultId &&
          seg.source === newSegment.source
      );

      if (existingIndex >= 0) {
        // Update existing segment (partial result update)
        const updated = [...prev];
        updated[existingIndex] = newSegment;
        return updated;
      } else {
        // Add new segment
        return [...prev, newSegment];
      }
    });
  }, []);

  // Process microphone raw transcripts
  useEffect(() => {
    if (micRawTranscripts && micRawTranscripts.length > 0) {
      // Only process the latest segment
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
      // Only process the latest segment
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

  // Watch for generation signal and trigger generation
  useEffect(() => {
    if (
      shouldGenerateRef.current &&
      autoGenerate &&
      realtimeText.trim() !== ''
    ) {
      if (realtimeText !== lastProcessedTranscript && !minutesLoading) {
        shouldGenerateRef.current = false; // Reset the flag
        generateMinutes(realtimeText, modelId, (status) => {
          if (status === 'success') {
            toast.success(t('meetingMinutes.generation_success'));
          } else if (status === 'error') {
            toast.error(t('meetingMinutes.generation_error'));
          }
        });
      } else {
        shouldGenerateRef.current = false; // Reset even if we don't generate
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
    // Clear existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // Early return if auto-generate is disabled
    if (!autoGenerate || generationFrequency <= 0) {
      setCountdownSeconds(0);
      return;
    }

    // Initialize countdown
    const totalSeconds = generationFrequency * 60;
    setCountdownSeconds(totalSeconds);

    // Set up countdown timer (updates every second)
    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          shouldGenerateRef.current = true; // Signal generation should happen
          return totalSeconds; // Reset countdown
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

  const disabledExec = useMemo(() => {
    return !file || loading || micRecording;
  }, [file, loading, micRecording]);

  const isRecording = micRecording || screenRecording;

  const disableClearExec = useMemo(() => {
    const hasData = file || hasTranscriptText;
    return !hasData || loading || isRecording;
  }, [file, hasTranscriptText, loading, isRecording]);

  const disabledMicExec = useMemo(() => {
    return loading;
  }, [loading]);

  const onClickExec = useCallback(() => {
    if (loading) return;
    // Don't clear existing transcripts - append instead
    stopMicTranscription();
    clearMicTranscripts();
    const langCode = languageCode === 'auto' ? undefined : languageCode;
    transcribe(speakerLabel, maxSpeakers, langCode);
  }, [
    loading,
    languageCode,
    speakerLabel,
    maxSpeakers,
    stopMicTranscription,
    clearMicTranscripts,
    transcribe,
  ]);

  const onClickClear = useCallback(() => {
    // Clear all input methods
    setDirectInputText('');
    setFileTranscriptText('');
    if (ref.current) {
      ref.current.value = '';
    }
    setRealtimeSegments([]);
    stopMicTranscription();
    stopScreenTranscription();
    clear();
    clearMicTranscripts();
    clearScreenTranscripts();
  }, [
    stopMicTranscription,
    stopScreenTranscription,
    clear,
    clearMicTranscripts,
    clearScreenTranscripts,
  ]);

  const onClickExecStartTranscription = useCallback(async () => {
    // Clear existing content before starting new recording
    setRealtimeSegments([]);
    clearMicTranscripts();
    clearScreenTranscripts();

    const langCode =
      languageCode === 'auto' ? undefined : (languageCode as LanguageCode);

    try {
      // If screen audio is enabled, prepare screen capture first
      let screenStream: MediaStream | null = null;
      if (enableScreenAudio && isScreenAudioSupported) {
        screenStream = await prepareScreenCapture();
      }

      // Now start both recordings simultaneously for better synchronization
      if (screenStream) {
        startTranscriptionWithStream(screenStream, langCode, speakerLabel);
      }
      startMicTranscription(langCode, speakerLabel);
    } catch (error) {
      console.error('Failed to start synchronized recording:', error);
      // Fallback to microphone only if screen preparation fails
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

  // Manual generation handler
  const handleManualGeneration = useCallback(() => {
    // Validate custom prompt when using custom style
    if (
      minutesStyle === 'custom' &&
      (!customPrompt || customPrompt.trim() === '')
    ) {
      toast.error(t('meetingMinutes.custom_prompt_placeholder'));
      return;
    }

    if (hasTranscriptText && !minutesLoading) {
      generateMinutes(currentTranscriptText, modelId, (status) => {
        if (status === 'success') {
          toast.success(t('meetingMinutes.generation_success'));
        } else if (status === 'error') {
          toast.error(t('meetingMinutes.generation_error'));
        }
      });
    }
  }, [
    hasTranscriptText,
    currentTranscriptText,
    minutesLoading,
    modelId,
    generateMinutes,
    t,
    minutesStyle,
    customPrompt,
  ]);

  // Clear minutes only handler
  const handleClearMinutes = useCallback(() => {
    // Clear generated minutes but keep transcript
    clearMinutes();
  }, [clearMinutes]);

  return (
    <div className="grid grid-cols-12">
      <div className="invisible col-span-12 my-0 flex h-0 items-center justify-center text-xl font-semibold lg:visible lg:my-5 lg:h-min print:visible print:my-5 print:h-min">
        {t('meetingMinutes.title')}
      </div>
      <div className="col-span-12 col-start-1 mx-2 lg:col-span-10 lg:col-start-2 xl:col-span-10 xl:col-start-2">
        <Card>
          {/* Tab Headers */}
          <div className="mb-6 flex border-b border-gray-200">
            <button
              className={`flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                inputMethod === 'microphone'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setInputMethod('microphone')}>
              <PiMicrophoneBold className="mr-2 h-4 w-4" />
              {t('transcribe.mic_input')}
            </button>
            <button
              className={`flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                inputMethod === 'direct'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setInputMethod('direct')}>
              <PiPencilLine className="mr-2 h-4 w-4" />
              {t('transcribe.direct_input')}
            </button>
            <button
              className={`flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                inputMethod === 'file'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setInputMethod('file')}>
              <PiPaperclip className="mr-2 h-4 w-4" />
              {t('transcribe.file_upload')}
            </button>
          </div>

          {/* Tab Content with Two-column layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left Column - Input Method Controls */}
            <div>
              {inputMethod === 'microphone' && (
                <MeetingMinutesRealtime
                  realtimeText={realtimeText}
                  hasTranscriptText={hasTranscriptText}
                  onClear={onClickClear}
                  disableClear={disableClearExec}
                  disableMicExecution={disabledMicExec}
                  isRecording={isRecording}
                  onStartTranscription={onClickExecStartTranscription}
                  onStopMicTranscription={stopMicTranscription}
                  onStopScreenTranscription={stopScreenTranscription}
                  enableScreenAudio={enableScreenAudio}
                  onScreenAudioToggle={setEnableScreenAudio}
                  isScreenAudioSupported={isScreenAudioSupported}
                  screenAudioError={screenAudioError}
                  languageCode={languageCode}
                  onLanguageCodeChange={setLanguageCode}
                  languageOptions={languageOptions}
                  speakerLabel={speakerLabel}
                  onSpeakerLabelChange={setSpeakerLabel}
                  maxSpeakers={maxSpeakers}
                  onMaxSpeakersChange={setMaxSpeakers}
                  speakers={speakers}
                  onSpeakersChange={setSpeakers}
                  transcriptTextareaRef={transcriptTextareaRef}
                  isAtBottomRef={isAtBottomRef}
                />
              )}

              {inputMethod === 'direct' && (
                <MeetingMinutesDirect
                  directInputText={directInputText}
                  onDirectInputChange={setDirectInputText}
                  hasTranscriptText={hasTranscriptText}
                  onClear={onClickClear}
                  disableClear={disableClearExec}
                />
              )}

              {inputMethod === 'file' && (
                <MeetingMinutesFile
                  onFileChange={(file) => {
                    if (file) setFile(file);
                  }}
                  fileTranscriptText={fileTranscriptText}
                  hasTranscriptText={hasTranscriptText}
                  onClear={onClickClear}
                  disableClear={disableClearExec}
                  onExecute={onClickExec}
                  disableExecution={disabledExec}
                  loading={loading}
                  languageCode={languageCode}
                  onLanguageCodeChange={setLanguageCode}
                  languageOptions={languageOptions}
                  speakerLabel={speakerLabel}
                  onSpeakerLabelChange={setSpeakerLabel}
                  maxSpeakers={maxSpeakers}
                  onMaxSpeakersChange={setMaxSpeakers}
                  speakers={speakers}
                  onSpeakersChange={setSpeakers}
                />
              )}
            </div>

            {/* Right Column - Generate Minutes */}
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
                onAutoGenerateSessionTimestampChange={
                  setAutoGenerateSessionTimestamp
                }
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
        </Card>
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
