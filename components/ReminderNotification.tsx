import React from 'react';
import { BrainCircuitIcon, XIcon } from './Icons';

interface ReminderNotificationProps {
  onDismiss: () => void;
}

export const ReminderNotification: React.FC<ReminderNotificationProps> = ({ onDismiss }) => {
  return (
    <div className="sticky top-16 z-40 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-indigo-800/50">
              <BrainCircuitIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
            <p className="ml-3 font-medium truncate">
              <span className="md:hidden">Time to study!</span>
              <span className="hidden md:inline">It's time for your weekly math practice session!</span>
            </p>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={onDismiss}
              className="-mr-1 flex p-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-white sm:-mr-2"
              aria-label="Dismiss"
            >
              <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
