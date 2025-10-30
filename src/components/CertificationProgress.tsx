import { CheckCircle, Circle, Lock } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked' | 'pending';
  required: boolean;
}

interface CertificationProgressProps {
  oneciStatus: string;
  cnamStatus: string;
  faceStatus: string;
  className?: string;
}

export default function CertificationProgress({
  oneciStatus,
  cnamStatus,
  faceStatus,
  className = ''
}: CertificationProgressProps) {
  const steps: Step[] = [
    {
      id: 'oneci',
      title: 'Vérification ONECI',
      description: 'Carte d\'identité nationale',
      status: oneciStatus === 'verifie' ? 'completed' :
              oneciStatus === 'en_attente' ? 'current' : 'pending',
      required: true
    },
    {
      id: 'cnam',
      title: 'Vérification CNAM',
      description: 'Assurance maladie (optionnel)',
      status: cnamStatus === 'verifie' ? 'completed' :
              oneciStatus === 'verifie' ? 'current' : 'locked',
      required: false
    },
    {
      id: 'face',
      title: 'Reconnaissance faciale',
      description: 'Vérification biométrique',
      status: faceStatus === 'verifie' ? 'completed' :
              oneciStatus === 'verifie' ? 'current' : 'locked',
      required: true
    }
  ];

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalRequiredSteps = steps.filter(s => s.required).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Progression de la certification</h3>
          <span className="text-sm font-bold text-terracotta-600">
            {completedSteps}/{steps.length} complété
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-terracotta-500 to-coral-500 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                    ${step.status === 'completed'
                      ? 'bg-green-500 border-green-500'
                      : step.status === 'current'
                      ? 'bg-white border-terracotta-500'
                      : step.status === 'locked'
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-white border-gray-300'
                    }
                  `}>
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : step.status === 'locked' ? (
                      <Lock className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Circle className={`w-5 h-5 ${step.status === 'current' ? 'text-terracotta-500' : 'text-gray-300'}`} />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`
                      w-0.5 h-12 mt-2
                      ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                    `} />
                  )}
                </div>

                <div className="flex-1 pt-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`
                      font-bold
                      ${step.status === 'completed' ? 'text-green-700' :
                        step.status === 'current' ? 'text-gray-900' :
                        'text-gray-500'}
                    `}>
                      {step.title}
                    </h4>
                    {!step.required && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        Optionnel
                      </span>
                    )}
                  </div>
                  <p className={`
                    text-sm mt-1
                    ${step.status === 'locked' ? 'text-gray-400' : 'text-gray-600'}
                  `}>
                    {step.description}
                  </p>
                  {step.status === 'locked' && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Complétez l'étape précédente pour débloquer</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {completedSteps === steps.length && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-900">Certification complète!</p>
              <p className="text-sm text-green-700">Vous êtes maintenant certifié ANSUT</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
