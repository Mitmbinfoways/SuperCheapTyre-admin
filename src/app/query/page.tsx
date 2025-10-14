"use client";

import React, { useEffect, useState, useCallback } from "react";
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

type Contact = ContactType;

const ContactList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const itemsPerPage = 10;

  const columns: Column<Contact>[] = [
    { title: "Name", key: "name", render: (item) => item.name },
    { title: "Email", key: "email", render: (item) => item.email },
    {
      title: "Date",
      key: "date",
      render: (item) => new Date(item.createdAt).toLocaleString(),
    },
    { title: "Message", key: "message", render: (item) => item.message },
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
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <h1 className="mb-4 text-2xl font-semibold text-primary dark:text-gray-300">
        Contact Messages
      </h1>
      <div className="w-1/3">
        <TextField
          type="text"
          className="mb-4"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div>
        {loading ? (
          <Skeleton/>
        ) : error ? (
          <div className="py-8 text-center text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState message="No contacts found."/>
        ) : (
          <>
            <Table
              columns={columns}
              data={contacts}
              className="dark:divide-gray-700"
            />

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContactList;
