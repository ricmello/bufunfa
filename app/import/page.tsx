'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CSVDropzone } from './components/csv-dropzone';
import { CSVPreview } from './components/csv-preview';
import { ImportConfirmation } from './components/import-confirmation';
import { parseCSV, importExpenses, ParsedCSVData } from '@/lib/actions/import';
import { parseFilenameDate } from '@/lib/actions/filename-parser';
import { Button } from '@/components/ui/button';

export default function ImportPage() {
  const router = useRouter();
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [detectedMonth, setDetectedMonth] = useState<number | undefined>();
  const [detectedYear, setDetectedYear] = useState<number | undefined>();
  const [autoDetected, setAutoDetected] = useState(false);

  const handleFileSelect = async (file: File, content: string) => {
    try {
      const parsed = await parseCSV(content);
      setCsvData(parsed);
      setFileContent(content);

      // Extract date from filename using server action
      const filenameDate = await parseFilenameDate(file.name);

      setDetectedMonth(filenameDate.month);
      setDetectedYear(filenameDate.year);
      setAutoDetected(filenameDate.autoDetected);

      // Show success message with detected date if available
      if (filenameDate.autoDetected && filenameDate.month && filenameDate.year) {
        toast.success(
          `Parsed ${parsed.totalRows} transactions (${getMonthName(filenameDate.month)} ${filenameDate.year} detected)`
        );
      } else {
        toast.success(`Parsed ${parsed.totalRows} transactions`);
      }
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    }
  };

  const getMonthName = (month: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const handleImportClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmImport = async (month: number, year: number) => {
    setIsImporting(true);
    try {
      const result = await importExpenses(fileContent, month, year);

      if (result.success) {
        toast.success(`Successfully imported ${result.count} expenses`);
        router.push('/dashboard');
      } else {
        toast.error(result.error || 'Failed to import expenses');
      }
    } catch (error) {
      toast.error('An error occurred during import');
      console.error(error);
    } finally {
      setIsImporting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="container max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Import Expenses</h1>
        <p className="text-muted-foreground mt-2">
          Upload your credit card statement in CSV format
        </p>
      </div>

      <div className="space-y-6">
        <CSVDropzone onFileSelect={handleFileSelect} />

        {csvData && (
          <>
            <CSVPreview data={csvData} />

            <div className="flex justify-end">
              <Button onClick={handleImportClick} size="lg">
                Import {csvData.totalRows} Transactions
              </Button>
            </div>
          </>
        )}
      </div>

      {csvData && (
        <ImportConfirmation
          isOpen={showConfirmation}
          rowCount={csvData.totalRows}
          onConfirm={handleConfirmImport}
          onCancel={() => setShowConfirmation(false)}
          isImporting={isImporting}
          initialMonth={detectedMonth}
          initialYear={detectedYear}
          autoDetected={autoDetected}
        />
      )}
    </div>
  );
}
