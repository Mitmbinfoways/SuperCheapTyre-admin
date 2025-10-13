"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdModeEdit } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Table, { Column } from "@/components/ui/table";
import Button from "@/components/ui/Button";
import CommonDialog from "@/components/ui/Dialogbox";
import Pagination from "@/components/ui/Pagination";
import { Toast } from "@/components/ui/Toast";
import { getAllBlogs, deleteBlog, updateBlog } from "@/services/BlogService";
import { useRouter } from "next/navigation";
import ToggleSwitch from "@/components/ui/Toggle";
import TextField from "@/components/ui/TextField";
import useDebounce from "@/hooks/useDebounce";
import EmptyState from "@/components/EmptyState";
import Image from "next/image";
import Badge from "@/components/ui/Badge";

interface Blog {
  _id: string;
  title: string;
  formate: string;
  images: string[];
  items: { image: string; imageUrl?: string; content: string }[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

type BlogWithId = Blog & { id: string };

type LoadingStates = {
  fetchingBlogs: boolean;
  deletingBlog: boolean;
  togglingStatus: boolean;
};

const BlogListPage: React.FC = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteBlogId, setDeleteBlogId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const itemsPerPage = 10;

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    fetchingBlogs: false,
    deletingBlog: false,
    togglingStatus: false,
  });

  const updateLoadingState = (key: keyof LoadingStates, value: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }));
  };

  const debounceSearch = useDebounce<string>(search, 300);

  const loadBlogs = useCallback(async () => {
    updateLoadingState("fetchingBlogs", true);
    try {
      const filter = {
        page: currentPage,
        limit: itemsPerPage,
        search: debounceSearch,
      };
      const data = await getAllBlogs(filter);
      const { blogs, pagination } = data.data;
      setBlogs(blogs as Blog[]);
      setTotalPages(pagination.totalPages);
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to load blogs",
      });
    } finally {
      updateLoadingState("fetchingBlogs", false);
    }
  }, [currentPage, itemsPerPage, debounceSearch]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  // confirm delete
  const confirmDeleteBlog = async () => {
    if (!deleteBlogId) return;
    updateLoadingState("deletingBlog", true);
    try {
      await deleteBlog(deleteBlogId);
      Toast({ type: "success", message: "Blog deleted successfully!" });
      handleCloseDeleteDialog();
      await loadBlogs();
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to delete blog",
      });
    } finally {
      updateLoadingState("deletingBlog", false);
    }
  };

  const handleEditBlog = (blog: Blog) => {
    router.push(`/create-blog?id=${blog._id}`);
  };

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteBlogId(null);
  };

  const handleToggleActive = async (blog: Blog) => {
    updateLoadingState("togglingStatus", true);
    try {
      const updatedStatus = !blog.isActive;
      await updateBlog(blog._id, { isActive: updatedStatus });

      setBlogs((prev) =>
        prev.map((b) =>
          b._id === blog._id ? { ...b, isActive: updatedStatus } : b,
        ),
      );

      Toast({
        type: "success",
        message: `Blog ${updatedStatus ? "activated" : "deactivated"} successfully!`,
      });
    } catch (e: any) {
      Toast({
        type: "error",
        message: e?.response?.data?.errorData || "Failed to update blog status",
      });
    } finally {
      updateLoadingState("togglingStatus", false);
    }
  };

  const tableData: BlogWithId[] = blogs.map((p) => ({ ...p, id: p._id }));

  const columns: Column<BlogWithId>[] = [
    {
      title: "Sr.No",
      key: "index",
      width: "60px",
      render: (_, i) => i + 1,
    },
    {
      title: "Image",
      key: "image",
      width: "80px",
      render: (item) => {
        // Check if there's an image to display
        let hasImage = false;
        let imageUrl = "";

        if (
          item.formate === "carousel" &&
          item.images.length > 0 &&
          item.images[0]
        ) {
          // For carousel, use the first image from images array
          hasImage = true;
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${item.images[0]}`;
        } else if (
          item.formate !== "carousel" &&
          item.items.length > 0 &&
          item.items[0].image
        ) {
          // For card/alternative/center, use the imageUrl if available, otherwise construct it
          hasImage = true;
          imageUrl =
            item.items[0].imageUrl ||
            `${process.env.NEXT_PUBLIC_API_URL}/${item.items[0].image}`;
        }
        if (!hasImage) {
          return (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-200 dark:bg-gray-700">
              <span className="text-center text-xs text-gray-500 dark:text-gray-400">
                No Image
              </span>
            </div>
          );
        }
        return (
          <div className="h-12 w-12 overflow-hidden rounded">
            <Image
              src={imageUrl}
              alt={item.title}
              width={48}
              height={48}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "h-full w-full bg-gray-200 flex items-center justify-center dark:bg-gray-700";
                  fallback.innerHTML =
                    '<span class="text-xs text-gray-500 dark:text-gray-400 text-center">No Image</span>';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        );
      },
    },
    {
      title: "Title",
      key: "title",
      width: "200px",
      render: (item) => (
        <div className="max-w-[200px] truncate" title={item.title}>
          {item.title}
        </div>
      ),
    },
    {
      title: "Tags",
      key: "tags",
      width: "150px",
      render: (item) => {
        let displayTags: string[] = [];
        if (Array.isArray(item.tags) && item.tags.length > 0) {
          if (typeof item.tags[0] === "string" && item.tags[0].includes(",")) {
            displayTags = item.tags[0].split(",").map((tag) => tag.trim());
          } else {
            displayTags = item.tags;
          }
        }
        return (
          <div className="flex flex-wrap gap-1">
            {displayTags && displayTags.length > 0 ? (
              displayTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">No tags</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Format",
      key: "formate",
      width: "120px",
      align: "center",
      render: (item) => <Badge label={item.formate} color={"purple"} />,
    },
    {
      title: "Status",
      key: "isActive",
      width: "100px",
      align: "center",
      render: (item) => (
        <Badge
          label={item.isActive ? "Active" : "Inactive"}
          color={item.isActive ? "green" : "red"}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "150px",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-end space-x-2">
          <MdModeEdit
            size={16}
            className="cursor-pointer text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            onClick={() => handleEditBlog(item)}
            title="Edit blog"
          />
          <FiTrash2
            size={16}
            className="cursor-pointer text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-500"
            onClick={() => {
              setDeleteBlogId(item._id);
              setShowDeleteDialog(true);
            }}
            title="Delete blog"
          />
          <ToggleSwitch
            checked={item.isActive}
            onChange={() => handleToggleActive(item)}
            disabled={loadingStates.togglingStatus}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Blogs
        </h1>
        <Button onClick={() => router.push("/create-blog")}>
          Create New Blog
        </Button>
      </div>

      <div className="w-1/3">
        <TextField
          type="text"
          className="mb-4"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* Delete Confirmation */}
      <CommonDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteBlog}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Are you sure you want to delete this blog?
        </p>
      </CommonDialog>

      {/* Table */}
      <div className="h-[calc(100vh-200px)] overflow-y-auto">
        {loadingStates.fetchingBlogs ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 rounded bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
        ) : tableData.length === 0 ? (
          <EmptyState message="No blogs found." className="h-full" />
        ) : (
          <>
            <Table columns={columns} data={tableData} />
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;
