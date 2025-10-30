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
import Skeleton from "@/components/ui/Skeleton";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

interface Blog {
  _id: string;
  title: string;
  formate: string;
  content: string;
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

  // Image preview states
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

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

  // Image preview handlers
  const handleOpenImagePreview = (blog: Blog) => {
    setPreviewBlog(blog);
    setCurrentImageIndex(0); // Start with the first image
    setShowImagePreview(true);
  };

  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    setPreviewBlog(null);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    if (previewBlog) {
      const imageCount = getBlogImageCount(previewBlog);
      if (currentImageIndex < imageCount - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      }
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Helper function to get image count for a blog
  const getBlogImageCount = (blog: Blog): number => {
    if (blog.formate === "carousel") {
      return blog.images.length;
    } else {
      return blog.items.length;
    }
  };

  // Helper function to get image URL for a blog at a specific index
  const getBlogImageUrlAtIndex = (blog: Blog, index: number): string => {
    if (blog.formate === "carousel") {
      if (blog.images[index]) {
        return `${process.env.NEXT_PUBLIC_API_URL}/${blog.images[index]}`;
      }
    } else {
      if (blog.items[index] && blog.items[index].image) {
        return (
          blog.items[index].imageUrl ||
          `${process.env.NEXT_PUBLIC_API_URL}/${blog.items[index].image}`
        );
      }
    }
    return "../../../public/default-image.png";
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
      render: (_, i) => ((currentPage - 1) * 10 + i + 1),
    },
    {
      title: "Image",
      key: "image",
      width: "80px",
      render: (item) => {
        let imageUrl: string = "../../../public/default-image.png";
        if (
          item.formate === "carousel" &&
          item.images.length > 0 &&
          item.images[0]
        ) {
          imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${item.images[0]}`;
        } else if (
          item.formate !== "carousel" &&
          item.items.length > 0 &&
          item.items[0].image
        ) {
          imageUrl =
            item.items[0].imageUrl ||
            `${process.env.NEXT_PUBLIC_API_URL}/${item.items[0].image}`;
        }
        return (
          <div 
            className="h-12 w-12 overflow-hidden rounded cursor-pointer"
            onClick={() => handleOpenImagePreview(item)}
          >
            <Image
              src={imageUrl}
              alt={item.title}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
        );
      },
    },
    {
      title: "Title",
      key: "title",
      width: "150px",
      render: (item) => (
        <div className="line-clamp-2" title={item.title}>
          {item.title}
        </div>
      ),
    },
    {
      title: "Content",
      key: "content",
      width: "180px",
      render: (item) => (
        <div className="line-clamp-3">
          {item.content ? item.content : item.items[0].content}
        </div>
      ),
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
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-gray-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-primary dark:text-gray-300">
          Manage Blogs
        </h1>
        <Button
          onClick={() => router.push("/create-blog")}
          className="w-full sm:w-auto"
        >
          Create New Blog
        </Button>
      </div>
      <div className="mb-4 w-full sm:w-2/3 md:w-1/2 lg:w-1/3">
        <TextField
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>
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
      
      {/* Image Preview Dialog with Carousel */}
      <CommonDialog
        isOpen={showImagePreview}
        onClose={handleCloseImagePreview}
        size="lg"
      >
        {previewBlog && (
          <div className="flex flex-col items-center">
            <div className="relative w-full flex justify-center items-center">
              <button
                onClick={handlePrevImage}
                disabled={currentImageIndex === 0}
                className={`absolute left-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-lg ${
                  currentImageIndex === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-white dark:hover:bg-gray-600"
                }`}
              >
               <FaAngleLeft size={18} />
              </button>
              
              <div className="flex justify-center items-center w-full">
                <Image
                  src={getBlogImageUrlAtIndex(previewBlog, currentImageIndex)}
                  alt={`${previewBlog.title} - Image ${currentImageIndex + 1}`}
                  width={500}
                  height={500}
                  className="rounded-lg object-contain max-h-[60vh]"
                />
              </div>
              
              <button
                onClick={handleNextImage}
                disabled={currentImageIndex === getBlogImageCount(previewBlog) - 1}
                className={`absolute right-0 top-1/2 transform -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-gray-700/80 shadow-lg ${
                  currentImageIndex === getBlogImageCount(previewBlog) - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-white dark:hover:bg-gray-600"
                }`}
              >
                 <FaAngleRight size={18} />
              </button>
            </div>
            
            {/* Image Counter */}
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {currentImageIndex + 1} of {getBlogImageCount(previewBlog)}
            </div>
            
            {/* Thumbnail Grid */}
            {getBlogImageCount(previewBlog) > 1 && (
              <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-2 max-w-full overflow-x-auto py-2">
                {Array.from({ length: getBlogImageCount(previewBlog) }).map((_, index) => (
                  <div
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-16 w-16 cursor-pointer rounded border-2 flex-shrink-0 ${
                      currentImageIndex === index
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <Image
                      src={getBlogImageUrlAtIndex(previewBlog, index)}
                      alt={`${previewBlog.title} - Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      className="h-full w-full rounded object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CommonDialog>
      
      <div className="overflow-x-auto">
        {loadingStates.fetchingBlogs ? (
          <Skeleton />
        ) : tableData.length === 0 ? (
          <EmptyState message="No blogs found." />
        ) : (
          <>
            <Table columns={columns} data={tableData} />
            <div className="mt-4 flex flex-col items-center sm:flex-row sm:justify-center">
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
