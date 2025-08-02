import React from 'react';
import { useTranslation } from 'react-i18next';
import { Transcript } from 'generative-ai-use-cases';

interface MeetingMinutesTranscriptSegmentProps {
  startTime: number;
  transcripts: Transcript[];
  speakerMapping: { [key: string]: string };
  isPartial: boolean;
  formatTime: (seconds: number) => string;
}

const MeetingMinutesTranscriptSegment: React.FC<
  MeetingMinutesTranscriptSegmentProps
> = ({ startTime, transcripts, speakerMapping, isPartial, formatTime }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4 rounded-lg bg-gray-200 p-3">
      {transcripts.map((transcript, index) => (
        <div key={index} className="mb-2 last:mb-0">
          <div className="flex gap-2">
            <div className="flex shrink-0 items-center gap-2">
              {transcript.speakerLabel && (
                <span className="font-medium text-black">
                  {speakerMapping[transcript.speakerLabel] ||
                    transcript.speakerLabel}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formatTime(startTime)}
              </span>
            </div>
            <div className="flex-1 leading-relaxed text-gray-900">
              {transcript.transcript}
              {isPartial && (
                <span className="ml-1 text-gray-400">
                  {t('meetingMinutes.partial_indicator')}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MeetingMinutesTranscriptSegment;
