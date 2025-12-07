import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, FileUp, XCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import ToolPageLayout from '@/components/tool-page/ToolPageLayout';
import { download } from '@/lib/utils';

const PowerPointToPdf = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conversionComplete, setConversionComplete] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFile(event.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (
      selectedFile.type !==
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      alert(t('powerpoint_to_pdf.error_file_type'));
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      // 100MB limit
      alert(t('powerpoint_to_pdf.error_file_size'));
      return;
    }
    setFile(selectedFile);
    setConversionComplete(false);
    setProgress(0);
    setIsConverting(false);
  };

  const removeFile = () => {
    setFile(null);
    setConversionComplete(false);
    setProgress(0);
    setIsConverting(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startConversion = async () => {
    if (!file) {
      alert(t('powerpoint_to_pdf.error_no_file'));
      return;
    }
    setIsConverting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('File', file);

    try {
      const response = await axios.post(
        'https://v2.convertapi.com/convert/pptx/to/pdf?Secret=ilH0oxHHZvAg8cQ5EG66IfGqLPMFUYh5',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setProgress(percentCompleted);
            }
          },
        }
      );

      const fileData = response.data.Files[0].FileData; // base64 string
      // const fileName = response.data.Files[0].FileName;

      // Convert base64 -> Blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/pdf',
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setFileName(response.data.Files[0].FileName);

      setIsConverting(false);
      setConversionComplete(true);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Error:', error.response?.data || error.message);
      } else if (error instanceof Error) {
        console.error('❌ Error:', error.message);
      } else {
        console.error('❌ An unknown error occurred');
      }
      alert(t('common.conversion_error'));
      setIsConverting(false);
      setConversionComplete(false);
    }
  };

  return (
    <ToolPageLayout
      icon={<FileText className='text-yellow-600 w-8 h-8' />}
      title={t('tools.powerpoint_to_pdf.title')}
      description={t('tools.powerpoint_to_pdf.description')}
    >
      <div className=''>
        {!file ? (
          <div
            className={`drop-zone border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
              isDragOver
                ? 'dragover border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUp className='text-gray-400 w-12 h-12 mx-auto mb-4' />
            <p className='text-gray-600 dark:text-gray-400 mb-2'>
              {t('common.drag_drop_powerpoint')}
            </p>
            <p className='text-gray-500 dark:text-gray-500 text-sm mb-4'>
              {t('common.or')}
            </p>
            <label
              htmlFor='file-upload'
              className='bg-blue-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition duration-300'
            >
              {t('common.browse_files')}
            </label>
            <input
              id='file-upload'
              type='file'
              className='hidden'
              accept='.ppt,.pptx'
              onChange={handleFileInputChange}
            />
            <p className='text-gray-400 dark:text-gray-500 text-sm mt-4'>
              {t('common.max_file_size', { size: '100MB' })}
            </p>
          </div>
        ) : (
          <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <FileText className='text-yellow-500 w-6 h-6 mr-3' />
                <div>
                  <p className='font-medium text-gray-800 dark:text-white'>
                    {file.name}
                  </p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className='text-red-500 hover:text-red-700'
              >
                <XCircle className='w-5 h-5' />
              </button>
            </div>
          </div>
        )}

        {/* Conversion Options - Simplified for PowerPoint to PDF */}
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-4'>
            {t('common.conversion_options')}
          </h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Example Option: PDF Quality */}
            <div className='option-group p-4 border border-gray-200 dark:border-gray-700 rounded-lg'>
              <label
                htmlFor='pdf-quality'
                className='text-gray-700 dark:text-gray-300 font-medium'
              >
                {t('tools.powerpoint_to_pdf.output_quality')}
              </label>
              <select
                id='pdf-quality'
                className='w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
              >
                <option value='high'>{t('common.high')}</option>
                <option value='medium'>{t('common.medium')}</option>
                <option value='low'>{t('common.low')}</option>
              </select>
            </div>

            {/* Add more PowerPoint to PDF specific options here if needed */}
          </div>
        </div>

        {!conversionComplete && !isConverting && file && (
          <button
            onClick={startConversion}
            className='w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 flex items-center justify-center'
          >
            <FileText className='w-5 h-5 mr-2' />{' '}
            {t('tools.powerpoint_to_pdf.convert_button')}
          </button>
        )}

        {isConverting && (
          <div className='mt-6'>
            <div className='flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1'>
              <span>{t('common.converting')}...</span>
              <span id='progressPercent'>{progress}%</span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5'>
              <div
                className='progress-bar bg-blue-600 h-2.5 rounded-full'
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {conversionComplete && (
          <div className='mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg text-center'>
            <CheckCircle className='text-green-500 w-12 h-12 mx-auto mb-3' />
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-2'>
              {t('tools.powerpoint_to_pdf.conversion_complete')}
            </h3>
            <p className='text-gray-600 dark:text-gray-400 mb-4'>
              {t('tools.powerpoint_to_pdf.download_prompt')}
            </p>
            {pdfUrl && (
              <div className='mt-4'>
                <a
                  // href={pdfUrl}
                  onClick={() => download(pdfUrl, fileName)}
                  className='bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-300'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {t('tools.powerpoint_to_pdf.download_button')}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
};

export default PowerPointToPdf;
