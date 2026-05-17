'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Shield } from 'lucide-react';
import AnalysisProgress from '@/components/AnalysisProgress';
import Disclaimer from '@/components/Disclaimer';
import DocumentTypeSelector from '@/components/DocumentTypeSelector';
import FileUpload from '@/components/FileUpload';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SampleDocumentPicker from '@/components/SampleDocumentPicker';
import { SAMPLE_DOCUMENTS, SampleDocumentDefinition } from '@/lib/samples';
import { AgentStep, DocumentType } from '@/lib/types';

const INITIAL_STEPS: AgentStep[] = [
  { agent: 'Document Parser', status: 'pending', description: 'Extracting text from your document' },
  { agent: 'Clause Extractor', status: 'pending', description: 'Identifying individual clauses' },
  { agent: 'Risk Critic', status: 'pending', description: 'Evaluating risk severity for each clause' },
  { agent: 'Ambiguity Detector', status: 'pending', description: 'Finding vague or undefined terms' },
  { agent: 'User Impact Explainer', status: 'pending', description: 'Translating to plain language' },
  { agent: 'Negotiation Advisor', status: 'pending', description: 'Generating negotiation strategies' },
  { agent: 'Report Synthesizer', status: 'pending', description: 'Compiling final risk report' },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>(INITIAL_STEPS);
  const [currentStep, setCurrentStep] = useState(-1);

  const simulateProgress = useCallback(() => {
    const delays = [400, 1200, 2000, 2800, 3500, 4200, 5000];

    delays.forEach((delay, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        setSteps((prev) =>
          prev.map((step, stepIndex) => ({
            ...step,
            status:
              stepIndex < index ? 'complete' : stepIndex === index ? 'running' : 'pending',
          }))
        );
      }, delay);
    });
  }, []);

  const submitAnalysis = useCallback(
    async (formData: FormData) => {
      setIsAnalyzing(true);
      setError(null);
      setSteps(INITIAL_STEPS);
      setCurrentStep(0);
      simulateProgress();

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }

        setSteps((prev) => prev.map((step) => ({ ...step, status: 'complete' as const })));
        setCurrentStep(INITIAL_STEPS.length);

        setTimeout(() => {
          router.push(`/report/${data.reportId}`);
        }, 800);
      } catch (analysisError) {
        setError(analysisError instanceof Error ? analysisError.message : 'An unexpected error occurred');
        setIsAnalyzing(false);
        setSteps((prev) =>
          prev.map((step) => ({
            ...step,
            status: step.status === 'running' ? 'error' : step.status,
          }))
        );
      }
    },
    [router, simulateProgress]
  );

  const handleUploadedDocumentAnalysis = useCallback(() => {
    if (!selectedFile || !documentType) {
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);

    void submitAnalysis(formData);
  }, [documentType, selectedFile, submitAnalysis]);

  const handleSampleAnalysis = useCallback(
    (sample: SampleDocumentDefinition) => {
      const formData = new FormData();
      formData.append('sampleId', sample.id);
      formData.append('documentType', sample.documentType);

      void submitAnalysis(formData);
    },
    [submitAnalysis]
  );

  return (
    <>
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/20 mb-4">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-xs font-medium text-brand-300">Document Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Analyze Your Document</h1>
            <p className="text-sm text-slate-400">
              Upload a legal document or try a fictional sample to begin the AI risk analysis
            </p>
          </div>

          {!isAnalyzing ? (
            <div className="space-y-8 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Upload Document</label>
                <FileUpload
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  onClear={() => setSelectedFile(null)}
                />
              </div>

              <SampleDocumentPicker
                samples={SAMPLE_DOCUMENTS}
                disabled={isAnalyzing}
                onAnalyzeSample={handleSampleAnalysis}
              />

              <DocumentTypeSelector value={documentType} onChange={setDocumentType} />

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleUploadedDocumentAnalysis}
                disabled={!selectedFile || !documentType}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-brand-500/25 disabled:hover:shadow-none"
              >
                <Shield className="w-5 h-5" />
                Analyze Uploaded Document
                <ArrowRight className="w-4 h-4" />
              </button>

              <Disclaimer />
            </div>
          ) : (
            <AnalysisProgress steps={steps} currentStep={currentStep} />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
