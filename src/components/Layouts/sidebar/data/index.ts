import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Customer List",
        url: "/admin/customer",
        icon: Icons.User,
        items: []
      },
      {
        title: "Appointments",
        url: "/admin/appointment",
        icon: Icons.CalendarDaysIcon,
        items: [],
      },
      {
        title: "Products",
        icon: Icons.ShoppingCartIcon,
        items: [
          {
            title: "Manage Products",
            url: "/admin/products",
          },
          {
            title: "Create Product",
            url: "/admin/create-product",
          },
        ],
      },
      {
        title: "Services",
        icon: Icons.PackageIcon,
        items: [
          {
            title: "Manage Services",
            url: "/admin/services",
          },
          {
            title: "Create Service",
            url: "/admin/create-service",
          },
        ],
      },
      {
        title: "Orders",
        url: "/admin/orders",
        icon: Icons.OrdersIcon,
        items: [],
      },
      {
        title: "Invoice",
        url: "/admin/invoice",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Manage Employee",
        url: "/admin/add-employee",
        icon: Icons.UserPlusIcon,
        items: [],
      },
      {
        title: "Brands",
        url: "/admin/brands",
        icon: Icons.StoreIcon,
        items: [
          {
            title: "Manage Brands",
            url: "/admin/brands",
          },
          {
            title: "Create Brand",
            url: "/admin/create-brand",
          },
        ],
      },
      {
        title: "Blog",
        url: "/admin/blog",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Manage Blog",
            url: "/admin/blog",
          },
          {
            title: "Create Blog",
            url: "/admin/create-blog",
          },
        ],
      },
      {
        title: "Banners",
        icon: Icons.PhotoIcon,
        items: [
          {
            title: "Manage Banners",
            url: "/admin/banners/list",
          },
          {
            title: "Create Banner",
            url: "/admin/banners",
          },
        ],
      },
      {
        title: "Manage Holidays",
        url: "/admin/add-holidays",
        icon: Icons.CalendarPlusIcon,
        items: [],
      },
      {
        title: "Measurements",
        url: "/admin/measurements",
        icon: Icons.RulerIcon,
        items: [
          {
            title: "Measurements List",
            url: "/admin/measurements/show",
          },
          {
            title: "Add Measurement",
            url: "/admin/measurements",
          },
        ],
      },
      {
        title: "Manage TimeSlot",
        url: "/admin/add-timeslot",
        icon: Icons.ClockIcon,
        items: [],
      },
      {
        title: "Manage Query",
        url: "/admin/query",
        icon: Icons.ChatBubbleLeftRightIcon,
        items: [],
      },
    ],
  },
];