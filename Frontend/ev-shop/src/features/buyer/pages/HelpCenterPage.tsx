import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { buyerService } from "../buyerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";
import { ChevronDownIcon, ChevronUpIcon } from "@/assets/icons/icons";

// Q&A Data
const faqData = [
  {
    category: "General",
    questions: [
      {
        question: "How do I create an account?",
        answer: "You can create an account by clicking on the 'Sign Up' button on the login page. Fill in your details including name, email, and password, then verify your email to complete registration.",
      },
      {
        question: "How do I search for vehicles?",
        answer: "Use the search bar at the top of the dashboard to search by vehicle model, brand, or seller. You can also use filters to narrow down results by price range, listing type, and more.",
      },
      {
        question: "Can I save vehicles for later?",
        answer: "Yes! Click the heart icon on any vehicle listing to save it to your favorites. You can view all saved vehicles in the 'Saved Vehicles' section of your dashboard.",
      },
    ],
  },
  {
    category: "Orders & Purchases",
    questions: [
      {
        question: "How do I place an order?",
        answer: "Browse vehicles, click on a vehicle to view details, then click 'Buy Now' or 'Add to Cart'. For cart purchases, go to your cart and proceed to checkout. Complete the payment process to finalize your order.",
      },
      {
        question: "What payment methods are accepted?",
        answer: "We accept payments through PayHere, which supports credit/debit cards and other secure payment methods. All transactions are processed securely.",
      },
      {
        question: "Can I cancel my order?",
        answer: "Order cancellation depends on the order status. Contact the seller directly or reach out to our support team through the Help Center if you need to cancel an order.",
      },
      {
        question: "How do I track my order?",
        answer: "Go to the 'Orders' section in your dashboard to view all your orders and their current status. You'll see updates as your order progresses.",
      },
    ],
  },
  {
    category: "Financing",
    questions: [
      {
        question: "How do I apply for financing?",
        answer: "Navigate to the 'Financing' section, browse available financing options from different institutions, and click 'Apply Now' on a product. Fill out the application form with your details and submit required documents.",
      },
      {
        question: "What documents do I need for financing?",
        answer: "Typically, you'll need proof of income, identification documents, and employment verification. Specific requirements may vary by financial institution. Check each product's details for exact requirements.",
      },
      {
        question: "How long does approval take?",
        answer: "Approval times vary by institution, typically ranging from 1-5 business days. You'll receive notifications via email and in-app when your application status changes.",
      },
      {
        question: "Can I apply for multiple financing options?",
        answer: "You can only have one active application at a time. If your application is rejected or you withdraw it, you can apply for another option.",
      },
    ],
  },
  {
    category: "Test Drives",
    questions: [
      {
        question: "How do I book a test drive?",
        answer: "Go to the 'Test Drives' section, browse available slots by location and date, then click 'Book' on a suitable slot. Confirm your booking details and wait for seller approval.",
      },
      {
        question: "Can I cancel a test drive booking?",
        answer: "Yes, you can cancel your test drive booking from the 'Test Drives' section. Click on your booking and select 'Cancel'. Please cancel at least 24 hours in advance when possible.",
      },
      {
        question: "What should I bring to a test drive?",
        answer: "Bring a valid driver's license and any other identification required by the seller. Some sellers may require additional documentation, which will be specified in the booking details.",
      },
    ],
  },
  {
    category: "Account & Profile",
    questions: [
      {
        question: "How do I update my profile?",
        answer: "Click on your profile picture in the top right, select 'User Profile', then click 'Edit Profile' to update your information, profile picture, and contact details.",
      },
      {
        question: "How do I change my password?",
        answer: "Go to your User Profile page and click on 'Change Password'. Enter your current password and your new password twice to confirm the change.",
      },
      {
        question: "How do I manage notifications?",
        answer: "Go to the 'Notifications' section to view all your notifications. You can mark them as read individually or all at once. Notification preferences can be managed in your profile settings.",
      },
    ],
  },
];

export const HelpCenterPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const userId = useAppSelector(selectUserId);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintData, setComplaintData] = useState({
    subject: "",
    message: "",
  });

  const submitComplaintMutation = useMutation({
    mutationFn: async (data: { user_id: string; subject: string; message: string }) => {
      return buyerService.submitComplaint(data);
    },
    onSuccess: () => {
      setAlert?.({
        id: Date.now(),
        type: "success",
        title: "Complaint Submitted",
        message: "Your complaint has been submitted successfully. We'll get back to you soon.",
      });
      setComplaintData({ subject: "", message: "" });
      setShowComplaintForm(false);
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.status === 404
        ? "The complaint submission feature is currently unavailable. Please contact support directly or try again later."
        : error?.response?.data?.message || error?.message || "Failed to submit complaint. Please try again later.";
      setAlert?.({
        id: Date.now(),
        type: "error",
        title: "Submission Failed",
        message: errorMessage,
      });
    },
  });

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setAlert?.({
        id: Date.now(),
        type: "error",
        title: "Error",
        message: "Please log in to submit a complaint.",
      });
      return;
    }
    if (!complaintData.subject.trim() || !complaintData.message.trim()) {
      setAlert?.({
        id: Date.now(),
        type: "error",
        title: "Validation Error",
        message: "Please fill in both subject and message fields.",
      });
      return;
    }
    submitComplaintMutation.mutate({
      user_id: userId,
      subject: complaintData.subject,
      message: complaintData.message,
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    setExpandedQuestion(null);
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md dark:bg-gray-800 dark:shadow-none dark:border dark:border-gray-700">
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white mb-2">Help Center</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find answers to common questions or submit a complaint if you need further assistance.
        </p>
      </div>

      {/* Q&A Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold dark:text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category.category)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-white">{category.category}</span>
                {expandedCategory === category.category ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              {expandedCategory === category.category && (
                <div className="p-4 space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const questionId = `${categoryIndex}-${questionIndex}`;
                    return (
                      <div key={questionIndex} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
                        <button
                          onClick={() => toggleQuestion(questionId)}
                          className="w-full text-left flex items-center justify-between py-2"
                        >
                          <span className="font-medium text-gray-900 dark:text-white pr-4">
                            {faq.question}
                          </span>
                          {expandedQuestion === questionId ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {expandedQuestion === questionId && (
                          <div className="mt-2 pl-4 text-gray-600 dark:text-gray-300">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Complaints Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold dark:text-white mb-2">Still Need Help?</h2>
            <p className="text-gray-600 dark:text-gray-400">
              If you couldn't find the answer you're looking for, please submit a complaint and our team will assist you.
            </p>
          </div>
          {!showComplaintForm && (
            <button
              onClick={() => setShowComplaintForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 font-medium"
            >
              Submit Complaint
            </button>
          )}
        </div>

        {showComplaintForm && (
          <form onSubmit={handleSubmitComplaint} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={complaintData.subject}
                onChange={(e) => setComplaintData({ ...complaintData, subject: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={complaintData.message}
                onChange={(e) => setComplaintData({ ...complaintData, message: e.target.value })}
                placeholder="Please provide details about your issue..."
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitComplaintMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitComplaintMutation.isPending ? (
                  <>
                    <Loader size={8} color="#fff" />
                    Submitting...
                  </>
                ) : (
                  "Submit Complaint"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowComplaintForm(false);
                  setComplaintData({ subject: "", message: "" });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HelpCenterPage;
