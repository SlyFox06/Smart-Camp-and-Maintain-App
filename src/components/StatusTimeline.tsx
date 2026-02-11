import { CheckCircle, Circle, XCircle } from 'lucide-react';

interface StatusTimelineProps {
    status: string;
}

const STEPS = [
    { id: 'reported', label: 'Raised' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'work_submitted', label: 'Work Done' },
    { id: 'work_approved', label: 'Verified' },
    { id: 'closed', label: 'Closed' }
];

const StatusTimeline = ({ status }: StatusTimelineProps) => {
    // Map status to progress index
    const getStatusIndex = (s: string) => {
        switch (s) {
            case 'reported': return 0;
            case 'assigned': return 1;
            case 'work_submitted':
            case 'rework_required': return 2;
            case 'work_approved':
            case 'feedback_pending': return 3;
            case 'closed':
            case 'resolved': return 4;
            default: return 0;
        }
    };

    const currentIndex = getStatusIndex(status);

    return (
        <div className="w-full py-4">
            <div className="relative flex items-center justify-between w-full max-w-4xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-500 -z-10 transition-all duration-500"
                    style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                ></div>

                {STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const isReworkStep = status === 'rework_required' && index === 2; // Index 2 is 'Work Done'

                    let circleClass = 'bg-white border-gray-300 text-gray-400';
                    if (isCompleted) {
                        if (isReworkStep) {
                            circleClass = 'bg-red-500 border-red-500 text-white';
                        } else {
                            circleClass = 'bg-green-500 border-green-500 text-white';
                        }
                    }

                    return (
                        <div key={step.id} className="flex flex-col items-center bg-white px-2">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${circleClass}
                                    ${isCurrent ? 'ring-4 ring-green-100 scale-110' : ''}
                                `}
                            >
                                {isCompleted ? (
                                    isReworkStep ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />
                                ) : (
                                    <Circle className="w-5 h-5" />
                                )}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-green-600' : 'text-gray-500'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {status === 'rework_required' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center text-sm text-red-600">
                    <strong>Work Rejected:</strong> Please review admin comments and resubmit.
                </div>
            )}
        </div>
    );
};

export default StatusTimeline;
