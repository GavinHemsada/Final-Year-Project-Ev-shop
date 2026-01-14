import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { financialService } from "../financialService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { selectActiveRoleId } from "@/context/authSlice";
import { Loader } from "@/components/Loader";
import type { AlertProps } from "@/types";
import { ChevronDownIcon, ChevronUpIcon } from "@/assets/icons/icons";

// Q&A Data for Financial Institutions
const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I register as a financial institution?",
        answer: "Navigate to 'Become a Financial Institution' from your profile menu. Fill out the registration form with your institution details, business information, and required documents. Once approved, you'll be able to create financing products.",
      },
      {
        question: "How do I create a financing product?",
        answer: "Go to the 'Products' section in your dashboard, click 'Add Product', and fill in the product details including interest rates, loan terms, minimum down payment, and eligibility criteria. Save the product to make it available to buyers.",
      },
      {
        question: "What information is required for a financing product?",
        answer: "You'll need product name, description, minimum and maximum interest rates, minimum and maximum loan terms (in months), minimum down payment, maximum loan amount, and eligibility requirements.",
      },
    ],
  },
  {
    category: "Applications Management",
    questions: [
      {
        question: "How do I view loan applications?",
        answer: "Go to the 'Applications' section to see all loan applications submitted for your products. You can filter by status (pending, approved, rejected) and view detailed application information.",
      },
      {
        question: "How do I approve or reject an application?",
        answer: "In the 'Applications' section, click on an application to view details. Click 'Approve' to approve the loan, or 'Reject' to reject it. For rejections, you'll be asked to provide a reason.",
      },
      {
        question: "What happens when I approve an application?",
        answer: "When you approve an application, the buyer receives a notification and email. You can set the approved loan amount and terms. The application status updates to 'Approved'.",
      },
      {
        question: "Can I edit an application after approval?",
        answer: "Once an application is approved or rejected, you cannot edit it. If you need to make changes, contact the buyer directly or reach out to support.",
      },
    ],
  },
  {
    category: "Products Management",
    questions: [
      {
        question: "How do I edit a financing product?",
        answer: "Go to 'Products' section, find the product you want to edit, and click 'Edit'. Update the product details and save your changes. The updated product will be immediately available to buyers.",
      },
      {
        question: "Can I deactivate a product?",
        answer: "Yes, you can edit a product and set it as inactive. Inactive products won't be shown to buyers but will remain in your product list for reference.",
      },
      {
        question: "How do I delete a product?",
        answer: "In the 'Products' section, click the delete icon next to the product. Note that products with active applications cannot be deleted. You'll need to resolve all applications first.",
      },
    ],
  },
  {
    category: "Dashboard & Analytics",
    questions: [
      {
        question: "What information is shown on my dashboard?",
        answer: "Your dashboard displays key metrics including total products, total applications, pending applications, and approved applications. You'll also see charts showing application trends and product distribution.",
      },
      {
        question: "How do I view application trends?",
        answer: "The dashboard includes a chart showing application trends over time. This helps you understand application patterns and make informed decisions about your products.",
      },
    ],
  },
  {
    category: "Account & Profile",
    questions: [
      {
        question: "How do I update my institution profile?",
        answer: "Go to 'Profile' section, click 'Edit Profile', and update your institution information, contact details, and business logo. Save your changes when done.",
      },
      {
        question: "How do I manage notifications?",
        answer: "Go to the 'Notifications' section to view all your notifications. You'll receive notifications for new loan applications and other important updates.",
      },
    ],
  },
];

export const HelpCenterPage: React.FC<{
  setAlert?: (alert: AlertProps | null) => void;
}> = ({ setAlert }) => {
  const institutionId = useAppSelector(selectActiveRoleId);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintData, setComplaintData] = useState({
    subject: "",
    message: "",
  });

  const submitComplaintMutation = useMutation({
    mutationFn: async (data: { user_id: string; subject: string; message: string }) => {
      return financialService.submitComplaint(data);
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
    if (!institutionId) {
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
      user_id: institutionId,
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
