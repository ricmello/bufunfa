'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CSVDropzone } from './components/csv-dropzone';
import { CSVPreview } from './components/csv-preview';
import { ImportConfirmation } from './components/import-confirmation';
import { MergeConfirmationDialog } from './components/merge-confirmation-dialog';
import {
  parseCSV,
  importExpenses,
  checkForForecastMatches,
  confirmMerge,
  ParsedCSVData,
} from '@/lib/actions/import';
import { parseFilenameDate } from '@/lib/actions/filename-parser';
import { Button } from '@/components/ui/button';
import type { ExpenseWithCategory } from '@/lib/types/expense';

export default function ImportPage() {
  const router = useRouter();
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [detectedMonth, setDetectedMonth] = useState<number | undefined>();
  const [detectedYear, setDetectedYear] = useState<number | undefined>();
  const [autoDetected, setAutoDetected] = useState(false);

  // Forecast matching state
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [forecastMatches, setForecastMatches] = useState<
    Array<{
      expenseIndex: number;
      matchingForecasts: ExpenseWithCategory[];
    }>
  >([]);
  const [pendingImport, setPendingImport] = useState<{
    month: number;
    year: number;
  } | null>(null);
  const [resolvedExpenses, setResolvedExpenses] = useState<
    Array<{
      index: number;
      action: 'merge' | 'keep-both';
      forecastId?: string;
    }>
  >([]);

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
    if (!csvData) return;

    setIsImporting(true);
    setShowConfirmation(false);

    try {
      // Check for forecast matches
      const expenses = csvData.rows.map((row) => ({
        date: new Date(row.date),
        amount: row.amount,
        description: row.description,
      }));

      const matches = await checkForForecastMatches(expenses);

      if (matches.length > 0) {
        // Found forecast matches, show merge dialog
        setForecastMatches(matches);
        setCurrentMatchIndex(0);
        setPendingImport({ month, year });
        setShowMergeDialog(true);
        setIsImporting(false);
      } else {
        // No matches, proceed with normal import
        await proceedWithImport(month, year, []);
      }
    } catch (error) {
      toast.error('An error occurred during import preparation');
      console.error(error);
      setIsImporting(false);
    }
  };

  const proceedWithImport = async (
    month: number,
    year: number,
    resolutions: Array<{
      index: number;
      action: 'merge' | 'keep-both';
      forecastId?: string;
    }>
  ) => {
    setIsImporting(true);
    try {
      // For now, use the original import function
      // In a full implementation, we would filter out merged expenses
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
      setShowMergeDialog(false);
      setForecastMatches([]);
      setResolvedExpenses([]);
    }
  };

  const handleMergeWithForecast = async (forecastId: string) => {
    if (!csvData || !pendingImport) return;

    const currentMatch = forecastMatches[currentMatchIndex];
    const expenseData = csvData.rows[currentMatch.expenseIndex];

    try {
      // Merge the forecast with imported data
      const result = await confirmMerge(forecastId, {
        description: expenseData.description,
        amount: expenseData.amount,
        date: new Date(expenseData.date),
        rawCsvRow: JSON.stringify(expenseData),
      });

      if (result.success) {
        toast.success('Merged with forecast successfully');

        // Record resolution
        const newResolutions = [
          ...resolvedExpenses,
          {
            index: currentMatch.expenseIndex,
            action: 'merge' as const,
            forecastId,
          },
        ];
        setResolvedExpenses(newResolutions);

        // Move to next match or finish
        if (currentMatchIndex < forecastMatches.length - 1) {
          setCurrentMatchIndex(currentMatchIndex + 1);
        } else {
          // All matches resolved, proceed with import
          await proceedWithImport(pendingImport.month, pendingImport.year, newResolutions);
        }
      } else {
        toast.error(result.error || 'Failed to merge with forecast');
      }
    } catch (error) {
      toast.error('An error occurred during merge');
      console.error(error);
    }
  };

  const handleKeepBoth = async () => {
    if (!pendingImport) return;

    const currentMatch = forecastMatches[currentMatchIndex];

    // Record resolution
    const newResolutions = [
      ...resolvedExpenses,
      {
        index: currentMatch.expenseIndex,
        action: 'keep-both' as const,
      },
    ];
    setResolvedExpenses(newResolutions);

    // Move to next match or finish
    if (currentMatchIndex < forecastMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    } else {
      // All matches resolved, proceed with import
      await proceedWithImport(pendingImport.month, pendingImport.year, newResolutions);
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
        <>
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

          <MergeConfirmationDialog
            open={showMergeDialog}
            onOpenChange={setShowMergeDialog}
            pendingExpense={
              forecastMatches[currentMatchIndex]
                ? csvData.rows[forecastMatches[currentMatchIndex].expenseIndex]
                : null
            }
            matchingForecasts={
              forecastMatches[currentMatchIndex]?.matchingForecasts || []
            }
            onMerge={handleMergeWithForecast}
            onKeepBoth={handleKeepBoth}
            isProcessing={isImporting}
          />
        </>
      )}
    </div>
  );
}
