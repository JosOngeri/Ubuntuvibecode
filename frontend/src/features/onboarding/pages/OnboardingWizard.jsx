import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '../../../components/DashboardLayout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { onboardingAPI } from '../services/onboarding.api';
import Step1EmployeeProfile from '../components/Step1EmployeeProfile';
import Step2JobDescription from '../components/Step2JobDescription';
import Step3AssetAllocation from '../components/Step3AssetAllocation';
import Step4UserCreation from '../components/Step4UserCreation';
import Step5OrientationChecklist from '../components/Step5OrientationChecklist';
import Step6DocumentUpload from '../components/Step6DocumentUpload';

const STEPS = [
  { number: 1, title: 'Employee Profile', description: 'Create employee profile from application' },
  { number: 2, title: 'Job Description', description: 'Department, supervisor, and schedule' },
  { number: 3, title: 'Asset Allocation', description: 'Assign company assets' },
  { number: 4, title: 'User Creation', description: 'Create system user account' },
  { number: 5, title: 'Orientation Checklist', description: 'Complete orientation tasks' },
  { number: 6, title: 'Document Upload', description: 'Upload required documents' },
];

export default function OnboardingWizard() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(null);
  const [stepData, setStepData] = useState({});

  useEffect(() => {
    loadProgress();
  }, [applicationId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await onboardingAPI.getProgress(applicationId);
      setProgress(data);

      if (data.status === 'completed') {
        toast.info('Onboarding already completed');
        navigate('/recruitment/applicants');
        return;
      }

      if (data.status === 'in_progress' && data.step > 0) {
        setCurrentStep(data.step);
        setStepData(data.data || {});
      } else {
        // Start onboarding if not started
        await onboardingAPI.startOnboarding(applicationId);
        setCurrentStep(1);
      }
    } catch (error) {
      toast.error('Failed to load onboarding progress');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStepSubmit = async (data, shouldContinue = true) => {
    try {
      setSaving(true);
      const result = await onboardingAPI.saveStep(applicationId, currentStep, data);

      // Update step data
      setStepData(prev => ({
        ...prev,
        [`step${currentStep}`]: data,
      }));

      toast.success(`Step ${currentStep} saved successfully`);

      if (shouldContinue && currentStep < 5) {
        setCurrentStep(prev => prev + 1);
      } else if (!shouldContinue) {
        toast.info('Onboarding saved. You can resume later.');
        navigate('/recruitment/applicants');
      } else if (currentStep === 5) {
        // Complete onboarding
        await onboardingAPI.completeOnboarding(applicationId);
        toast.success('Onboarding completed successfully!');
        navigate('/recruitment/applicants');
      }
    } catch (error) {
      toast.error(`Failed to save step ${currentStep}`);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit? Progress will be saved.')) {
      navigate('/recruitment/applicants');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading onboarding...</div>
        </div>
      </DashboardLayout>
    );
  }

  const currentStepInfo = STEPS.find(s => s.number === currentStep);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Employee Onboarding
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Application ID: {applicationId}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step.number <= currentStep
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {step.number < currentStep ? '✓' : step.number}
                  </div>
                  <div className="mt-2 text-sm text-center">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step.number < currentStep ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {currentStepInfo.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{currentStepInfo.description}</p>
          </div>

          {currentStep === 1 && (
            <Step1EmployeeProfile
              initialData={stepData.step1}
              applicationId={applicationId}
              onSubmit={handleStepSubmit}
              saving={saving}
            />
          )}

          {currentStep === 2 && (
            <Step2JobDescription
              initialData={stepData.step2}
              applicationId={applicationId}
              onSubmit={handleStepSubmit}
              saving={saving}
            />
          )}

          {currentStep === 3 && (
            <Step3AssetAllocation
              initialData={stepData.step3}
              applicationId={applicationId}
              onSubmit={handleStepSubmit}
              saving={saving}
            />
          )}

          {currentStep === 4 && (
            <Step4UserCreation
              initialData={stepData.step4}
              applicationId={applicationId}
              onSubmit={handleStepSubmit}
              saving={saving}
            />
          )}

          {currentStep === 5 && (
            <Step5OrientationChecklist
              initialData={stepData.step5}
              applicationId={applicationId}
              onSubmit={handleStepSubmit}
              saving={saving}
            />
          )}

          {currentStep === 6 && (
            <Step6DocumentUpload
              initialData={stepData.step6}
              applicationId={applicationId}
              onSubmit={handleStepSubmit}
              saving={saving}
            />
          )}
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleExit}
            >
              Exit
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
