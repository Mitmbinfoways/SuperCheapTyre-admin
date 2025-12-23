import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.FourCircle,
        items: [],
      },
      {
        title: "Customer List",
        url: "/customer",
        icon: Icons.User,
        items: []
      },
      {
        title: "Appointments",
        url: "/appointment",
        icon: Icons.CalendarDaysIcon,
        items: [],
      },
      {
        title: "Products",
        icon: Icons.ShoppingCartIcon,
        items: [
          {
            title: "Manage Products",
            url: "/products",
          },
          {
            title: "Create New Product",
            url: "/create-product",
          },
        ],
      },
      {
        title: "Services",
        icon: Icons.PackageIcon,
        items: [
          {
            title: "Manage Services",
            url: "/services",
          },
          {
            title: "Create New Service",
            url: "/create-service",
          },
        ],
      },
      {
        title: "Orders",
        url: "/orders",
        icon: Icons.OrdersIcon,
        items: [],
      },
      {
        title: "Invoice",
        url: "/invoice",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Manage Employee",
        url: "/add-employee",
        icon: Icons.UserPlusIcon,
        items: [],
      },
      {
        title: "Brands",
        url: "/brands",
        icon: Icons.StoreIcon,
        items: [
          {
            title: "Manage Brands",
            url: "/brands",
          },
          {
            title: "Create New Brand",
            url: "/create-brand",
          },
        ],
      },
      {
        title: "Blog",
        url: "/blog",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Manage Blog",
            url: "/blog",
          },
          {
            title: "Create New Blog",
            url: "/create-blog",
          },
        ],
      },
      {
        title: "Banners",
        icon: Icons.PhotoIcon,
        items: [
          {
            title: "Manage Banners",
            url: "/banners/list",
          },
          {
            title: "Create New Banner",
            url: "/banners",
          },
        ],
      },
      {
        title: "Manage Holidays",
        url: "/add-holidays",
        icon: Icons.CalendarPlusIcon,
        items: [],
      },
      {
        title: "Measurements",
        url: "/measurements",
        icon: Icons.RulerIcon,
        items: [
          {
            title: "Measurements List",
            url: "/measurements/show",
          },
          {
            title: "Add New Measurement",
            url: "/measurements",
          },
        ],
      },
      {
        title: "Manage TimeSlot",
        url: "/add-timeslot",
        icon: Icons.ClockIcon,
        items: [],
      },
      {
        title: "Manage Tax",
        url: "/tax",
        icon: Icons.TaxIcon,
        items: [],
      },
      {
        title: "Manage Query",
        url: "/query",
        icon: Icons.ChatBubbleLeftRightIcon,
        items: [],
      },
    ],
  },
];