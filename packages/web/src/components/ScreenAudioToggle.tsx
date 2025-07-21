import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Switch from './Switch';

interface ScreenAudioToggleProps {
  /** Whether screen audio capture is enabled */
  enabled: boolean;
  /** Handler for when the toggle state changes */
  onToggle: (enabled: boolean) => void;
  /** Whether screen audio capture is supported by the browser */
  isSupported?: boolean;
  /** Whether to show the informational notice when enabled */
  showNotice?: boolean;
  /** Custom notice text (if not provided, uses default translation) */
  noticeText?: string;
  /** Additional CSS classes */
  className?: string;
}

const ScreenAudioToggle: React.FC<ScreenAudioToggleProps> = ({
  enabled,
  onToggle,
  isSupported = true,
  showNotice = true,
  noticeText,
  className = '',
}) => {
  const { t } = useTranslation();

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div className={`ml-0.5 mt-2 ${className}`}>
      <Switch
        label={t('transcribe.screen_audio')}
        checked={enabled}
        onSwitch={onToggle}
      />
      {enabled && showNotice && (
        <div className="mt-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          {noticeText ? (
            noticeText
          ) : (
            <Trans
              i18nKey="transcribe.screen_audio_notice"
              components={{ br: <br /> }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenAudioToggle;
