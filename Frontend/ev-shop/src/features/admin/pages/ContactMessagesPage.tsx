import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../adminService";
import { PageLoader, Loader } from "@/components/Loader";
import { TrashIcon, CheckCircleIcon, EnvelopeIcon, SearchIcon } from "@/assets/icons/icons";
import { ReportGeneratorButton } from "@/features/admin/components/ReportGeneratorButton";
import { TopMessageAlerts, ConfirmAlert } from "@/components/MessageAlert";
import type { ConfirmAlertProps } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

type ContactTab = "all" | "unread" | "read";

export const ContactMessagesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<ContactTab>("all");
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [message, setMessage] = useState<{
    id: string;
    text: string;
    type: "success" | "warning" | "error";
  } | null>(null);
  const [confirmAlert, setConfirmAlert] = useState<ConfirmAlertProps | null>(
    null
  );
  const queryClient = useQueryClient();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["contactMessageStats"],
    queryFn: () => adminService.getContactMessageStats(),
    staleTime: 30000,
  });

  // Fetch all contact messages for counts
  const { data: allMessages } = useQuery({
    queryKey: ["adminAllContactMessages", "all"],
    queryFn: () => adminService.getAllContactMessages(undefined),
    staleTime: 30000,
  });

  // Fetch filtered contact messages for current tab
  const { data: contactMessages, isLoading } = useQuery({
    queryKey: ["adminAllContactMessages", activeTab],
    queryFn: async () => {
      const isRead = activeTab === "all" ? undefined : activeTab === "read";
      const result = await adminService.getAllContactMessages(isRead);
      return result;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllContactMessages"] });
      queryClient.invalidateQueries({ queryKey: ["contactMessageStats"] });
      setMessage({
        id: Date.now().toString(),
        text: "Contact message deleted successfully",
        type: "success",
      });
      if (selectedMessage) setSelectedMessage(null);
    },
    onError: (error: any) => {
      setMessage({
        id: Date.now().toString(),
        text: error.response?.data?.error || "Failed to delete contact message",
        type: "error",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => adminService.updateContactMessage(id, { isRead: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllContactMessages"] });
      queryClient.invalidateQueries({ queryKey: ["contactMessageStats"] });
      if (selectedMessage) {
        setSelectedMessage({ ...selectedMessage, isRead: true });
      }
      setMessage({
        id: Date.now().toString(),
        text: "Message marked as read",
        type: "success",
      });
    },
    onError: (error: any) => {
      setMessage({
        id: Date.now().toString(),
        text: error.response?.data?.error || "Failed to update message",
        type: "error",
      });
    },
  });

  const markAsRepliedMutation = useMutation({
    mutationFn: (id: string) => adminService.updateContactMessage(id, { isReplied: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllContactMessages"] });
      if (selectedMessage) {
        setSelectedMessage({ ...selectedMessage, isReplied: true });
      }
      setMessage({
        id: Date.now().toString(),
        text: "Message marked as replied",
        type: "success",
      });
    },
    onError: (error: any) => {
      setMessage({
        id: Date.now().toString(),
        text: error.response?.data?.error || "Failed to update message",
        type: "error",
      });
    },
  });

  const displayMessages = Array.isArray(contactMessages) ? contactMessages : [];

  const filteredMessages = displayMessages.filter((msg: any) => {
    const matchesSearch =
      msg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "read" && msg.isRead) ||
      (activeTab === "unread" && !msg.isRead);

    return matchesSearch && matchesTab;
  });

  const reportData = filteredMessages.map((msg: any) => ({
    "Name": msg.name || "N/A",
    "Email": msg.email || "N/A",
    "Phone": msg.phone || "N/A",
    "Subject": msg.subject || "N/A",
    "Message": msg.message || "N/A",
    "Status": msg.isRead ? "Read" : "Unread",
    "Replied": msg.isReplied ? "Yes" : "No",
    "Date": msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : "N/A",
  }));

  const handleDelete = (id: string) => {
    setConfirmAlert({
      id: Date.now().toString(),
      title: "Delete Contact Message",
      message: "Are you sure you want to delete this contact message? This action cannot be undone.",
      onConfirm: () => {
        deleteMessageMutation.mutate(id);
        setConfirmAlert(null);
      },
      onCancel: () => setConfirmAlert(null),
    });
  };

  const handleViewMessage = async (msg: any) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      markAsReadMutation.mutate(msg._id);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalCount = Array.isArray(allMessages) ? allMessages.length : 0;
  const unreadCount = Array.isArray(allMessages) ? allMessages.filter((m: any) => !m.isRead).length : 0;
  const readCount = totalCount - unreadCount;

  return (
    <div className="space-y-6">
      <TopMessageAlerts message={message} setMessage={setMessage} />
      <ConfirmAlert alert={confirmAlert} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contact Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and respond to customer inquiries
          </p>
        </div>
        {filteredMessages.length > 0 && (
          <ReportGeneratorButton
            data={reportData}
            filename="contact-messages-report"
            buttonText="Generate Report"
          />
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCount}</p>
            </div>
            <EnvelopeIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{unreadCount}</p>
            </div>
            <EnvelopeIcon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{readCount}</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        {(["all", "unread", "read"] as ContactTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, subject, or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Messages List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <PageLoader />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? "No messages match your search." : "No contact messages found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredMessages.map((msg: any) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                  selectedMessage?._id === msg._id
                    ? "border-blue-500 shadow-lg"
                    : msg.isRead
                    ? "border-gray-200 dark:border-gray-700"
                    : "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20"
                }`}
                onClick={() => handleViewMessage(msg)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {!msg.isRead && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">{msg.subject}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium">{msg.name}</span> • {msg.email}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
                      {msg.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(msg._id);
                    }}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-1">
            {selectedMessage ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Message Details</h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                        {selectedMessage.email}
                      </a>
                    </p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Phone</label>
                      <p className="text-gray-900 dark:text-white mt-1">
                        <a href={`tel:${selectedMessage.phone}`} className="text-blue-600 hover:underline">
                          {selectedMessage.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Subject</label>
                    <p className="text-gray-900 dark:text-white mt-1">{selectedMessage.subject}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Message</label>
                    <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date</label>
                    <p className="text-gray-900 dark:text-white mt-1">{formatDate(selectedMessage.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedMessage.isRead
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}>
                      {selectedMessage.isRead ? "Read" : "Unread"}
                    </span>
                    {selectedMessage.isReplied && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Replied
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {!selectedMessage.isRead && (
                    <button
                      onClick={() => markAsReadMutation.mutate(selectedMessage._id)}
                      disabled={markAsReadMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Mark as Read
                    </button>
                  )}
                  {!selectedMessage.isReplied && (
                    <button
                      onClick={() => markAsRepliedMutation.mutate(selectedMessage._id)}
                      disabled={markAsRepliedMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Mark as Replied
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedMessage._id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                    Delete Message
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
                Select a message to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
