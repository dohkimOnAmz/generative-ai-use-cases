import React, { useState } from 'react';
import Card from '../components/Card';
import { PiMicrophoneBold, PiPencilLine, PiPaperclip } from 'react-icons/pi';
import MeetingMinutesRealtime from '../components/MeetingMinutesRealtime';
import MeetingMinutesDirect from '../components/MeetingMinutesDirect';
import MeetingMinutesFile from '../components/MeetingMinutesFile';
import { useTranslation } from 'react-i18next';
import { InputMethod } from '../types/MeetingMinutesTypes';

const MeetingMinutesPage: React.FC = () => {
  const { t } = useTranslation();

  // Minimal state - only tab selection
  const [inputMethod, setInputMethod] = useState<InputMethod>('microphone');

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

          {/* Tab Content - Self-contained components */}
          <div>
            <div
              style={{
                display: inputMethod === 'microphone' ? 'block' : 'none',
              }}>
              <MeetingMinutesRealtime />
            </div>
            <div
              style={{ display: inputMethod === 'direct' ? 'block' : 'none' }}>
              <MeetingMinutesDirect />
            </div>
            <div style={{ display: inputMethod === 'file' ? 'block' : 'none' }}>
              <MeetingMinutesFile />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
