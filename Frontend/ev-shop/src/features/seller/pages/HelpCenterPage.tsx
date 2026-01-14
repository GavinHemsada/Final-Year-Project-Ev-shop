import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { sellerService } from "../sellerService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectUserId } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";
import { ChevronDownIcon, ChevronUpIcon } from "@/assets/icons/icons";

// Q&A Data for Sellers
const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I become a seller?",
        answer: "To become a seller, go to your profile and click 'Become a Seller'. Fill out the application form with your business details, upload required documents, and submit. Once approved, you'll be able to list vehicles.",
      },
      {
        question: "How do I list a vehicle?",
        answer: "Navigate to 'EV Listings' in your dashboard, then click 'Add New Listing'. Fill in the vehicle details including model, price, condition, and upload photos. Submit the listing for review.",
      },
      {
        question: "What information do I need to list a vehicle?",
        answer: "You'll need the vehicle model, price, color, registration year, listing type (sale/lease), condition, mileage, and photos. Additional details like features and description help attract buyers.",
      },
    ],
  },
  {
    category: "Orders & Sales",
    questions: [
      {
        question: "How do I manage orders?",
        answer: "Go to the 'Orders' section to view all orders. You can see pending orders that need approval, completed orders, and cancelled orders. Click 'Approve' to confirm an order.",
      },
      {
        question: "What happens after I approve an order?",
        answer: "Once you approve an order, the buyer will be notified and can proceed with payment. The order status will update to 'Completed' and you can track it in your order history.",
      },
      {
        question: "Can I cancel an order?",
        answer: "You can contact the buyer directly or reach out to support if you need to cancel an order. It's best to communicate with the buyer first to resolve any issues.",
      },
    ],
  },
  {
    category: "Test Drives",
    questions: [
      {
        question: "How do I create test drive slots?",
        answer: "Go to 'Test Drives' section, click 'Add Slot', select the vehicle model, location, date, and maximum bookings. Your slot will be available for buyers to book.",
      },
      {
        question: "How do I manage test drive bookings?",
        answer: "In the 'Test Drives' section, you can view all bookings. You can confirm, reject, or mark bookings as completed. You'll receive notifications for new bookings.",
      },
      {
        question: "What should I do when a test drive is completed?",
        answer: "After the test drive, mark the booking as 'Completed' in your dashboard. This helps track your test drive history and provides feedback for future bookings.",
      },
    ],
  },
  {
    category: "Repair Locations",
    questions: [
      {
        question: "How do I add repair locations?",
        answer: "Go to 'Repair Locations' section, click 'Add Location', enter the address, and verify it on the map. You can add multiple locations for your business.",
      },
      {
        question: "Can I edit or delete repair locations?",
        answer: "Yes, you can edit or delete repair locations from the 'Repair Locations' section. Click on a location to edit its details or delete it if no longer needed.",
      },
    ],
  },
  {
    category: "Account & Profile",
    questions: [
      {
        question: "How do I update my seller profile?",
        answer: "Go to 'Profile' section, click 'Edit Profile', and update your business information, contact details, and business logo. Save your changes when done.",
      },
      {
        question: "How do I manage my listings?",
        answer: "In 'EV Listings', you can view all your listings, edit them, update availability, or delete listings that are no longer available.",
      },
      {
        question: "How do I view my reviews?",
        answer: "Go to 'Reviews' section to see all reviews from buyers. You can respond to reviews and see your overall rating.",
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
      return sellerService.submitComplaint(data);
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
