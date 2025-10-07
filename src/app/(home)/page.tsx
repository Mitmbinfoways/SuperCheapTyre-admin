"use client";
import { getDashboardCount } from "@/services/CreateProductService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiPackage,
  FiCalendar,
  FiMessageSquare,
  FiShoppingCart,
  FiUmbrella,
  FiUsers,
} from "react-icons/fi";
import { IoMdArrowForward } from "react-icons/io";

// Skeleton Card Component
const SkeletonCard = () => {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-md">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 h-14 w-14 animate-pulse rounded-full bg-gray-200"></div>
        <div className="mb-2 h-12 w-24 animate-pulse rounded bg-gray-200"></div>
        <div className="h-5 w-20 animate-pulse rounded bg-gray-200"></div>
      </div>
      <div className="mt-2 flex justify-end">
        <div className="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
      </div>
    </div>
  );
};

const Page = () => {
  const [count, setCount] = useState({
    productCount: 0,
    appointmentCount: 0,
    queryCount: 0,
    orderCount: 0,
    holidayCount: 0,
    employeeCount: 0,
  });

  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      setLoading(true);
      const res = await getDashboardCount();
      setCount(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  const stats = [
    {
      title: "Products",
      count: count.productCount,
      icon: FiPackage,
      bgColor: "bg-blue-300",
      lightBg: "bg-blue-50",
      link: "/products",
    },
    {
      title: "Appointments",
      count: count.appointmentCount,
      icon: FiCalendar,
      bgColor: "bg-purple-300",
      lightBg: "bg-purple-50",
      link: "/appointment",
    },
    {
      title: "Queries",
      count: count.queryCount,
      icon: FiMessageSquare,
      bgColor: "bg-green-300",
      lightBg: "bg-green-50",
      link: "/query",
    },
    {
      title: "Orders",
      count: count.orderCount,
      icon: FiShoppingCart,
      bgColor: "bg-orange-300",
      lightBg: "bg-orange-50",
      link: "/orders",
    },
    {
      title: "Holidays",
      count: count.holidayCount,
      icon: FiUmbrella,
      bgColor: "bg-pink-300",
      lightBg: "bg-pink-50",
      link: "/add-holidays",
    },
    {
      title: "Employees",
      count: count.employeeCount,
      icon: FiUsers,
      bgColor: "bg-indigo-300",
      lightBg: "bg-indigo-50",
      link: "/add-employee",
    },
  ];

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary dark:text-gray-300">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Overview of your business metrics
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            : stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className={`rounded-xl border border-gray-100 bg-white p-8 shadow-md transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`${stat.bgColor} mb-4 rounded-full p-4`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      <p className="mb-2 text-4xl font-bold text-gray-900 dark:text-gray-300">
                        {stat.count}
                      </p>

                      <p className="font-medium text-gray-600 dark:text-gray-300">
                        {stat.title}
                      </p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        className="flex items-center gap-2 text-primary dark:text-blue-400"
                        onClick={() => router.push(stat.link)}
                      >
                        View More <IoMdArrowForward />
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};

export default Page;
