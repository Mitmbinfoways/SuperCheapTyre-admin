"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Table, { Column } from "@/components/ui/table";
import Pagination from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import {
  GetContacts,
  type Contact as ContactType,
} from "@/services/ContactService";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import CommonDialog from "@/components/ui/Dialogbox"; // Added CommonDialog import
import { EyeIcon } from "@/components/Layouts/sidebar/icons"; // Added EyeIcon import
import Tooltip from "@/components/ui/Tooltip";
import { formatPhoneNumber } from "@/lib/utils";

type Contact = ContactType;

const ContactList: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentPage = Number(searchParams.get("page")) || 1;
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [viewContact, setViewContact] = useState<Contact | null>(null); // Added state for view contact
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);

  // Added function to handle view contact
  const handleViewContact = (contact: Contact) => {
    setViewContact(contact);
  };

  // Added function to close view modal
  const handleCloseViewModal = () => {
    setViewContact(null);
  };

  const columns: Column<Contact>[] = [
    { title: "SR.NO", key: "index", render: (item, index) => (currentPage - 1) * itemsPerPage + index + 1 },
    {
      title: "Name",
      key: "name",
      render: (item) => (
        <div className="line-clamp-1" title={item.name}>
          {item.name}
        </div>
      )
    },
    { title: "Phone", key: "phone", render: (item) => formatPhoneNumber(item.phone) },
    { title: "Email", key: "email", render: (item) => item.email },
    {
      title: "Date",
      key: "date",
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      title: "Message",
      key: "message",
      render: (item) => (
        <div
          className="max-w-36 truncate line-clamp-2 cursor-pointer"
          title={item.message}
        >
          {item.message}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (item) => (
        <div className="flex justify-center">
          {/* Added View Icon */}
          <button
            onClick={() => handleViewContact(item)}
            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            aria-label="View contact"
          >
            <Tooltip content="View query">
              <EyeIcon className="h-5 w-5" />
            </Tooltip>
          </button>
        </div>
      ),
    },
  ];

  const debounceSearch = useDebounce<string>(search, 300);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await GetContacts({
        currentPage,
        itemsPerPage,
        search: debounceSearch,
      });
      setContacts(res.data.items);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalItems(res.data.pagination.totalItems || 0);
    } catch (err: any) {
      setError("Failed to load contacts");
      Toast({
        message: err?.response?.data?.message || "Failed to load contacts",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-md dark:bg-gray-900">
      <h1 className="mb-6 text-xl sm:text-2xl font-semibold text-primary dark:text-gray-300 text-left">
        Manage Query ({totalItems || 0})
      </h1>
      <div className="mb-6 w-full sm:w-2/3 md:w-1/3">
        <TextField
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearch(e.target.value);
            const current = new URLSearchParams(Array.from(searchParams.entries()));
            current.set("page", "1");
            router.push(`${pathname}?${current.toString()}`);
          }}
          className="w-full"
        />
      </div>
      <div>
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="py-8 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState message="No contacts found." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table
                columns={columns}
                data={contacts}
                className="min-w-full dark:divide-gray-700"
              />
            </div>
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => {
                  const current = new URLSearchParams(Array.from(searchParams.entries()));
                  current.set("page", String(page));
                  router.push(`${pathname}?${current.toString()}`);
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Added View Contact Modal */}
      <CommonDialog
        isOpen={!!viewContact}
        onClose={handleCloseViewModal}
        title="Query"
        size="md"
      >
        {viewContact && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 max-h-20 overflow-auto">
                  {viewContact.name || "-"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {formatPhoneNumber(viewContact.phone) || "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewContact.email || "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</h3>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {viewContact.createdAt ? new Date(viewContact.createdAt).toLocaleString() : "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</h3>
                <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 p-3 bg-gray-50 dark:bg-gray-800 rounded max-h-56 overflow-y-auto">
                  {viewContact.message || "-"}
                </div>
              </div>
            </div>
          </div>
        )}
      </CommonDialog>
    </div>
  );
};

export default ContactList;