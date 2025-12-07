import { useState, useCallback } from 'react';
import ToolPageLayout from '../components/tool-page/ToolPageLayout';
import FileUpload from '../components/tool-page/FileUpload';
import PrivacyDisclaimer from '../components/tool-page/PrivacyDisclaimer';
import FeedbackButton from '../components/tool-page/FeedbackButton';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
import FormData from 'form-data';
import { useTranslation } from 'react-i18next';

function PdfToExcel() {
  const { t } = useTranslation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionComplete, setConversionComplete] = useState(false);
  const [xlsxUrl, setXlsxUrl] = useState<string | null>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setSelectedFiles(Array.from(e.target.files));
      }
    },
    []
  );

  const handleConvert = async (file: File) => {
    if (!file) return;
    setIsConverting(true);

    const formData = new FormData();
    formData.append('File', file);

    try {
      const response = await axios.post(
        'https://v2.convertapi.com/convert/pdf/to/xlsx?Secret=ilH0oxHHZvAg8cQ5EG66IfGqLPMFUYh5',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setProgress(percentCompleted);
          },
        }
      );

      const fileData = response.data.Files[0].FileData; // base64 string
      // const fileName = response.data.Files[0].FileName;

      // Convert base64 → Blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      setXlsxUrl(url);
      setIsConverting(false);
      setConversionComplete(true);

      // Auto-download
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = fileName;
      // link.click();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  };

  return (
    <ToolPageLayout
      icon={<FileSpreadsheet className='text-green-600 w-8 h-8' />}
      title='PDF to Excel Converter'
      description='Easily convert your PDF files to editable Excel spreadsheets.'
    >
      <FileUpload
        onFileChange={handleFileChange}
        fileType='.pdf'
        multiple={false}
      />
      {selectedFiles.length > 0 && (
        <div className='text-center my-6'>
          <span className='text-gray-600'>{selectedFiles[0].name}</span>
        </div>
      )}
      <div className='text-center my-6'>
        {!conversionComplete && (
          <Button
            onClick={() => handleConvert(selectedFiles[0])}
            disabled={selectedFiles.length === 0 || isConverting}
            className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
          >
            {isConverting ? 'Converting...' : 'Convert to Excel'}
          </Button>
        )}
        {isConverting && (
          <div className='mt-6'>
            <div className='flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1'>
              <span>{t('common.converting')}...</span>
              <span id='progressPercent'>{progress}%</span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5'>
              <div
                className='progress-bar bg-green-600 h-2.5 rounded-full'
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        {conversionComplete && (
          <div className='mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg text-center'>
            <CheckCircle className='text-green-500 w-12 h-12 mx-auto mb-3' />
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
              {t('tools.pdf_to_excel.conversion_complete')}
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>
              Your PDF document has been successfully converted to Excel format.
            </p>
            {xlsxUrl && (
              <div className='mt-4'>
                <a
                  href={xlsxUrl}
                  className='bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-300'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Download Excel Document
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <PrivacyDisclaimer />
      <FeedbackButton />
    </ToolPageLayout>
  );
}

export default PdfToExcel;
