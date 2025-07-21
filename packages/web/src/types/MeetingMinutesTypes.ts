// Common types for Meeting Minutes components

export type InputMethod = 'microphone' | 'direct' | 'file';

export interface LanguageOption {
  value: string;
  label: string;
}

export interface AudioRecognitionSettings {
  languageCode: string;
  speakerLabel: boolean;
  maxSpeakers: number;
  speakers: string;
}

export interface AudioRecognitionSettingsHandlers {
  onLanguageCodeChange: (code: string) => void;
  onSpeakerLabelChange: (enabled: boolean) => void;
  onMaxSpeakersChange: (count: number) => void;
  onSpeakersChange: (names: string) => void;
}

export interface CommonTranscriptProps {
  hasTranscriptText: boolean;
  onClear: () => void;
  disableClear: boolean;
}
